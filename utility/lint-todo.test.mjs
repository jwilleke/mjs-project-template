import { describe, it, expect } from 'vitest';

// BANDS comes from the linter, not a copy. A second list here would drift, and
// this suite exists because drift in exactly this shape went unnoticed.
import { BANDS, lintTodo } from './lint-todo.mjs';

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
    const short = todo().replace('## ⏸ Deferred\n\n*None.*\n', '');

    expect(lintTodo(short).join('\n')).toContain('missing band');
  });

  // #75: a repo needs somewhere to put its own sections. Everything below
  // KIT:END is theirs, and the linter has no opinion about any of it.
  it('stops reading at KIT:END, so repo-local content is never judged', () => {
    const local = [
      todo(),
      '<!-- KIT:END -->',
      '',
      '## Local ops',
      '',
      'Prose the band rules would reject, a bare #12, and a duplicate link:',
      '- [#53](https://github.com/jwilleke/mjs-project-template/issues/53) — same ref as above'
    ].join('\n');

    expect(lintTodo(local)).toEqual([]);
  });

  it('still lints the bands above KIT:END', () => {
    const broken = [
      todo({ '## 🟡 P2': 'prose where items belong' }),
      '<!-- KIT:END -->',
      '',
      'anything at all'
    ].join('\n');

    expect(lintTodo(broken).join('\n')).toContain('carries no narrative');
  });

  it('lints the whole file when there is no marker', () => {
    expect(lintTodo(todo({ '## 🟡 P2': 'prose' })).join('\n')).toContain('carries no narrative');
  });

  // The resume block /wrap writes sits ABOVE KIT:START. Judging it is what took
  // this repo's master red for 18 days (#77); with markers it is out of scope.
  it('ignores the resume pointer above KIT:START', () => {
    const withResume = [
      '---',
      'title: TODO',
      '---',
      '',
      '# TODO',
      '',
      '<!-- RESUME:START -->',
      '## ▶ Resume here — 2026-09-07',
      '',
      '- Last worked on: prose the band rules would reject',
      '<!-- RESUME:END -->',
      '',
      '<!-- KIT:START v1.2.3 — managed by mjs-project-template -->',
      '',
      BANDS.map((b) => `${b}\n\n*None.*\n`).join('\n'),
      '<!-- KIT:END -->'
    ].join('\n');

    expect(lintTodo(withResume)).toEqual([]);
  });

  it('reports line numbers against the real file, not the kit region', () => {
    const offset = [
      '# TODO',
      '',
      '<!-- KIT:START v1.2.3 -->',
      '',
      BANDS.map((b) => `${b}\n\n*None.*\n`).join('\n'),
      '<!-- KIT:END -->'
    ].join('\n');
    const broken = offset.replace('## 🟡 P2\n\n*None.*', '## 🟡 P2\n\nprose');

    const [problem] = lintTodo(broken);
    const reported = Number(problem.match(/^TODO\.md:(\d+)/)[1]);
    const actual = broken.split('\n').findIndex((l) => l === 'prose') + 1;

    expect(reported).toBe(actual);
  });

  it('allows HTML comments, which the template uses for guidance', () => {
    expect(lintTodo(todo({ '## 🟡 P2': '<!-- a note -->\n\n*None.*' }))).toEqual([]);
  });
});
