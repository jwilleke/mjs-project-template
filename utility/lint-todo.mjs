#!/usr/bin/env node
// lint-todo.mjs — enforce the TODO.md band rules that /pstatus only states in prose.
//
// `/pstatus` says a band contains its open items or the absence marker, that the
// file carries no history, and that no reference appears twice. All three were
// prose in a command file, and agents read past prose: jwilleke/mjs-ha's TODO.md
// grew six lines of scanner narrative under an empty P0 band, and this repo's did
// the same on the same day. The operator caught both by reading the file, which
// is not a check.
//
// Rules, in the order they are reported:
//   1. only frontmatter, the H1, band headings and band content exist
//   2. the bands are the expected ones, in the expected order
//   3. a band holds list items OR exactly `*None.*` — never both, never prose
//   4. every item is a link line whose visible number matches its URL
//   5. no issue or PR is referenced twice in the file
//
// Usage: node utility/lint-todo.mjs [path]   (default: TODO.md)

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BANDS = [
  '## 🔴 P0 — Security & Critical',
  '## 🟠 P1',
  '## 🟡 P2',
  '## 🔵 In review',
  '## ⏸ Deferred',
  '## ❓ Needs triage'
];

const ABSENT = '*None.*';

// `- [#12](https://github.com/o/r/issues/12) — title …`
const ITEM = /^- \[#(\d+)\]\((https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/(?:issues|pull)\/(\d+))\) — \S/;

export function lintTodo(text) {
  const problems = [];
  const lines = text.split('\n');
  const say = (n, message) => problems.push(`TODO.md:${n} ${message}`);

  let i = 0;
  if (lines[0] === '---') {
    i = lines.indexOf('---', 1);
    if (i < 0) return ['TODO.md:1 frontmatter opens with --- but never closes'];
    i += 1;
  }
  while (lines[i] !== undefined && (lines[i].trim() === '' || lines[i].trim().startsWith('<!--'))) i++;

  // `# TODO` or `# TODO — owner/repo`; the suffix is a repo's own choice.
  if (!(lines[i] ?? '').startsWith('# TODO')) {
    say(i + 1, `expected a "# TODO" heading, found ${JSON.stringify(lines[i] ?? '')}`);
    return problems;
  }
  i++;

  const seen = new Map();
  const found = [];
  let band = null;
  let items = 0;
  let absent = 0;

  const closeBand = (n) => {
    if (!band) return;
    if (items && absent) say(n, `band "${band}" has both items and ${ABSENT} — pick one`);
    if (!items && !absent) say(n, `band "${band}" is empty; write ${ABSENT} to state the absence`);
    if (absent > 1) say(n, `band "${band}" repeats ${ABSENT}`);
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;

    if (line.trim() === '' || line.trim().startsWith('<!--')) continue;

    if (line.startsWith('## ')) {
      closeBand(n);
      band = line;
      items = 0;
      absent = 0;
      found.push(line);
      if (!BANDS.includes(line)) say(n, `unknown band ${JSON.stringify(line)}`);
      continue;
    }

    if (!band) {
      say(n, 'content outside any band — TODO.md holds ranked work and nothing else');
      continue;
    }

    if (line === ABSENT) {
      absent++;
      continue;
    }

    if (!line.startsWith('- ')) {
      // The failure this file exists to catch: prose under a band heading.
      say(n, `prose in band "${band}" — TODO.md carries no narrative, only items or ${ABSENT}`);
      continue;
    }

    items++;
    const match = ITEM.exec(line);
    if (!match) {
      say(n, 'item is not `- [#N](https://github.com/owner/repo/issues|pull/N) — title`');
      continue;
    }

    const [, shown, url, target] = match;
    if (shown !== target) say(n, `link text #${shown} does not match its URL (#${target})`);
    if (seen.has(url)) say(n, `${url} already appears on line ${seen.get(url)}`);
    else seen.set(url, n);
  }
  closeBand(lines.length);

  const missing = BANDS.filter((b) => !found.includes(b));
  if (missing.length) problems.push(`TODO.md: missing band(s): ${missing.join(', ')}`);

  const ordered = found.filter((b) => BANDS.includes(b));
  const expected = BANDS.filter((b) => ordered.includes(b));
  if (ordered.join('|') !== expected.join('|')) {
    problems.push('TODO.md: bands are out of order — P0, P1, P2, In review, Deferred, Needs triage');
  }

  return problems;
}

// Only when run as a command. Importing this from a test must not read a file
// or call process.exit.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2] ?? 'TODO.md';
  const problems = lintTodo(readFileSync(path, 'utf8'));

  if (problems.length) {
    for (const problem of problems) console.error(problem);
    console.error(`\n${path} does not follow the band rules in .claude/commands/pstatus.md`);
    process.exit(1);
  }

  console.log(`${path} follows the band rules`);
}
