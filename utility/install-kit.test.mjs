// #79: install-kit.sh reads "Allow GitHub Actions to create and approve pull
// requests" for the target repo, because nothing else can — the workflow's
// GITHUB_TOKEN lacks the admin scope the endpoint needs. These run the real
// installer in --dry-run against an empty repo, with a stub `gh` on PATH
// standing in for the API, so no network or token is involved.

import { afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const work = mkdtempSync(join(tmpdir(), 'install-kit-test-'));

afterAll(() => rmSync(work, { recursive: true, force: true }));

// `answer` is what the stub prints for the workflow-permissions call; null makes
// it fail the way a 403 or a missing remote does.
function nextSteps(answer) {
  const target = mkdtempSync(join(work, 'repo-'));
  execFileSync('git', ['init', '-q', target]);

  const bin = mkdtempSync(join(work, 'bin-'));
  const stub = join(bin, 'gh');
  writeFileSync(
    stub,
    answer === null
      ? '#!/bin/sh\necho "HTTP 403" >&2\nexit 1\n'
      : `#!/bin/sh\ncase "$*" in *actions/permissions/workflow*) echo ${answer} ;; *) exit 1 ;; esac\n`
  );
  chmodSync(stub, 0o755);

  const out = execFileSync(join(root, 'install-kit.sh'), ['--dry-run', target], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }
  });
  return out.slice(out.lastIndexOf('Next:'));
}

describe('install-kit.sh Actions PR setting (#79)', () => {
  it('confirms the setting when it is on', () => {
    const out = nextSteps('true');
    expect(out).toContain('(checked) Actions may create pull requests here');
    expect(out).not.toContain('Workflow permissions');
  });

  it('says the setting is off, and how to fix it, when it is off', () => {
    // The WARNING lines go to stderr; stdout must still carry the fix.
    const out = nextSteps('false');
    expect(out).toContain('Workflow permissions:');
    expect(out).not.toContain('could not read it');
  });

  it('does not claim the setting is off when it cannot be read', () => {
    const out = nextSteps(null);
    expect(out).toContain('could not read it from here');
    expect(out).not.toContain('(checked)');
  });
}, 120_000);
