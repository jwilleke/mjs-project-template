---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-09-12"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-09-07

- Last worked on: closed all 6 open issues, cut v1.12.0, resynced+merged 3 consumers, gave AGENTS.md a GitHub Issues section
- Branch / state: master, clean, nothing unpushed, no stashes, tagged v1.12.0
- Running / in-flight: none — CodeQL was still finishing on f1705ed (docs-only, nothing gates on it); CI, Deploy and Markdown Lint all green
- Parked / half-done: none
- Next steps:
  - Sync mjs-media-handling: last consumer at kit v1.11.1, its August sync PR was CLOSED not merged, so nothing is pending and it will not self-heal
  - Push the other 11 consumers from v1.11.4 to v1.12.0 when convenient
  - Fix the /semver lockstep gap: step 4 bumps only root package.json + lockfile, but release-kit.yml publishes off packages/agent-kit/package.json. Bumped by hand for v1.12.0; teach set-version.mjs or semver.md about it before the next cut
  - Untracked: issues for `--retire --pr` and for auto-removal from downstream-repos.json (both raised on #66)
- Blockers / significant notes: standing decision 2026-09-07 — NO templates added or changed. #78 closed on it: the epic/sub-issue rule lives in AGENTS.md only, consumers do not carry it, and epic.md keeps its `- [ ] #NNN` checklist despite contradicting the rule. Accepted, not overlooked. Fleet kit versions — v1.12.0: grow-tent, grow-nutrient-tank, garage-car-positioning. v1.11.4: the other 11. v1.11.1: mjs-media-handling. All stale sync PRs are resolved (two closed as superseded, one merged before its replacement landed on top).
<!-- RESUME:END -->

<!-- KIT:START — managed by mjs-project-template; add your own sections below KIT:END -->

## 🔴 P0 — Security & Critical

- [#83](https://github.com/jwilleke/mjs-project-template/issues/83) — [SECURITY] The AGENTS boilerplate discloses an internal hostname — in every synced repo and in history

## 🟣 Epics

*None.*

## 🟠 P1

*None.*

## 🟡 P2

- [#79](https://github.com/jwilleke/mjs-project-template/issues/79) — [FEATURE] kit-sync never checks whether Actions may open a PR, so a misconfigured consumer strands a branch every sync

## 🔵 In review

*None.*

## ⏸ Deferred

*None.*

## ❓ Needs triage

- [#82](https://github.com/jwilleke/mjs-project-template/pull/82) — chore(deps-dev): bump js-yaml from 4.3.1 to 4.3.2 *(PR · ready)* — no linked issue
- [#81](https://github.com/jwilleke/mjs-project-template/issues/81) — [FEATURE] /pstatus Epics band never fires downstream — no `epic` label is synced or applied, and `deferred` precedence is unstated

<!-- KIT:END -->
