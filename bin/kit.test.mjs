import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

import {
  compareKitVersions,
  formatReport,
  issueBody,
  parseKitVersion,
  parseManifest,
  parseMarkerVersion,
  reportDrift
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
      ['# a comment', '', 'overwrite\t.markdownlint.jsonc\t-\tcanonical', 'create-if-absent-stamped\tTODO.md\tTODO.md.tmpl\tdocs'].join('\n')
    );

    expect(rows).toEqual([
      { behavior: 'overwrite', path: '.markdownlint.jsonc', template: null, group: 'canonical' },
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
      'seed',
      'create-if-absent',
      'create-if-absent-stamped',
      'managed-block'
    ]);
    const rows = parseManifest(readFileSync('kit-files.tsv', 'utf8'));

    expect(rows.filter((row) => !known.has(row.behavior))).toEqual([]);
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

  it('lists missing managed files', () => {
    const report = formatReport({ ...base, status: 'current', missing: ['.claude/commands/wrap.md'] });

    expect(report).toContain('Kit-managed files missing');
    expect(report).toContain('- .claude/commands/wrap.md');
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

  /** Stand up a stub GitHub API returning `openIssues` from the list endpoint. */
  async function stubApi(openIssues) {
    calls = [];
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        calls.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null });
        res.setHeader('content-type', 'application/json');
        if (req.method === 'GET') return res.end(JSON.stringify(openIssues));
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

  it('skips rather than throwing when no token is present', async () => {
    delete process.env.GITHUB_TOKEN;

    expect(await reportDrift(behindResult, true)).toContain('GITHUB_TOKEN');
  });
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
