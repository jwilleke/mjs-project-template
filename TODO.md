---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-08-18"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-08-18

- Last worked on: fleet sync to v1.11.4 — 14 of 15 consumers synced; yourphr deliberately held back
- Branch / state: master, clean, 1 unpushed commit (c27d007)
- Running / in-flight: none — all background syncs finished; CI here green
- Parked / half-done: none committed locally; 7 consumer sync PRs still open awaiting merge
- Next steps:
  - Merge the 7 open sync PRs: fairways-gen2-website#51, garage-car-positioning#30,
    grow-nutrient-tank#26, grow-tent#13, mjs-media-handling#15, ngdpbase#1075,
    yourphr-ts-spike#8 — all CLEAN, all the same 3-file diff
  - Decide yourphr (#65): sync as-is with 80 files reformatted, or scope the rules first
  - Fix #67 — check the lint-fresh-install.mjs assertion before changing the guard
- Blockers / significant notes: something other than me merged deby#40, geohazardwatch#256,
  mj-infra-flux#173 and mjs-ha#73 — find out what, since nothing should auto-merge these.
  mjs-network declares markdownlint-cli but every script calls markdownlint-cli2; the same
  stale-node_modules shape made ngdpbase's first sync fail with `spawn markdownlint-cli2 ENOENT`.
<!-- RESUME:END -->

## 🔴 P0 — Security & Critical

- [#53](https://github.com/jwilleke/mjs-project-template/issues/53) — [EPIC] .agent-kit.json — one machine-readable manifest for kit state

## 🟠 P1

*None.*

## 🟡 P2

- [#67](https://github.com/jwilleke/mjs-project-template/issues/67) — [BUG] install-kit.sh warns about .markdownlint.jsonc in repos that do not have one
- [#66](https://github.com/jwilleke/mjs-project-template/issues/66) — [FEATURE] There is no way to retire a consumer — removing it from a list does nothing
- [#65](https://github.com/jwilleke/mjs-project-template/issues/65) — [BUG] yourphr carries an inert .markdownlint.jsonc, and syncing it would rewrite three files it should not
- [#63](https://github.com/jwilleke/mjs-project-template/issues/63) — [BUG] 25 tags have no GitHub Release, so the Releases page says nothing shipped since v1.1.0

## 🔵 In review

*None.*

## ⏸ Deferred

*None.*

## ❓ Needs triage

*None.*
