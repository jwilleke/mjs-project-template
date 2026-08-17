import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  collisionBody,
  compareKitTags,
  compareKitVersions,
  DEFAULT_ISSUE_LABELS,
  formatReport,
  formatStaleness,
  issueBody,
  parseKitVersion,
  parseManifest,
  parseManifestFile,
  parseMarkerVersion,
  reportCollisions,
  reportDrift,
  stampedVersion,
  suffixedPath
} from './kit.mjs';

describe('parseKitVersion', () => {
  it('parses a git describe --long version', () => {
    expect(parseKitVersion('v1.0.0-55-gc4b69c8')).toEqual({
      tag: [1, 0, 0],
      commits: 55,
      raw: 'v1.0.0-55-gc4b69c8'
    });
  });

  it('parses a clean tag as zero commits since it', () => {
    expect(parseKitVersion('v1.2.3')).toEqual({ tag: [1, 2, 3], commits: 0, raw: 'v1.2.3' });
  });

  it.each(['', 'main', 'c4b69c8', '1.0', undefined, null, 42])('rejects %s', (raw) => {
    expect(parseKitVersion(raw)).toBeNull();
  });
});

describe('compareKitVersions', () => {
  it('orders by commit count within the same tag', () => {
    expect(compareKitVersions('v1.0.0-43-gaaaaaaa', 'v1.0.0-55-gbbbbbbb')).toBe(-1);
    expect(compareKitVersions('v1.0.0-55-gbbbbbbb', 'v1.0.0-43-gaaaaaaa')).toBe(1);
  });

  it('orders by tag before commit count', () => {
    expect(compareKitVersions('v1.0.0-99-gaaaaaaa', 'v1.1.0-0-gbbbbbbb')).toBe(-1);
    expect(compareKitVersions('v2.0.0', 'v1.9.9-500-gbbbbbbb')).toBe(1);
  });

  it('treats the same version as equal regardless of sha', () => {
    expect(compareKitVersions('v1.0.0-55-gc4b69c8', 'v1.0.0-55-gdeadbee')).toBe(0);
  });

  it('returns null when either side is unparseable', () => {
    expect(compareKitVersions('nonsense', 'v1.0.0')).toBeNull();
    expect(compareKitVersions('v1.0.0', 'nonsense')).toBeNull();
  });
});

describe('compareKitTags', () => {
  // `git describe` moves on every kit commit, so under the old comparison every
  // consumer went behind within minutes of any push — a README typo included.
  it('ignores commits since the tag', () => {
    expect(compareKitTags('v1.6.0', 'v1.6.0-40-gabc1234')).toBe(0);
  });

  it('still reports a release behind', () => {
    expect(compareKitTags('v1.5.0', 'v1.6.0-0-gabc1234')).toBe(-1);
  });

  it('still reports ahead', () => {
    expect(compareKitTags('v1.7.0', 'v1.6.0-2-gabc1234')).toBe(1);
  });

  it('returns null when either side is unparseable', () => {
    expect(compareKitTags('3aa1bb4', 'v1.6.0')).toBeNull();
  });
});

describe('parseManifestFile', () => {
  it('reads a manifest', () => {
    expect(parseManifestFile('{"schema":1,"installed":"v1.6.0"}').installed).toBe('v1.6.0');
  });

  it('rejects one with no installed version, rather than half-trusting it', () => {
    expect(parseManifestFile('{"schema":1}')).toBeNull();
  });

  it('rejects malformed JSON instead of throwing', () => {
    expect(parseManifestFile('{oops')).toBeNull();
  });
});

