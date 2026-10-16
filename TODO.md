---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-10-16"
---

# TODO

<!-- KIT:START — managed by mjs-project-template; add your own sections below KIT:END -->

## 🔴 P0 — Security & Critical

- [#101](https://github.com/jwilleke/mjs-project-template/issues/101) — [SECURITY] source-map-js — event-loop DoS via indexed source-map section offsets
- [#100](https://github.com/jwilleke/mjs-project-template/issues/100) — [SECURITY] braces — stack-exhaustion DoS through deeply nested patterns
- [#99](https://github.com/jwilleke/mjs-project-template/issues/99) — [SECURITY] brace-expansion — DoS via recursion / quadratic expansion
- [#96](https://github.com/jwilleke/mjs-project-template/issues/96) — Kit does not sync the secret gate (.gitleaks.toml, secret-scan job, husky gitleaks block)
- [#94](https://github.com/jwilleke/mjs-project-template/issues/94) — [BUG] GH templates are wrong
- [#93](https://github.com/jwilleke/mjs-project-template/issues/93) — [BUG] - /docs/project_log.md

## 🟣 Epics

*None.*

## 🟠 P1

- [#102](https://github.com/jwilleke/mjs-project-template/issues/102) — [SECURITY] smol-toml — quadratic-time parse() from parseKey rescanning
- [#91](https://github.com/jwilleke/mjs-project-template/pull/91) — chore(deps): bump markdown-it and markdownlint-cli2 *(PR · ready · stale 13d)* — likely [#97](https://github.com/jwilleke/mjs-project-template/issues/97)
- [#89](https://github.com/jwilleke/mjs-project-template/pull/89) — chore(deps): bump js-yaml and markdownlint-cli2 *(PR · ready · stale 17d)* — likely [#98](https://github.com/jwilleke/mjs-project-template/issues/98)

## 🟡 P2

- [#103](https://github.com/jwilleke/mjs-project-template/issues/103) — [SECURITY] katex — prototype pollution can bypass trust restrictions

## 🔵 In review

*None.*

## ⏸ Deferred

*None.*

## ❓ Needs triage

- [#95](https://github.com/jwilleke/mjs-project-template/pull/95) — docs: add ngdp-accounting-addons and ngdpbase-addons as consumers *(PR · ready)* — no linked issue
- [#92](https://github.com/jwilleke/mjs-project-template/issues/92) — kit-sync: start the PR's checks itself via workflow_dispatch — GITHUB_TOKEN may trigger dispatch, so sync PRs can get real checks without a PAT
- [#90](https://github.com/jwilleke/mjs-project-template/issues/90) — New repos inherit the template's own project_log.md as their private log

<!-- KIT:END -->
