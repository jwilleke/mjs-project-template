#!/usr/bin/env node
// lint-templates.mjs — lint what the kit SHIPS, not just what it stores.
//
// The kit's own `npm run lint:md` globs `**/*.md`, which never matches
// `templates/*.tmpl`. So the files that become a consumer's TODO.md, CLAUDE.md,
// AGENTS.md and project log were the only markdown in the repo nobody linted —
// and they shipped violating the kit's own rules, turning the markdown-lint
// workflow the kit ALSO seeds red on a consumer's first commit.
//
// This renders each template the way install-kit.sh does and lints the result
// with the kit's own .markdownlint.jsonc.
//
// Usage: node utility/lint-templates.mjs

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templates = join(root, 'templates');

/** install-kit.sh substitutes these when it creates a file from a template. */
function render(name) {
  return readFileSync(join(templates, name), 'utf8')
    .replace(/YYYY-MM-DD/g, '2026-01-01')
    .replace(/KIT-VERSION/g, 'v0.0.0-0-g0000000');
}

const out = mkdtempSync(join(tmpdir(), 'kit-templates-'));

try {
  writeFileSync(join(out, 'TODO.md'), render('TODO.md.tmpl'));
  writeFileSync(join(out, 'CLAUDE.md'), render('CLAUDE.md.tmpl'));
  writeFileSync(join(out, 'project_log.md'), render('project_log.md.tmpl'));

  // AGENTS.md is assembled from three pieces, and its lint result depends on
  // the assembly — two H1s only collide once the parts are concatenated.
  writeFileSync(
    join(out, 'AGENTS.md'),
    [
      render('agents-frontmatter.md.tmpl'),
      '<!-- KIT:START v0.0.0-0-g0000000 — managed by mjs-project-template -->',
      render('agents-boilerplate.md'),
      '<!-- KIT:END -->',
      '',
      render('agents-stub.md')
    ].join('\n')
  );

  cpSync(join(root, '.markdownlint.jsonc'), join(out, '.markdownlint.jsonc'));

  // The kit's own binary, by path: the temp dir has no node_modules, so `npx`
  // there resolves nothing and fails in a way that looks like a lint failure.
  const result = spawnSync(
    join(root, 'node_modules', '.bin', 'markdownlint'),
    ['*.md', '--config', '.markdownlint.jsonc'],
    { cwd: out, encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] }
  );

  if (result.status !== 0) {
    console.error('\ntemplates fail the kit\'s own markdown rules — fix templates/, not this script');
    process.exit(1);
  }

  console.log('templates lint clean (rendered as a consumer would receive them)');
} finally {
  rmSync(out, { recursive: true, force: true });
}
