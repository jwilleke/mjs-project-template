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
