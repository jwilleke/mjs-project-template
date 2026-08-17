import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import { lintTodo } from './lint-todo.mjs';

const BANDS = [
  '## 🔴 P0 — Security & Critical',
  '## 🟠 P1',
  '## 🟡 P2',
  '## 🔵 In review',
  '## ⏸ Deferred',
  '## ❓ Needs triage'
];

/** A valid file, with `overrides` replacing a band's body. */
function todo(overrides = {}) {
  const body = BANDS.map((band) => `${band}\n\n${overrides[band] ?? '*None.*'}\n`).join('\n');
  return `---\ntitle: TODO\n---\n\n# TODO\n\n${body}`;
}

const ITEM = '- [#53](https://github.com/jwilleke/mjs-project-template/issues/53) — an open thing';

describe('lintTodo', () => {
  it('accepts a file whose bands hold items or the absence marker', () => {
    expect(lintTodo(todo({ '## 🟠 P1': ITEM }))).toEqual([]);
  });

  // The failure this exists for: mjs-ha's P0 band carried six lines of scanner
  // narrative under "None open.", and this repo's did the same the same day.
  it('rejects prose in a band', () => {
    const problems = lintTodo(todo({ '## 🔴 P0 — Security & Critical': 'No open Dependabot alerts.' }));

    expect(problems.join('\n')).toContain('carries no narrative');
  });

  it('rejects an absence marker that is not the absence marker', () => {
    expect(lintTodo(todo({ '## ⏸ Deferred': 'None.' })).join('\n')).toContain('carries no narrative');
  });

  it('rejects a band holding both items and the absence marker', () => {
    expect(lintTodo(todo({ '## 🟡 P2': `${ITEM}\n\n*None.*` })).join('\n')).toContain('pick one');
  });

  it('rejects an empty band, since absence must be stated', () => {
    expect(lintTodo(todo({ '## 🟡 P2': '' })).join('\n')).toContain('state the absence');
  });

  it('rejects the same reference appearing twice', () => {
    expect(lintTodo(todo({ '## 🟠 P1': ITEM, '## 🟡 P2': ITEM })).join('\n')).toContain('already appears');
  });

  it('rejects link text that disagrees with its URL', () => {
    const wrong = '- [#99](https://github.com/o/r/issues/53) — mismatched';

    expect(lintTodo(todo({ '## 🟠 P1': wrong })).join('\n')).toContain('does not match its URL');
  });

  it('rejects a bare #number instead of a link', () => {
    expect(lintTodo(todo({ '## 🟠 P1': '- #53 — bare reference' })).join('\n')).toContain('is not `- [#N]');
  });

  it('rejects content outside every band', () => {
    const stray = todo().replace('# TODO\n', '# TODO\n\nLast refreshed: 2026-08-17\n');

    expect(lintTodo(stray).join('\n')).toContain('outside any band');
  });

  it('notices a missing band', () => {
    const short = todo().replace(`## ⏸ Deferred\n\n*None.*\n`, '');

    expect(lintTodo(short).join('\n')).toContain('missing band');
  });

  it('allows HTML comments, which the template uses for guidance', () => {
    expect(lintTodo(todo({ '## 🟡 P2': '<!-- a note -->\n\n*None.*' }))).toEqual([]);
  });

  it('passes this repo\'s own TODO.md', () => {
    expect(lintTodo(readFileSync('TODO.md', 'utf8'))).toEqual([]);
  });
});
