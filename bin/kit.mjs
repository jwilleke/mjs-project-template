#!/usr/bin/env node
// kit.mjs — report whether a repo is behind the mjs agent kit.
//
// A downstream repo has no way to learn that a newer kit exists: the kit is
// pushed to it by an operator, and nothing reaches back. This tells the repo
// itself, from its own CI, so noticing does not depend on someone remembering
// to run a sweep.
//
// Usage:
//   node bin/kit.mjs check [target-dir] [options]
//
//     --kit <dir>       kit checkout to compare against (default: this script's repo)
//     --repo <o/n>      owner/name for --report-issue (default: $GITHUB_REPOSITORY)
//     --report-issue    open or update ONE tracking issue when behind (needs $GITHUB_TOKEN)
//     --json            machine-readable output
//
// Exit codes: 0 up to date, 1 behind or missing managed files, 2 usage/error.
//
// No dependencies, and none are wanted: this runs via `actions/checkout` in
// repos that are C++, Go, Python, and Shell. GitHub's runners already ship Node,
// so those repos pay nothing for it.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ISSUE_MARKER = 'kit-check:drift';
const KIT_REPO = 'jwilleke/mjs-project-template';

// --- pure helpers (unit-tested) ---------------------------------------------

/** `v1.0.0-55-gc4b69c8` -> { tag: [1,0,0], commits: 55, raw }. null when unparseable. */
export function parseKitVersion(raw) {
  if (typeof raw !== 'string') return null;

  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-(\d+)-g[0-9a-f]+)?$/.exec(raw.trim());
  if (!match) return null;

  return {
    tag: [Number(match[1]), Number(match[2]), Number(match[3])],
    commits: match[4] === undefined ? 0 : Number(match[4]),
    raw: raw.trim()
  };
}

/**
 * -1 if a is older than b, 0 if equal, 1 if newer, null if either is unparseable.
 * Compares the tag triple first, then the commit count since that tag.
 */
export function compareKitVersions(a, b) {
  const left = parseKitVersion(a);
  const right = parseKitVersion(b);
  if (!left || !right) return null;

  for (let i = 0; i < 3; i++) {
    if (left.tag[i] !== right.tag[i]) return left.tag[i] < right.tag[i] ? -1 : 1;
  }

  if (left.commits !== right.commits) return left.commits < right.commits ? -1 : 1;
  return 0;
}

/** Pull the version out of an AGENTS.md `KIT:START` marker. null when absent. */
export function parseMarkerVersion(agentsMd) {
  if (typeof agentsMd !== 'string') return null;

  const match = /<!--\s*KIT:START\s+(\S+)/.exec(agentsMd);
  return match ? match[1] : null;
}

/** Parse kit-files.tsv into { behavior, path, template, group } rows. */
export function parseManifest(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [behavior, path, template, group] = line.split('\t');
      return { behavior, path, template: template === '-' ? null : template, group };
    })
    .filter((row) => row.path);
}

/** The human-readable report. Kept pure so its wording is testable. */
export function formatReport({ status, local, kit, missing, target }) {
  const lines = [];

  if (status === 'behind') {
    lines.push(`${target} is BEHIND the kit: ${local} -> ${kit}`);
  } else if (status === 'current') {
    lines.push(`${target} is up to date with the kit (${kit})`);
  } else if (status === 'ahead') {
    lines.push(`${target} reports a NEWER kit than the one checked (${local} > ${kit})`);
  } else if (status === 'unmarked') {
    lines.push(`${target} has no KIT:START marker — the kit has never been installed here`);
  } else {
    lines.push(`${target}: cannot compare versions (local ${local}, kit ${kit})`);
  }

  if (missing.length) {
    lines.push('', 'Kit-managed files missing from this repo:');
    for (const path of missing) lines.push(`  - ${path}`);
  }

  return lines.join('\n');
}

// --- side-effecting bits -----------------------------------------------------

