---
title: TODO
description: Priority bands for mjs-project-template.
last_updated: "2026-08-16"
kit_version: "v1.1.0-1-g4952cdc"
---

# TODO

<!-- RESUME:START -->
## ▶ Resume here — 2026-08-16

- Last worked on: kit v1.1.0 released and published to npm; kit synced into 8 of 9 consumers
- Branch / state: master, clean, nothing unpushed
- Running / in-flight: none — all CI complete, no open PRs in this repo
- Parked / half-done: mj-infra-flux has an untracked `json` at its root — a stale duplicate of
  `apps/production/ngdpbase-demo/` pinned to ngdpbase:4.5.1 while the tracked copy is 4.11.0.
  Recommended `rm json`; awaiting the operator's word. It is the only thing blocking the last
  kit sync, since `--pr` refuses a dirty tree.
- Next steps:
  - Decide on `json` in mj-infra-flux, then `./install-kit.sh --pr /Volumes/hd2A/workspaces/github/mj-infra-flux`
  - Triage [#49](https://github.com/jwilleke/mjs-project-template/issues/49) — items 1 and 2 are
    already fixed in 1c4fe71 (it was filed against a PR cut before that commit); item 3 is the live
    part: `install-kit.sh` creating `private/project_log.md` where a stray `git add -A` could track it
  - Consider linting a full fresh install in CI, not only rendered templates (#49's closing suggestion)
- Blockers / significant notes: npm publishing now works unattended — trusted publishing (OIDC) is
  configured, so a version bump in `packages/agent-kit/package.json` plus a push is the whole release.
<!-- RESUME:END -->

## 🔴 P0 — Security & Critical

_None._ No open Dependabot alerts, no code scanning, and `npm audit` reports 0 vulnerabilities.

## 🟠 P1

_None._

## 🟡 P2

_None._

## 🔵 In review

_None._

## ⏸ Deferred

_None._

## ❓ Needs triage

- [#49](https://github.com/jwilleke/mjs-project-template/issues/49) — A fresh sync leaves the repo red: synced files break the lint rules the same sync adds
