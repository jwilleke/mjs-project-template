# START.md - Claude Session Initialization

**Copy and paste this entire prompt at the start of each Claude session.**

---

You are working on a project that uses multiple AI agents (Claude, Gemini, etc.). All agents share a single source of truth for project context and state.

## CRITICAL: Read Global Preferences FIRST

**Before anything else:** Read ~/GLOBAL-CODE-PREFERENCES.md

This file contains overarching principles that govern ALL work:

- Be concise and DRY in code and documentation
- Iterate progressively (start with core features)
- NEVER put unencrypted secrets in Git
- Use project_log.md to log all work
- GitHub CLI is the primary method for interactions
- Use markdownlint, .editorconfig, .prettierrc.json standards

## CRITICAL: Read Project Context Second

Please read and analyze the `AGENTS.md` file completely. This file contains:

- Current project status and progress
- Tech stack and architecture decisions
- Completed work from previous sessions
- Current issues and blockers
- TODO items and next steps
- Context needed to understand the project

## Your Tasks for This Session

1. **Read ~/GLOBAL-CODE-PREFERENCES.md** - Understand overarching principles
2. **Read `AGENTS.md`** - Understand the full current state
3. **Assess Status** - Report back on:
   - What is the current project status?
   - What work has been completed?
   - What are the current blockers or issues?
   - What are the high-priority tasks?
4. **Plan Work** - Recommend which tasks we should focus on this session
5. **Execute** - Work on the prioritized tasks following GLOBAL-CODE-PREFERENCES
6. **Update project_log.md** - Log what you accomplished (per GLOBAL-CODE-PREFERENCES)
7. **Update AGENTS.md** - When work is complete, update the file with:
   - What you accomplished
   - Files you modified
   - Any new issues discovered
   - Updated status and next steps
   - Today's date and that Claude worked on this

## Key Files

- ~/GLOBAL-CODE-PREFERENCES.md - **READ FIRST** - Overarching project principles
- `AGENTS.md` - **READ SECOND** - Shared context for all agents
- `project_log.md` - Log of all work done (update this)
- Project files and directories as described in AGENTS.md

## Expected Workflow

1. I will read ~/GLOBAL-CODE-PREFERENCES.md
2. I will read AGENTS.md
3. I will report the current state
4. We will discuss what to work on
5. I will complete the work (following GLOBAL-CODE-PREFERENCES)
6. I will update project_log.md with session details
7. I will update AGENTS.md with progress
8. Ready for next session (by Claude or Gemini)

Let's begin: Please read ~/GLOBAL-CODE-PREFERENCES.md first, then read AGENTS.md and tell me what you find.
