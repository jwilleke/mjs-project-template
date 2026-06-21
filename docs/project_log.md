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
