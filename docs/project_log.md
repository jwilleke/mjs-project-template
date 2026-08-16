---
title: Project Log
description: Session history for mjs-project-template.
last_updated: "2026-06-16"
kit_version: "v1.0.0-9-gae575c2"
---

# Project Log

Rules for the log entry:

- Newest entry at top
- Use today's date for yyyy-MM-dd
- Use ## as an incrementing number if there are multiple entries for the same date (start at 01)
- For Agent, use the name of the AI agent (e.g., "Claude")
- For Current Issue, reference any GitHub issue numbers as #123 format
- For Commits, use the short hash(es) from git log
- For Files Modified, list every file that was changed in this session

<!-- ## Entries go below here -->

## 2026-08-16-01

- Agent: Claude
- Subject: Clear the P0 js-yaml alert and work every open issue
- Current Issue: #43, #39, #42, #38, #40
- Work Done:
  - Ran `/pstatus`: bridged Dependabot alert 22 (js-yaml GHSA-5p4m-2wfm-xmqj, high) into #43 and applied `needs-triage` to #42
  - #43 — merged Dependabot PR #41 (js-yaml 4.3.0 → 4.3.1); open Dependabot alerts now 0; closed
  - Established that `TODO.md` carries no history at all (no merged/closed counts, no narrative, no other repos) — written into `pstatus.md`, `TODO.md.tmpl`, and the AGENTS boilerplate
  - #39 — open PRs now share the priority bands with issues; `🔀 Open PRs` band removed from both `pstatus.md` and the drifted `TODO.md.tmpl`; PR priority = own label → highest linked issue → needs-triage
  - #42 — added the missing "remove `in-review` when closing" half of the rule to the boilerplate; split the underlying `install-kit.sh` silent-overwrite problem into #44
  - #38 — operator chose to keep the resume-block wipe; closed as not planned, but documented the `/wrap` → `/context` → `/pstatus` handover in the boilerplate so the behaviour stops reading as a bug
  - #40 — operator chose the stronger route: `utility/set-version.mjs` writes the version fields only (both lockfile places, no re-resolution), with tests pinning byte-identical round-trip, untouched dependency entries, lockfileVersion 1, and an exactly-two-line diff
  - Fixed a latent pre-commit failure: lint-staged handed eslint every staged `*.ts`, so any commit touching a root config (e.g. `vitest.config.ts`) failed with "not found by the project service"
  - Gate green: lint, typecheck, build, 19 tests
- Commits: 0b403df, afa118f, 092ff93, 1f1b5c3, c78dfa5, c4b69c8
- Files Modified:
  - `.claude/commands/pstatus.md`
  - `.claude/commands/semver.md`
  - `templates/agents-boilerplate.md`
  - `templates/TODO.md.tmpl`
  - `utility/set-version.mjs`
  - `utility/set-version.test.mjs`
  - `vitest.config.ts`
  - `package.json`
  - `package-lock.json`
  - `TODO.md`
  - `docs/project_log.md`
- Notes:
  - `npm audit` still reports 2 high findings not raised as Dependabot alerts — brace-expansion (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895) and nanoid (GHSA-2v37-7h3g-55p8). Both say `fixAvailable: true`; not investigated this session, no tracking issue yet.
  - `install-kit.sh` does not sync `.claude/commands/semver.md` or `utility/set-version.mjs`, so #40's fix does not reach consumers. Deliberate — adding `semver.md` to the overwrite list would clobber forks with their own bump tooling (ngdpbase).

## 2026-07-27-01

- Agent: Claude
- Subject: Bridge two open Dependabot alerts into issues and patch them
- Current Issue: #22, #23
- Work Done:
  - Ran `/pstatus`: 2 open Dependabot alerts, no code-scanning analysis, 3 untriaged bugs
  - Bridged alert 17 (linkify-it, GHSA-v245-v573-v5vm) into #22 and alert 16 (brace-expansion, GHSA-3jxr-9vmj-r5cp) into #23, both `security` + `P0`
  - Applied `needs-triage` to #16 (had `bug` only, no placement label)
  - `npm audit fix`: linkify-it 5.0.1 → 5.0.2, brace-expansion 5.0.6 → 5.0.8 and 1.1.14 → 1.1.16; js-yaml → 4.2.0 and postcss → 8.5.23 carried along
  - Verified lint, tests (1 passed), and typecheck all green
  - Regenerated TODO.md — P0 band cleared
- Commits: 592a882, 064faef
- Files Modified:
  - `package-lock.json`
  - `TODO.md`
  - `docs/project_log.md`
- Notes:
  - Two advisories remain open in `npm audit` and are NOT covered by #22/#23 — both need a breaking upgrade or have no patch yet: brace-expansion GHSA-mh99-v99m-4gvg (OOM; 1.x line unpatched, would need eslint@10.8.0) and js-yaml GHSA-52cp-r559-cp3m (4.2.0 still in range). Not yet surfaced as Dependabot alerts.