describe('parseMarkerVersion', () => {
  it('reads the version out of a real KIT:START marker', () => {
    const agents = [
      '---',
      'kit_version: "v1.0.0-43-g7cf371c"',
      '---',
      '',
      '<!-- KIT:START v1.0.0-43-g7cf371c — managed by mjs-project-template; edit below the KIT:END marker -->',
      '- some rule',
      '<!-- KIT:END -->'
    ].join('\n');

    expect(parseMarkerVersion(agents)).toBe('v1.0.0-43-g7cf371c');
  });

  it('returns null when the kit was never installed', () => {
    expect(parseMarkerVersion('# AGENTS\n\nnothing here\n')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseMarkerVersion(undefined)).toBeNull();
  });
});

describe('parseManifest', () => {
  it('parses behaviour, path, template and group', () => {
    const rows = parseManifest(
      ['# a comment', '', 'overwrite\t.markdownlint-cli2.jsonc\t-\tcanonical', 'create-if-absent-stamped\tTODO.md\tTODO.md.tmpl\tdocs'].join('\n')
    );

    expect(rows).toEqual([
      { behavior: 'overwrite', path: '.markdownlint-cli2.jsonc', template: null, group: 'canonical' },
      { behavior: 'create-if-absent-stamped', path: 'TODO.md', template: 'TODO.md.tmpl', group: 'docs' }
    ]);
  });

  it('parses this repo\'s real kit-files.tsv', () => {
    const rows = parseManifest(readFileSync('kit-files.tsv', 'utf8'));

    expect(rows.length).toBeGreaterThan(10);
    expect(rows.every((row) => row.path && row.behavior && row.group)).toBe(true);
    expect(rows.some((row) => row.path === '.claude/commands/pstatus.md')).toBe(true);
  });

  it('gives every row in the real manifest a known behaviour', () => {
    const known = new Set([
      'overwrite',
      'overwrite-or-suffix',
      'seed',
      'create-if-absent',
      'create-if-absent-stamped',
      'managed-block'
    ]);
    const rows = parseManifest(readFileSync('kit-files.tsv', 'utf8'));

    expect(rows.filter((row) => !known.has(row.behavior))).toEqual([]);
  });
});

describe('stampedVersion', () => {
  // A published package has no git history, so the stamp is the only thing
  // standing between a consumer and being told it is ahead of the kit.
  const stub = (contents) => ({
    read: () => contents,
    exists: () => contents !== null
  });

  it('reads a packed kit-version.txt', () => {
    const { read, exists } = stub('v1.0.0-58-g2b628bc\n');

    expect(stampedVersion('/pkg', read, exists)).toBe('v1.0.0-58-g2b628bc');
  });

  it('returns null when the file is absent', () => {
    const { read, exists } = stub(null);

    expect(stampedVersion('/pkg', read, exists)).toBeNull();
  });

  it('rejects a stamp that is not a kit version', () => {
    const { read, exists } = stub('not a version\n');

    expect(stampedVersion('/pkg', read, exists)).toBeNull();
  });
});

describe('formatReport', () => {
  const base = { local: 'v1.0.0-43-g7cf371c', kit: 'v1.0.0-55-gc4b69c8', missing: [], target: '/repo' };

  it('names both versions when behind', () => {
    expect(formatReport({ ...base, status: 'behind' })).toBe(
      '/repo is BEHIND the kit: v1.0.0-43-g7cf371c -> v1.0.0-55-gc4b69c8'
    );
  });

  it('says so when current', () => {
    expect(formatReport({ ...base, status: 'current' })).toContain('up to date');
  });

  it('distinguishes a repo the kit was never installed into', () => {
    expect(formatReport({ ...base, local: null, status: 'unmarked' })).toContain('never been installed');
  });

  it('treats an unparseable marker as behind rather than shrugging', () => {
    // A marker predating the first tag is a bare SHA. Reporting "cannot
    // compare" and exiting quietly is how geohazardwatch, mjs-media-handling
    // and fairways-gen2-website went a year with no notification at all.
    const report = formatReport({ ...base, local: '3aa1bb4', status: 'unknown' });

    expect(report).toContain('UNPARSEABLE');
    expect(report).toContain('treating it as behind');
    expect(report).toContain('installed before it was ever tagged');
  });

  it('lists missing managed files', () => {
    const report = formatReport({ ...base, status: 'current', missing: ['.claude/commands/wrap.md'] });

    expect(report).toContain('Kit-managed files missing');
    expect(report).toContain('- .claude/commands/wrap.md');
  });
});

