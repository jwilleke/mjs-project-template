// The sync body runs only inside a GitHub Actions job, so nothing here executes
// it. These are source assertions about the shape of the script — cheap, and
// they catch the class of defect that has actually escaped: a line that stages
// or pushes something it should not.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = readFileSync(join(root, 'utility/kit-sync.sh'), 'utf8');

const lineOf = (needle) =>
  script.split('\n').findIndex((line) => line.includes(needle) && !line.trimStart().startsWith('#'));

describe('kit-sync.sh staging', () => {
  // #68: both files are written to the repo root and neither is gitignored, so
  // `git add -A` committed them. deby carried them on master; mj-infra-flux
  // PR #175 shipped them and was caught only by coincidence.
  it('removes its own scratch files before staging', () => {
    const cleanup = lineOf('rm -f kit-status.json kit-lint.txt');
    const staging = lineOf('git add -A');

    expect(cleanup).toBeGreaterThan(-1);
    expect(staging).toBeGreaterThan(-1);
    expect(cleanup).toBeLessThan(staging);
  });

  it('still writes both scratch files it cleans up', () => {
    // If a future edit renames or drops one, the cleanup above goes stale
    // silently — it would keep passing while removing nothing.
    expect(script).toMatch(/>kit-status\.json/);
    expect(script).toMatch(/>kit-lint\.txt/);
  });

  // GITHUB_TOKEN may not push a workflow file; the whole push is rejected if it
  // tries. This cost a manual round across twelve repos when v1.10.0 promoted
  // kit-sync.yml to overwrite.
  it('excludes .github/workflows from staging', () => {
    expect(script).toMatch(/git add -A -- ':!\.github\/workflows'/);
  });
});

// #70: a base branch with required status checks can never merge this PR, because
// GITHUB_TOKEN does not start workflow runs for events it creates. The sync cannot
// fix that; these assert it does not stay silent about it.
describe('kit-sync.sh required-status-check warning', () => {
  it('asks the API which checks the base branch requires', () => {
    expect(script).toContain('required_status_checks');
    expect(script).toMatch(/branches\/\$BASE\/protection/);
  });

  it('does not fail the sync when the branch has no protection', () => {
    // An unprotected branch 404s here. Without the redirect and the `?` on
    // `.contexts[]?`, `set -e` would abort a sync that had nothing wrong with it.
    // The call spans a line continuation, so match the statement, not one line.
    expect(script).toMatch(/required_status_checks[\s\S]{0,120}2>\/dev\/null/);
    expect(script).toContain('.contexts[]?');
  });

  it('names the unblock steps, not just the problem', () => {
    expect(script).toContain('cannot merge on its own');
    expect(script).toContain('close and reopen this PR');
    expect(script).toMatch(/push any commit/);
  });

  it('adds the warning only when checks are actually required', () => {
    const guard = script.split('\n').findIndex((l) => l.includes('if [ -n "$required" ]'));

    expect(guard).toBeGreaterThan(-1);
  });
});
