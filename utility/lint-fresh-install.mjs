#!/usr/bin/env node
// lint-fresh-install.mjs — run install-kit.sh into an empty repo and check the result.
//
// utility/lint-templates.mjs lints each template rendered on its own. This lints
// the thing a consumer actually receives: a full install, in file layout, with
// every seeded workflow and issue template present and .gitignore already
// applied. All three failures in issue #49 only appeared at that level —
// on a repo's FIRST use, which is exactly when nobody is watching the build.
//
// Checks:
//   1. every markdown file the install produced passes the kit's own rules
//   2. `private/` is ignored BEFORE private/project_log.md is created, so a
//      stray `git add -A` cannot track the personal journal
//   3. the install is idempotent — a second run changes nothing
//
// Usage: node utility/lint-fresh-install.mjs

import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = mkdtempSync(join(tmpdir(), 'kit-fresh-'));

const failures = [];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    ...options
  });
  if (result.error) throw result.error;
  return result;
}

function check(label, ok, detail) {
  if (ok) {
    console.log(`  ok   ${label}`);
    return;
  }
  console.error(`  FAIL ${label}`);
  if (detail) console.error(detail.replace(/^/gm, '       '));
  failures.push(label);
}

try {
  run('git', ['init', '-q']);
  console.log(`fresh install into ${repo}`);

  const install = run(join(root, 'install-kit.sh'), [repo]);
  check('install-kit.sh exits 0', install.status === 0, install.stderr);

  // A warning on a CLEAN install means the kit is shipping its own collision —
  // there is no repo content here for it to collide with.
  check(
    'install emits no warnings on an empty repo',
    !/WARNING/.test(install.stderr),
    install.stderr
  );

  // The kit's own binary by path: the temp repo has no node_modules, so `npx`
  // there resolves nothing and fails in a way that reads as a lint failure.
  const lint = run(join(root, 'node_modules', '.bin', 'markdownlint'), [
    '**/*.md',
    '--config',
    join(root, '.markdownlint.jsonc')
  ]);
  check('every installed markdown file lints clean', lint.status === 0, lint.stdout + lint.stderr);

  check('private/project_log.md was created', existsSync(join(repo, 'private/project_log.md')));

  // `.gitignore` has no effect on an already-tracked file, so the ordering
  // between "ignore private/" and "create private/project_log.md" decides
  // whether a personal journal starts pushing itself to the remote.
  const ignored = run('git', ['check-ignore', '-q', 'private/project_log.md']);
  check('private/project_log.md is ignored by the .gitignore the same run wrote', ignored.status === 0);

  run('git', ['add', '-A']);
  const staged = run('git', ['diff', '--cached', '--name-only']).stdout;
  check(
    'a git add -A does not stage the private journal',
    !staged.split('\n').includes('private/project_log.md'),
    staged
  );

  // Commit first, so the second run's effect is visible as a diff rather than
  // hidden among the untracked files of a repo that has never committed.
  run('git', ['-c', 'user.email=kit@example.invalid', '-c', 'user.name=kit', 'commit', '-qm', 'fresh install']);

  const second = run(join(root, 'install-kit.sh'), [repo]);
  check('a second install exits 0', second.status === 0, second.stderr);

  const dirty = run('git', ['status', '--porcelain']).stdout.trim();
  check('the second install changes nothing', dirty === '', dirty);

  // Issue #50: the managed block owns one heading string in every repo that
  // installs the kit. When a repo's own content below KIT:END uses that same
  // string, markdownlint MD024 fails — and it used to fail silently, after the
  // sync had already landed. The installer must say so at sync time.
  const agents = join(repo, 'AGENTS.md');
  const managedHeading = readFileSync(join(root, 'templates/agents-boilerplate.md'), 'utf8')
    .split('\n')
    .find((line) => line.startsWith('## '));

  appendFileSync(agents, `\n${managedHeading}\n\nRepo content that collides.\n`);
  const colliding = run(join(root, 'install-kit.sh'), [repo]);

  check(
    'a heading collision below KIT:END is warned about at sync time',
    /WARNING/.test(colliding.stderr) && colliding.stderr.includes(managedHeading),
    colliding.stderr
  );
} finally {
  rmSync(repo, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\na fresh install is not clean: ${failures.length} check(s) failed`);
  console.error('fix the kit, not this script — a consumer hits this on their first commit');
  process.exit(1);
}

console.log('\nfresh install is clean (lint, gitignore ordering, idempotence)');