describe('suffixedPath', () => {
  it('inserts the suffix before the extension', () => {
    expect(suffixedPath('.claude/commands/semver.md')).toBe('.claude/commands/semver-kit.md');
  });

  it('appends when there is no extension', () => {
    expect(suffixedPath('Makefile')).toBe('Makefile-kit');
  });
});

describe('collisionBody', () => {
  const collision = { path: '.claude/commands/semver.md', installed: '.claude/commands/semver-kit.md' };

  it('carries a marker scoped to the colliding path', () => {
    expect(collisionBody(collision)).toContain('kit-check:collision:.claude/commands/semver.md');
  });

  it('leads with the reassurance, since nothing is broken', () => {
    expect(collisionBody(collision)).toContain('Nothing of yours was overwritten');
  });
});

describe('formatStaleness', () => {
  // A local mjs-ha 122 commits behind origin produced a whole fleet report that
  // was wrong, and nothing in the output hinted at it.
  it('warns that the report describes disk, not the remote', () => {
    const warning = formatStaleness({ upstream: 'origin/master', behind: 122 });

    expect(warning).toContain('122 commits behind origin/master');
    expect(warning).toContain('NOT what is on the remote');
  });

  it('gets the singular right', () => {
    expect(formatStaleness({ upstream: 'origin/main', behind: 1 })).toContain('1 commit behind');
  });

  it('says nothing when the checkout is current or has no upstream', () => {
    expect(formatStaleness({ upstream: 'origin/master', behind: 0 })).toBeNull();
    expect(formatStaleness({ upstream: null, behind: 0 })).toBeNull();
  });
});