## 2026-06-20-01

- Agent: Claude
- Subject: Encode release policy (standing authorization + git-describe model) — partial #10
- Current Issue: #10
- Work Done:
  - Added `## Release Policy` section to AGENTS.md: standing authorization to cut releases on any minor/major bump or on request without confirmation; patch chains may be deferred; live version between releases is `git describe` (`vX.Y.Z-N-g<sha>`); a formal cut graduates that to a clean `vX.Y.Z` tag
  - Updated `/semver` command: removed the minor/major confirmation prompt, documented the standing authorization and git-describe versioning model, added a Rules entry forbidding re-prompts while keeping the hard safety gates
  - Bumped AGENTS.md `last_updated` to 2026-06-20
  - Linked both open issues in `TODO.md` with full GitHub URLs; refreshed bands from labels
  - Applied `needs-triage` to #10 and #11 (no prior priority labels); created the `needs-triage` repo label
  - Note: the broader "make /semver project-agnostic" half of #10 (master/main detection, package.json/release-please/manual-tag mechanisms, pick a default) remains open
- Commits: c622c2a, 139b33e
- Files Modified:
  - `AGENTS.md`
  - `.claude/commands/semver.md`
  - `TODO.md`
  - `docs/project_log.md`

## 2026-06-16-02

- Agent: Claude
- Subject: Full kit sync — frontmatter, markdown-lint CI, VS Code extensions, unwrapped boilerplate; push all 8 downstream repos
- Current Issue: none
- Work Done:
  - Added YAML frontmatter with `kit_version: "KIT-VERSION"` to all templates (CLAUDE.md.tmpl, TODO.md.tmpl, project_log.md.tmpl, agents-frontmatter.md.tmpl)
  - Added richer scaffold content to CLAUDE.md.tmpl, TODO.md.tmpl, project_log.md.tmpl
  - Added `.vscode/extensions.json` recommending `DavidAnson.vscode-markdownlint` — seeded to all repos
  - Added canonical `.github/workflows/markdown-lint.yml` using `markdownlint-cli2-action` (no npm) — seeded to all repos
  - Fixed ngdpbase CI (`ci.yml`, `ci-passing-tests.yml`) to check `.markdownlint.jsonc` not just `.markdownlint.json`
  - Unwrapped all boilerplate bullets to single long lines per session feedback
  - Committed and pushed all 8 downstream repos (version bump + extensions.json where new)
  - Updated `docs/sync-log.md` with final installed versions
  - Fixed MD001 heading-increment errors in `.github/workflows/README.md`
- Commits: ae575c2, e10bd0c, 01c77cd, 1fa177f, 3083ea6, 0a27f04, dd5d8af, 50845b6
- Files Modified:
  - `templates/agents-boilerplate.md`
  - `templates/agents-frontmatter.md.tmpl`
  - `templates/CLAUDE.md.tmpl`
  - `templates/TODO.md.tmpl`
  - `templates/project_log.md.tmpl`
  - `.vscode/extensions.json`
  - `.github/workflows/markdown-lint.yml`
  - `.github/workflows/README.md`
  - `docs/sync-log.md`
  - `TODO.md`
  - `docs/project_log.md`

## 2026-06-16-01

- Agent: Claude
- Subject: Sync /session-commit rule and create sync-log to all kitted downstream repos
- Current Issue: none
- Work Done:
  - Synced issue decomposition, issue/PR links, awaiting-approval, and /session-commit rules to jwilleke/deby via SSH
  - Created `docs/sync-log.md` to track downstream repo syncs by template commit
  - Added /session-commit rule to 8 local kitted repos (jackery-homeassistant excluded — fork)
  - Backfilled sync-log entries for prior 2026-06-14 syncs
- Commits: bfe2b2c, 0c9fe25, e0dc781, 5e92460, 4d1bdd3, 95a3caf, 5a4736d, ddcfe96, 5d37f484, 576a8069
- Files Modified:
  - `docs/sync-log.md`
  - `docs/project_log.md`

## 2026-06-14-01

- Agent: Claude
- Subject: Add agent behavior rules for issue links, in-review label, and /session-commit
- Current Issue: none
- Work Done:
  - Added issue/PR link rule — agents must always pair `#N` with full GitHub URL
  - Added awaiting-approval rule — agents apply `in-review` label and leave structured comment
  - Added `/session-commit` rule — agents must never use bare `git commit`
- Commits: acbb401, f836b7a
- Files Modified:
  - `AGENTS.md`

## 2026-06-12-01

- Agent: Claude
- Subject: Rename /status skill to /pstatus to avoid built-in command conflict
- Current Issue: none
- Work Done:
  - Renamed `.claude/commands/status.md` → `pstatus.md`
  - Updated all internal `/status` references to `/pstatus` within the file
- Commits: f112d2b
- Files Modified:
  - `.claude/commands/pstatus.md` (renamed from `status.md`)
