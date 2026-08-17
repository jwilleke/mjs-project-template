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

import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const lint = run(join(root, 'node_modules', '.bin', 'markdownlint-cli2'), []);
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

  // The warning has to fire BEFORE anything is written, or it only tells you
  // about a file you have already changed. It compares the incoming boilerplate
  // against the target, so --dry-run sees exactly what a real run would.
  const dry = run(join(root, 'install-kit.sh'), ['--dry-run', repo]);

  check(
    'the collision warning fires in --dry-run too',
    /WARNING/.test(dry.stderr) && dry.stderr.includes(managedHeading),
    dry.stderr
  );
  // #54: the repo must be able to sync itself, so the workflow that does it has
  // to arrive — and it has to be valid YAML, which nothing else here checks.
  const syncWorkflow = join(repo, '.github/workflows/kit-sync.yml');
  check('the self-sync workflow is seeded', existsSync(syncWorkflow));
  check(
    'kit-sync.yml has no cron — it must not fire while nobody is looking',
    !/^[ \t]*schedule:/m.test(readFileSync(syncWorkflow, 'utf8')),
    'a schedule reappeared in the template'
  );
  // #61: the kit checkout lives inside the work tree, so a blank `git add -A`
  // stages it as an embedded git repository and every sync commit carries a
  // gitlink to the kit.
  check(
    ".gitignore excludes the workflow's own kit checkout",
    readFileSync(join(repo, '.gitignore'), 'utf8').includes('.kit-sync/'),
    readFileSync(join(repo, '.gitignore'), 'utf8')
  );
  check(
    'kit-sync.yml never stages the kit checkout',
    /git add -A -- ':!\.kit-sync'/.test(readFileSync(syncWorkflow, 'utf8')),
    'a blank `git add -A` reappeared'
  );
  // A repo that has not ticked "Allow GitHub Actions to create and approve pull
  // requests" would otherwise go red on every push, for a reason that means
  // neither "checked" nor "could not run".
  check(
    'kit-sync.yml degrades rather than failing when it may not open a PR',
    /not permitted to create or approve pull requests/.test(readFileSync(syncWorkflow, 'utf8')),
    'the permission failure is no longer handled'
  );

  check(
    'kit-sync.yml asks for no secret beyond GITHUB_TOKEN',
    !/secrets\.(?!GITHUB_TOKEN)/.test(readFileSync(syncWorkflow, 'utf8')),
    'the workflow now requires a PAT'
  );

  // Four consumers carried a .markdownlintignore whose entries markdownlint-cli2
  // silently stopped honouring when v1.4.0 moved to it — 25 exemptions dropped
  // without a word, surfacing later as generated output failing prose rules.
  writeFileSync(join(repo, '.markdownlintignore'), '# a comment\ndocs/api/generated/**\n');
  const unhonoured = run(join(root, 'install-kit.sh'), ['--dry-run', repo]);
  check(
    'an unhonoured .markdownlintignore is reported',
    /markdownlint-cli2 does not read that file/.test(unhonoured.stderr),
    unhonoured.stderr
  );
  rmSync(join(repo, '.markdownlintignore'), { force: true });

  // #61: as create-if-absent, a bug in this workflow was permanent downstream —
  // the kit that wrote it could never replace it.
  writeFileSync(syncWorkflow, '# a stale copy with the bug in it\n');
  run(join(root, 'install-kit.sh'), [repo]);
  check(
    'a stale kit-sync.yml is replaced, not preserved',
    !readFileSync(syncWorkflow, 'utf8').startsWith('# a stale copy'),
    readFileSync(syncWorkflow, 'utf8').slice(0, 60)
  );

  // #53: the manifest is the record of what landed. A stamp says what a file
  // claims to be; a hash says what it is.
  const manifest = JSON.parse(readFileSync(join(repo, '.agent-kit.json'), 'utf8'));
  check('a manifest is written', manifest.schema === 1 && Boolean(manifest.installed));
  check(
    'the manifest records a tag, not a git describe ref',
    /^v\d+\.\d+\.\d+$/.test(manifest.installed),
    manifest.installed
  );
  check('the manifest hashes every managed file it installed', Object.keys(manifest.files).length > 5);

  const target = Object.keys(manifest.files)[0];
  appendFileSync(join(repo, target), '\nlocal edit\n');
  const tampered = run(process.execPath, [join(root, 'bin/kit.mjs'), 'check', repo, '--kit', root]);
  check('a locally edited managed file is reported', /modified: /.test(tampered.stdout), tampered.stdout);
  run('git', ['checkout', '--', target]);

  // #58: a licence is text the repo holds, not text it wrote. Renumbering a GPL
  // copy's sections to satisfy MD029 edits a legal instrument.
  writeFileSync(join(repo, 'LICENSE.md'), '# License\n\n14. a\n15. b\n\nSee `show w\' for details.\n');
  const withLicence = run(join(root, 'node_modules', '.bin', 'markdownlint-cli2'), []);
  check('a LICENSE.md is not linted', withLicence.status === 0, withLicence.stdout + withLicence.stderr);

  // #56: a repo that already owns a command name keeps it. The kit yields and
  // installs alongside — clobbering someone's release tooling to deliver a
  // command they did not ask for is the worst outcome available here.
  const own = join(repo, '.claude/commands/semver.md');
  writeFileSync(own, '# Semver\n\nThis repo has its own release command.\n');
  const yielding = run(join(root, 'install-kit.sh'), [repo]);

  check(
    'a repo-owned command name is not clobbered',
    readFileSync(own, 'utf8').includes('This repo has its own release command'),
    yielding.stderr
  );
  check(
    "the kit's copy is installed alongside as -kit",
    existsSync(join(repo, '.claude/commands/semver-kit.md')),
    yielding.stdout
  );
  check(
    'the collision is announced, not silent',
    /NOTE:.*semver\.md/.test(yielding.stderr),
    yielding.stderr
  );

  // Once suffixed, always suffixed: reverting to the plain name on a later sync
  // would clobber the very file this behaviour exists to protect.
  const again = run(join(root, 'install-kit.sh'), [repo]);
  check(
    'a later sync keeps yielding rather than reclaiming the name',
    readFileSync(own, 'utf8').includes('This repo has its own release command'),
    again.stdout
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