describe('reportDrift', () => {
  const behindResult = {
    status: 'behind',
    local: 'v1.0.0-43-g7cf371c',
    kit: 'v1.0.0-55-gc4b69c8',
    missing: [],
    target: '/repo',
    repo: 'owner/name'
  };

  let server;
  let calls;

  /**
   * Stand up a stub GitHub API returning `openIssues` from the list endpoint.
   * `rejectLabels` makes POSTs carrying labels fail 422, the way GitHub does when
   * a repo has not defined them.
   */
  async function stubApi(openIssues, { rejectLabels = false } = {}) {
    calls = [];
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const parsed = body ? JSON.parse(body) : null;
        calls.push({ method: req.method, url: req.url, body: parsed });
        res.setHeader('content-type', 'application/json');
        if (req.method === 'GET') return res.end(JSON.stringify(openIssues));
        if (rejectLabels && parsed?.labels?.length) {
          res.statusCode = 422;
          return res.end(JSON.stringify({ message: 'Validation Failed' }));
        }
        res.end(JSON.stringify({ number: 77 }));
      });
    });

    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    process.env.GITHUB_API_URL = `http://127.0.0.1:${server.address().port}`;
    process.env.GITHUB_TOKEN = 'stub-token';
  }

  afterEach(async () => {
    delete process.env.GITHUB_API_URL;
    delete process.env.GITHUB_TOKEN;
    if (server) await new Promise((done) => server.close(done));
    server = undefined;
  });

  it('opens one issue when no tracking issue exists', async () => {
    await stubApi([]);

    expect(await reportDrift(behindResult, true)).toBe('opened #77');

    const posts = calls.filter((call) => call.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(posts[0].body.title).toBe('[kit] behind v1.0.0-55-gc4b69c8 (repo at v1.0.0-43-g7cf371c)');
    expect(posts[0].body.body).toContain('kit-check:drift');
  });

  it('updates the existing issue instead of opening a second one', async () => {
    await stubApi([{ number: 12, body: 'stale text\n<!-- kit-check:drift -->' }]);

    expect(await reportDrift(behindResult, true)).toBe('updated #12');

    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(1);
    expect(calls.find((call) => call.method === 'PATCH').url).toContain('/issues/12');
  });

  it('ignores pull requests carrying the marker', async () => {
    await stubApi([{ number: 9, body: '<!-- kit-check:drift -->', pull_request: { url: 'x' } }]);

    expect(await reportDrift(behindResult, true)).toBe('opened #77');
  });

  it('writes nothing when the repo is up to date', async () => {
    await stubApi([{ number: 12, body: '<!-- kit-check:drift -->' }]);

    expect(await reportDrift({ ...behindResult, status: 'current' }, false)).toContain('#12');
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
  });

  it('grades the issue on creation so /pstatus does not call it untriaged', async () => {
    await stubApi([]);

    await reportDrift(behindResult, true);

    const post = calls.find((call) => call.method === 'POST');
    expect(post.body.labels).toEqual(DEFAULT_ISSUE_LABELS);
  });

  it('never re-asserts labels on update — a human regrade must stick', async () => {
    await stubApi([{ number: 12, body: '<!-- kit-check:drift -->', labels: [{ name: 'deferred' }] }]);

    await reportDrift(behindResult, true);

    expect(calls.find((call) => call.method === 'PATCH').body.labels).toBeUndefined();
  });

  it('honours an explicit label set', async () => {
    await stubApi([]);

    await reportDrift(behindResult, true, { labels: ['chore'] });

    expect(calls.find((call) => call.method === 'POST').body.labels).toEqual(['chore']);
  });

  it('files unlabelled rather than losing the notification to an undefined label', async () => {
    await stubApi([], { rejectLabels: true });

    expect(await reportDrift(behindResult, true)).toBe('opened #77');

    const posts = calls.filter((call) => call.method === 'POST');
    expect(posts).toHaveLength(2);
    expect(posts[1].body.labels).toBeUndefined();
  });

  it('throws when it is behind and cannot file — the issue IS the notification', async () => {
    delete process.env.GITHUB_TOKEN;

    await expect(reportDrift(behindResult, true)).rejects.toThrow('GITHUB_TOKEN');
  });

  it('does not throw for a missing token when there is nothing to report', async () => {
    delete process.env.GITHUB_TOKEN;

    expect(await reportDrift({ ...behindResult, status: 'current' }, false)).toContain('GITHUB_TOKEN');
  });
});

