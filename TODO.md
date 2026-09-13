---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-09-13"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-09-13

- Last worked on: #83 hostname leak (CLOSED) — boilerplate fixed, history purged and force-pushed, v1.13.0 released, npm 1.12.0 unpublished, all 10 consumers synced and merged, gitleaks scan in CI; closed #79 #81 #84 #85
- Branch / state: master, clean after this commit; history was REWRITTEN on 2026-09-13 (master 94f5b0b) — every pre-rewrite SHA is gone from branches and tags
- Running / in-flight: none — CI, CodeQL, Deploy, Markdown Lint green on 94f5b0b; no open PRs
- Parked / half-done: none
- Next steps:
  - Re-clone this repo on every other machine before working there
  - Sync the 4 consumers not on v1.13.0 (fairways-gen2-website, yourphr, yourphr-ts-spike at v1.11.4; mjs-media-handling at v1.11.1) — they never carried the link, just behind
  - Fix the /semver lockstep gap: set-version.mjs bumps only the root package, but release-kit.yml publishes off packages/agent-kit/package.json — hand-bumped again for v1.13.0
  - Untracked (carried over): issues for `--retire --pr` and auto-removal from downstream-repos.json (raised on #66)
- Blockers / significant notes: standing decision 2026-09-07 — no issue templates added or changed (#78). Operator decided 2026-09-13 NOT to file a GitHub Support request — old commits stay viewable by direct hash, and the fork aditya226-sharma/mjs-project-template keeps pre-August history. Local branches feat/install-kit-pr-mode, feat/pstatus-pr-issue-links, fix/pstatus-resume-and-template are pre-rewrite history — never push them. private/purge-83.sh and private/downstream-83.sh contain the host strings; never commit them.
<!-- RESUME:END -->

<!-- KIT:START — managed by mjs-project-template; add your own sections below KIT:END -->

## 🔴 P0 — Security & Critical

*None.*

## 🟣 Epics

*None.*

## 🟠 P1

*None.*

## 🟡 P2

*None.*

## 🔵 In review

*None.*

## ⏸ Deferred

*None.*

## ❓ Needs triage

*None.*

<!-- KIT:END -->
