---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-09-07"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-09-07

- Last worked on: closed all 6 open issues (#66, #74, #70, #75, #53, #63) and cut v1.12.0
- Branch / state: master, clean, nothing unpushed, no stashes, tagged v1.12.0
- Running / in-flight: none — all CI green on a758c50 (CI, Deploy, Markdown Lint, CodeQL, Release agent-kit); @jwilleke/agent-kit@1.12.0 is on npm
- Parked / half-done: none
- Next steps:
  - Resync the 3 stale downstream sync PRs rather than merging them — see below
  - Fix the /semver gap: step 4 bumps only root package.json + lockfile, but this repo keeps packages/agent-kit/package.json in lockstep and release-kit.yml publishes off it. Bumped by hand this cut; teach set-version.mjs or semver.md about it
  - Consider issues for --retire --pr and for auto-removal from downstream-repos.json — both raised on #66, neither tracked
- Blockers / significant notes: garage-car-positioning#30, grow-nutrient-tank#26 and grow-tent#13 are all OPEN and CLEAN but cut at v1.11.4-5-g17d7aa6 — 40+ commits stale, predating every fix in v1.12.0. Resync, do not merge. Also: 4 consumers sit at kit v1.11.1 (garage-car-positioning, grow-nutrient-tank, grow-tent, mjs-media-handling) while the other 11 are at v1.11.4; none has v1.12.0 yet.
<!-- RESUME:END -->

<!-- KIT:START — managed by mjs-project-template; add your own sections below KIT:END -->

## 🔴 P0 — Security & Critical

*None.*

## 🟣 Epics

*None.*

## 🟠 P1

- [#78](https://github.com/jwilleke/mjs-project-template/issues/78) — [FEATURE] The shipped kit does not carry the epic/sub-issue rule AGENTS.md now states

## 🟡 P2

*None.*

## 🔵 In review

*None.*

## ⏸ Deferred

*None.*

## ❓ Needs triage

*None.*

<!-- KIT:END -->
