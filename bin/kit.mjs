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
//     --label <name>    label to apply when the issue is CREATED (repeatable; default: P2, kit)
//     --no-labels       create the issue with no labels
//     --fail-on-drift   exit 1 when behind, for repos that want drift to gate CI
//     --json            machine-readable output
//
// Exit codes:
//   0  the check ran and said its piece — INCLUDING when the repo is behind.
//      Drift is expected: every repo goes stale the moment the kit is tagged, so a
//      red X here would be permanent, weekly, and on a repo where nothing is broken.
//      The tracking issue is the notification; red is reserved for real breakage.
//   1  behind, and --fail-on-drift was asked for.
//   2  the check could NOT do its job — bad usage, no kit to compare against, or
//      --report-issue was unable to file the issue that is supposed to carry the news.
//
// No dependencies, and none are wanted: this runs via `actions/checkout` in
// repos that are C++, Go, Python, and Shell. GitHub's runners already ship Node,
// so those repos pay nothing for it.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ISSUE_MARKER = 'kit-check:drift';
const KIT_REPO = 'jwilleke/mjs-project-template';

// The kit's own /pstatus labels any issue with no placement label `needs-triage`,
// so an unlabelled drift issue would arrive in every consumer already flagged as
// awaiting a human decision. It is not: it is a known, recurring chore of a known
// shape. `P2` is the kit's own grade for "real work, not urgent, nothing broken".
//
// Deliberately just the grade. A dedicated `kit` label was tried and dropped: the
// marker below guarantees ONE drift issue per repo forever, and a label exists to
// filter a class, not a set of size one. It would also have to be defined in every
// consumer before it did anything, which is a chore to remove a chore.
export const DEFAULT_ISSUE_LABELS = ['P2'];

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
    // Not a shrug. A marker predating the first tag is a bare SHA, so this is
    // the oldest class of install there is — and reading it as "no idea, carry
    // on" is how three consumers went a year without a single notification.
    lines.push(
      `${target} has an UNPARSEABLE KIT:START marker (${local}), so it cannot be proven current — treating it as behind the kit (${kit})`
    );
    lines.push('A bare commit SHA means the kit was installed before it was ever tagged. Re-sync to replace it.');
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

/**
 * The version stamped into a packed copy of the kit. A published package has no
 * git history, so without this the checker would fall back to the latest *tag*
 * — which is older than any `git describe` marker in a downstream repo, and
 * every consumer would be told it is somehow ahead of the kit.
 */
export function stampedVersion(kitDir, read = readFileSync, exists = existsSync) {
  const stamp = join(kitDir, 'kit-version.txt');
  if (!exists(stamp)) return null;

  const raw = read(stamp, 'utf8').trim();
  return parseKitVersion(raw) ? raw : null;
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
  let failOnDrift = false;
  let labels = null;   // null = "not asked for", so the default set still applies

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--kit') kitDir = argv[++i];
    else if (arg === '--repo') repo = argv[++i];
    else if (arg === '--json') json = true;
    else if (arg === '--report-issue') reportIssue = true;
    else if (arg === '--fail-on-drift') failOnDrift = true;
    else if (arg === '--no-labels') labels = [];
    else if (arg === '--label') (labels ??= []).push(argv[++i]);
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

  // Ordered by precision: a checkout knows exactly, a packed copy carries a
  // stamp, and the tags API is the last resort because it only sees releases.
  let kit = kitVersionFrom(kitDir) ?? stampedVersion(kitDir);
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

  // `unknown` counts. It means the marker could not be parsed, so the repo
  // cannot be shown to be current — and a check that stays silent when it does
  // not know is worse than no check, because it reads as a pass.
  const behind =
    status === 'behind' || status === 'unmarked' || status === 'unknown' || missing.length > 0;

  console.log(json ? JSON.stringify(result, null, 2) : formatReport(result));

  if (reportIssue) {
    // A failure to file THROWS, and main() turns that into exit 2. Once the issue
    // is the only notification, silently failing to open it is the real breakage.
    const outcome = await reportDrift(result, behind, { labels: labels ?? DEFAULT_ISSUE_LABELS });
    if (outcome) console.log(outcome);
  }

  // Green on drift, on purpose — see the exit-code note at the top of this file.
  return behind && failOnDrift ? 1 : 0;
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
    'Nothing is broken: `Kit Check` passes green on drift, and this issue is the whole notification.',
    'Closing it is fine — the check reopens it on the next run if the repo is still behind.',
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
    const error = new Error(`GitHub API ${init.method ?? 'GET'} ${path}: ${response.status}`);
    error.status = response.status;   // callers need 422 to tell a bad label from a real failure
    throw error;
  }

  return response.json();
}

/**
 * POST the issue, retrying without labels if the repo has not defined them.
 *
 * GitHub rejects the WHOLE create when a label does not exist, so a repo that
 * never ran utility/sync-labels.sh would lose its notification over a grade.
 * The notification is the point; the grade is a convenience.
 */
async function createIssue(repo, token, payload) {
  try {
    return await api(`/repos/${repo}/issues`, token, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.status !== 422 || !payload.labels?.length) throw error;

    console.log(
      `note: ${repo} does not define all of [${payload.labels.join(', ')}] — filing unlabelled ` +
        '(run utility/sync-labels.sh to define them)'
    );

    const { labels, ...unlabelled } = payload;
    return api(`/repos/${repo}/issues`, token, {
      method: 'POST',
      body: JSON.stringify(unlabelled)
    });
  }
}

export async function reportDrift(result, behind, options = {}) {
  const labels = options.labels ?? DEFAULT_ISSUE_LABELS;

  // Being unable to file is only a failure when there is something to file.
  const cannot = (what) => {
    if (!behind) return `note: --report-issue needs ${what}; nothing to report anyway`;
    throw new Error(`--report-issue needs ${what}, and this repo is behind — the drift went unreported`);
  };

  const token = process.env.GITHUB_TOKEN;
  if (!token) return cannot('GITHUB_TOKEN');
  if (!result.repo) return cannot('--repo or $GITHUB_REPOSITORY');

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
    // Labels are set on CREATE only. Re-asserting them here would fight a human
    // who deliberately regraded the issue — someone who marked a drift `deferred`
    // during a freeze must stay deferred.
    await api(`/repos/${result.repo}/issues/${existing.number}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ title, body })
    });
    return `updated #${existing.number}`;
  }

  const payload = labels.length ? { title, body, labels } : { title, body };
  const created = await createIssue(result.repo, token, payload);

  return `opened #${created.number}`;
}

// --- entry point -------------------------------------------------------------

function usage() {
  console.error(
    'usage: kit.mjs check [target-dir] [--kit <dir>] [--repo <owner/name>]\n' +
      '                    [--report-issue] [--label <name>]... [--no-labels]\n' +
      '                    [--fail-on-drift] [--json]'
  );
  return 2;
}

async function main(argv) {
  const command = argv[0];
  if (command === 'check') return check(argv.slice(1));
  if (command === '--help' || command === '-h' || command === undefined) return usage();

  console.error(`unknown command: ${command}`);
  return usage();
}

/**
 * True when this file is the entry point. npm installs a bin as a symlink, so
 * `process.argv[1]` is the link in node_modules/.bin while `import.meta.url` is
 * the resolved file — comparing them raw makes the installed CLI silently do
 * nothing and exit 0.
 */
function isEntryPoint() {
  const entry = process.argv[1];
  if (!entry) return false;

  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error.message);
      process.exit(2);
    }
  );
}
