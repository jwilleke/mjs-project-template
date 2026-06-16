# Project Log

This document tracks ongoing work and session history for the MJS Cookbook project.

## Current Status

- Phase:  (EXAMPLE) Phase 4 Complete - Web UI Live
- Build Status: (EXAMPLE) All tests passing (11 tests)
- Last Updated:  (EXAMPLE) 2025-12-21
- Overall Health:  (EXAMPLE) Stable - No known blockers

## Session Logs

### 2026-06-16-01

- Agent: Claude
- Subject: Sync /session-commit rule and create sync-log to all kitted downstream repos
- Current Issue: none
- Work Done:
  - Synced issue decomposition, issue/PR links, awaiting-approval, and /session-commit rules to jwilleke/deby via SSH
  - Created `docs/sync-log.md` to track downstream repo syncs by template commit
  - Added /session-commit rule to 8 local kitted repos (jackery-homeassistant excluded — fork)
  - Backfilled sync-log entries for prior 2026-06-14 syncs
- Commits: bfe2b2c (sync-log), 0c9fe25 (deby), e0dc781, 5e92460, 4d1bdd3, 95a3caf, 5a4736d, ddcfe96, 5d37f484, 576a8069
- Files Modified:
  - `docs/sync-log.md`
  - `docs/project_log.md`

### 2026-06-14-01

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

### 2026-06-12-01

- Agent: Claude
- Subject: Rename /status skill to /pstatus to avoid built-in command conflict
- Current Issue: none
- Work Done:
  - Renamed `.claude/commands/status.md` → `pstatus.md`
  - Updated all internal `/status` references to `/pstatus` within the file
- Commits: f112d2b
- Files Modified:
  - `.claude/commands/pstatus.md` (renamed from `status.md`)

### Session Log Required Format

```
### yyyy-MM-dd-##

- Agent: [Claude/Gemini/Other]
- Subject: [Brief description]
- Current Issue: [issue]
- Work Done: 
  - [task 1]
  - [task 2]
- Commits: [hash]
- Files Modified: 
  - [file1.js]
  - [file2.md]
```
