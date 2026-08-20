---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-08-19"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-08-20

- Last worked on: closed #69, #67, #68, #65 and #71; merged yourphr #562 and outside PR #72
- Branch / state: master, clean, nothing unpushed, no stashes
- Running / in-flight: none — all background tasks finished; CI green on 6145364
- Parked / half-done: none
- Next steps:
  - Resync the 5 repos with open sync PRs rather than merging them as-is — see the note below
  - Decide #63: 26 of 31 tags have no GitHub Release; backfill is one scripted loop but
    publishes 26 release pages, so it needs an explicit go-ahead
  - #70 is the documentation-and-detection half of the required-checks problem; #66 is a
    real feature and #53 stays blocked until it lands
- Blockers / significant notes: the 5 open sync PRs (fairways-gen2-website#51,
  garage-car-positioning#30, grow-nutrient-tank#26, grow-tent#13, mjs-media-handling#15) were
  cut at v1.11.4-5-g17d7aa6, BEFORE the #67, #68 and semver.md fixes landed. Merging them ships
  the old kit-sync.sh — which still commits its own scratch files — and the old false semver.md
  prose. Resync, do not merge. Also: three fully-merged local branches are safe to delete
  (feat/install-kit-pr-mode, feat/pstatus-pr-issue-links, fix/pstatus-resume-and-template).
<!-- RESUME:END -->

## 🔴 P0 — Security & Critical

- [#53](https://github.com/jwilleke/mjs-project-template/issues/53) — [EPIC] .agent-kit.json — one machine-readable manifest for kit state

## 🟠 P1

*None.*

## 🟡 P2

- [#70](https://github.com/jwilleke/mjs-project-template/issues/70) — [BUG] A self-sync PR can never merge into a repo with required status checks
- [#66](https://github.com/jwilleke/mjs-project-template/issues/66) — [FEATURE] There is no way to retire a consumer — removing it from a list does nothing
- [#63](https://github.com/jwilleke/mjs-project-template/issues/63) — [BUG] 25 tags have no GitHub Release, so the Releases page says nothing shipped since v1.1.0

## 🔵 In review

*None.*

## ⏸ Deferred

*None.*

## ❓ Needs triage

*None.*