describe('reportCollisions', () => {
  const collided = {
    repo: 'owner/name',
    collisions: [{ path: '.claude/commands/semver.md', installed: '.claude/commands/semver-kit.md' }]
  };

  let server;
  let calls;

  async function stubApi(existingIssues) {
    calls = [];
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        calls.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null });
        res.setHeader('content-type', 'application/json');
        if (req.method === 'GET') return res.end(JSON.stringify(existingIssues));
        res.end(JSON.stringify({ number: 91 }));
      });
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    process.env.GITHUB_API_URL = `http://127.0.0.1:${server.address().port}`;
    process.env.GITHUB_TOKEN = 'stub-token';
  }

  afterEach(async () => {
    delete process.env.GITHUB_API_URL;
    delete process.env.GITHUB_TOKEN;
    if (server) await new Promise((done) => server.close(done));
    server = undefined;
  });

  it('files one issue on the first occurrence', async () => {
    await stubApi([]);

    expect(await reportCollisions(collided)).toContain('opened #91');

    const post = calls.find((call) => call.method === 'POST');
    expect(post.body.title).toContain('semver-kit.md');
    expect(post.body.labels).toEqual(DEFAULT_ISSUE_LABELS);
  });

  it('never files a second one for the same path', async () => {
    await stubApi([{ number: 5, body: 'x\n<!-- kit-check:collision:.claude/commands/semver.md -->' }]);

    expect(await reportCollisions(collided)).toBeNull();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  // A closed collision issue means the operator decided. Re-opening the question
  // every week would be worse than never asking it.
  it('respects a closed issue as a decision already made', async () => {
    await stubApi([
      { number: 5, state: 'closed', body: '<!-- kit-check:collision:.claude/commands/semver.md -->' }
    ]);

    expect(await reportCollisions(collided)).toBeNull();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  // Unlike drift, the issue is never PATCHed: the operator writes decisions
  // underneath it, and a weekly rewrite would stamp on them.
  it('never updates an existing collision issue', async () => {
    await stubApi([{ number: 5, body: '<!-- kit-check:collision:.claude/commands/semver.md -->' }]);

    await reportCollisions(collided);

    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(0);
  });

  it('says nothing when there are no collisions', async () => {
    await stubApi([]);

    expect(await reportCollisions({ repo: 'owner/name', collisions: [] })).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe('exit codes', () => {
  // Drift is expected — every repo goes stale the moment the kit is tagged — so a
  // red X here would be permanent, weekly, and on a repo where nothing is broken.
  const kit = resolve('.');

  function check(args) {
    return spawnSync(process.execPath, [resolve('bin/kit.mjs'), 'check', ...args], {
      encoding: 'utf8'
    });
  }

  const unmarked = join(tmpdir(), `agent-kit-unmarked-${process.pid}`);

  afterEach(() => rmSync(unmarked, { recursive: true, force: true }));

  it('exits 0 on drift', () => {
    mkdirSync(unmarked, { recursive: true });

    const result = check([unmarked, '--kit', kit]);

    expect(result.stdout).toContain('never been installed');
    expect(result.status).toBe(0);
  }, 20_000);

  it('exits 1 on drift when --fail-on-drift is asked for', () => {
    mkdirSync(unmarked, { recursive: true });

    expect(check([unmarked, '--kit', kit, '--fail-on-drift']).status).toBe(1);
  }, 20_000);

  it('exits 2 on an unknown option — bad usage is a real failure', () => {
    expect(check(['--nonsense']).status).toBe(2);
  }, 20_000);

  // The pre-tag installs. Silence here read as a pass for a year.
  it('reports a bare-SHA marker as behind instead of passing silently', () => {
    mkdirSync(unmarked, { recursive: true });
    writeFileSync(
      join(unmarked, 'AGENTS.md'),
      '<!-- KIT:START 3aa1bb4 — managed by mjs-project-template -->\n<!-- KIT:END -->\n'
    );

    const result = check([unmarked, '--kit', kit]);

    expect(result.stdout).toContain('UNPARSEABLE');
    expect(result.status).toBe(0);
    expect(check([unmarked, '--kit', kit, '--fail-on-drift']).status).toBe(1);
  }, 20_000);
});

describe('invoked through a bin symlink', () => {
  // npm installs a bin as a symlink into node_modules/.bin. An entry-point
  // guard that compares argv[1] to import.meta.url without resolving it makes
  // the installed CLI print nothing and exit 0 — a check that silently passes.
  const link = join(tmpdir(), `agent-kit-entry-${process.pid}`);

  afterEach(() => rmSync(link, { force: true }));

  it('still runs when argv[1] is a symlink to it', () => {
    symlinkSync(resolve('bin/kit.mjs'), link);

    const result = spawnSync(process.execPath, [link], { encoding: 'utf8' });

    expect(result.stderr).toContain('usage:');
    expect(result.status).toBe(2);
  }, 20_000);
});

describe('issueBody', () => {
  it('carries the marker so the next run finds the same issue', () => {
    const body = issueBody({
      status: 'behind',
      local: 'v1.0.0-43-g7cf371c',
      kit: 'v1.0.0-55-gc4b69c8',
      missing: [],
      target: '/repo'
    });

    expect(body).toContain('kit-check:drift');
    expect(body).toContain('install-kit.sh --pr');
  });
});