function kitVersionFrom(kitDir) {
  try {
    return execFileSync('git', ['-C', kitDir, 'describe', '--tags', '--long'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

async function latestKitTag() {
  const response = await fetch(`https://api.github.com/repos/${KIT_REPO}/tags?per_page=1`, {
    headers: { accept: 'application/vnd.github+json' }
  });
  if (!response.ok) throw new Error(`GitHub tags API: ${response.status}`);

  const tags = await response.json();
  return tags[0] ? `${tags[0].name}-0-g0000000` : null;
}

function inspect(targetDir, kitDir) {
  const agentsPath = join(targetDir, 'AGENTS.md');
  const local = existsSync(agentsPath)
    ? parseMarkerVersion(readFileSync(agentsPath, 'utf8'))
    : null;

  const manifestPath = join(kitDir, 'kit-files.tsv');
  const manifest = existsSync(manifestPath)
    ? parseManifest(readFileSync(manifestPath, 'utf8'))
    : [];

  // Only files the kit would have written unprompted count as missing. A repo
  // that deleted a seeded issue template made a choice; one with no pstatus.md
  // never got the kit.
  const missing = manifest
    .filter((row) => row.behavior === 'overwrite')
    .map((row) => row.path)
    .filter((path) => !existsSync(join(targetDir, path)));

  return { local, missing };
}

async function check(argv) {
  let target = null;
  let kitDir = null;
  let repo = process.env.GITHUB_REPOSITORY ?? null;
  let json = false;
  let reportIssue = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--kit') kitDir = argv[++i];
    else if (arg === '--repo') repo = argv[++i];
    else if (arg === '--json') json = true;
    else if (arg === '--report-issue') reportIssue = true;
    else if (arg.startsWith('-')) {
      console.error(`unknown option: ${arg}`);
      return 2;
    } else if (target === null) target = arg;
    else {
      console.error(`unexpected argument: ${arg}`);
      return 2;
    }
  }

  target = resolve(target ?? process.cwd());
  kitDir = resolve(kitDir ?? join(dirname(fileURLToPath(import.meta.url)), '..'));

  // The kit carries no KIT:START marker of its own, so without this it would
  // report itself as never installed and fail its own CI.
  if (target === kitDir) {
    console.log(`${target} is the kit itself — nothing to compare`);
    return 0;
  }

  const { local, missing } = inspect(target, kitDir);

  let kit = kitVersionFrom(kitDir);
  if (!kit) {
    try {
      kit = await latestKitTag();
    } catch (error) {
      console.error(`cannot resolve the kit version: ${error.message}`);
      return 2;
    }
  }
  if (!kit) {
    console.error('cannot resolve the kit version from the checkout or the tags API');
    return 2;
  }

  let status;
  if (!local) status = 'unmarked';
  else {
    const order = compareKitVersions(local, kit);
    if (order === null) status = 'unknown';
    else if (order < 0) status = 'behind';
    else if (order > 0) status = 'ahead';
    else status = 'current';
  }

  const result = { status, local, kit, missing, target, repo };
  const behind = status === 'behind' || status === 'unmarked' || missing.length > 0;

  console.log(json ? JSON.stringify(result, null, 2) : formatReport(result));

  if (reportIssue) {
    const outcome = await reportDrift(result, behind);
    if (outcome) console.log(outcome);
  }

  return behind ? 1 : 0;
}

// --- issue reporting ---------------------------------------------------------

export function issueBody(result) {
  const lines = [
    formatReport(result),
    '',
    'This repo installs the [mjs agent kit](https://github.com/jwilleke/mjs-project-template).',
    'A newer version exists than the one recorded in this repo\'s `AGENTS.md` `KIT:START` marker.',
    '',
    'To update, from a checkout of the kit:',
    '',
    '```bash',
    `./install-kit.sh --pr ${result.target ? '/path/to/this/repo' : '.'}`,
    '```',
    '',
    'Closing this issue is fine — the check reopens it on the next run if the repo is still behind.',
    '',
    `<!-- ${ISSUE_MARKER} -->`
  ];

  return lines.join('\n');
}

// Actions sets GITHUB_API_URL; honouring it also makes the write path testable
// against a local stub, and works on GitHub Enterprise.
const apiBase = () => process.env.GITHUB_API_URL ?? 'https://api.github.com';

async function api(path, token, init = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${init.method ?? 'GET'} ${path}: ${response.status}`);
  }

  return response.json();
}

export async function reportDrift(result, behind) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return 'note: --report-issue needs GITHUB_TOKEN; skipped';
  if (!result.repo) return 'note: --report-issue needs --repo or $GITHUB_REPOSITORY; skipped';

  const open = await api(`/repos/${result.repo}/issues?state=open&per_page=100`, token);
  // One issue, forever. A check that opens a fresh issue per run trains people
  // to ignore it, which is worse than not reporting at all.
  const existing = open.find(
    (issue) => !issue.pull_request && (issue.body ?? '').includes(ISSUE_MARKER)
  );

  if (!behind) {
    return existing
      ? `up to date — leaving #${existing.number} open for a human to close`
      : 'up to date — no issue needed';
  }

  const title = `[kit] behind ${result.kit} (repo at ${result.local ?? 'no marker'})`;
  const body = issueBody(result);

  if (existing) {
    await api(`/repos/${result.repo}/issues/${existing.number}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ title, body })
    });
    return `updated #${existing.number}`;
  }

  const created = await api(`/repos/${result.repo}/issues`, token, {
    method: 'POST',
    body: JSON.stringify({ title, body })
  });

  return `opened #${created.number}`;
}

// --- entry point -------------------------------------------------------------

function usage() {
  console.error('usage: kit.mjs check [target-dir] [--kit <dir>] [--repo <owner/name>] [--report-issue] [--json]');
  return 2;
}

async function main(argv) {
  const command = argv[0];
  if (command === 'check') return check(argv.slice(1));
  if (command === '--help' || command === '-h' || command === undefined) return usage();

  console.error(`unknown command: ${command}`);
  return usage();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error.message);
      process.exit(2);
    }
  );
}
