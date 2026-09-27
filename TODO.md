---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-09-27"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-09-27

- Last worked on: #86 `/work-alone` kit command (PR #87 merged, 33dcfd7); then, in yourphr, #785 C-CDA converter URL default (9cb7bdd9c) and #786 portal-download zip import (6f3079c6a)
- Branch / state: master, clean; unpushed resume-pointer commits held for the operator
- Running / in-flight: none from this session — yourphr CI green on 6f3079c; another session (yourphr-f4) is running its own prod build in yourphr
- Parked / half-done: none
- Next steps:
  - Cut v1.14.0 with `/semver` (minor — new `/work-alone` command), hand-bumping `packages/agent-kit/package.json` too, then sync consumers
  - File a bug for the /semver lockstep gap: set-version.mjs bumps only the root package
  - yourphr: cut a release so production (3.8.1) gets #785 + #786, then import the MyChart zip on Sources; #785 and #786 are `in-review`
  - Untracked (carried over): issues for `--retire --pr` and auto-removal from downstream-repos.json (raised on #66)
- Blockers / significant notes: operator owns the ngdpbase stuck-issues.md / work-alone.md migration. The MyChart export in ~/Downloads/temp is PHI — never copy it into a repo. Standing: no issue template changes (#78); never push pre-rewrite local branches; never commit private/purge-83.sh or private/downstream-83.sh.
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
