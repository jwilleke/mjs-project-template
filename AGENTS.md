---
project_state: "template"
last_updated: "2026-05-23"
agent_priority_level: "medium"
blockers: []
requires_human_review: ["major architectural changes", "security policy modifications", "deployment to production"]
agent_autonomy_level: "high"
---

# Project Context for AI Agents

This file serves as the single source of truth for project context and state. All Experts should read this and update file when working on this project.

## Agent Context Protocol

### Machine-Readable Metadata

See YAML frontmatter above for current project state.

### Update Requirements

- Update `last_updated` field whenever making significant changes to this file
- Update `project_state` to reflect current status: "template", "active", "maintenance", "archived"
- Update `blockers` array with any current blockers preventing progress
- Update `agent_priority_level` based on urgency: "low", "medium", "high", "critical"

## CRITICAL

### Core Documentation (Single Source of Truth)

- [README.md](./README.md) - Single Source of Truth: Project overview, setup, and quick start
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Single Source of Truth: Guiding principles, naming, formatting, linting, testing, commits
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Single Source of Truth: Project structure, directory conventions, technology stack
- [SECURITY.md](./SECURITY.md) - Single Source of Truth: Secret management, dependency security, authentication, encryption
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Single Source of Truth: Development workflow, branching strategy, pull request process
- [project_log.md](docs/project_log.md) - Single Source of Truth: Historical record of work done, next steps, session tracking

### Auxiliary Documentation

- [.github/workflows/README.md](.github/workflows/README.md) - CI/CD pipelines and automation

## Context Overview

- Project Name: `$PROJECT_NAME` (from .env.example)
- Description: A brief description of what this project does and its primary purpose.
- Example Project (for reference):
  - Project Name: `user-auth-service`
  - Description: A secure authentication microservice that handles user registration, login, JWT token management, and password reset flows for distributed applications.

## Key Decisions

These may be done initially or as the project progresses. Include "Decision and rationale"

## Architecture & Tech Stack

See [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure, technology stack, and architectural decisions.

## Coding Standards

See [CODE_STANDARDS.md](./CODE_STANDARDS.md) for naming conventions, formatting, linting, testing, and commit message format.

## Behavioral Principles

These four principles reduce common LLM coding mistakes. They bias toward caution over speed; for trivial tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what's confusing, ask.

This applies to ambiguous scope, not every step — `agent_autonomy_level: high` still holds for clearly-defined work.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ship the smallest coherent slice. Ask before bundling adjacent work into the current change.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan with a verify-step per item. Strong success criteria let you loop independently; weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project Constraints

These may be done initially or as the project progresses.

## Project Log

See [project_log.md](docs/project_log.md) for the required format, historical work record, and tracking next steps.

## Agent Priority Matrix

### Agents CAN Work Autonomously On

- Code refactoring following established patterns
- Bug fixes for non-critical issues
- Documentation updates and corrections
- Writing tests for existing functionality
- Adding features explicitly described in project_log.md
- Code quality improvements (linting, formatting, type safety)
- Dependency updates (patch and minor versions)
- Performance optimizations with measurable impact

### Agents MUST Request Human Review For

- Major architectural changes or new patterns
- Security policy modifications or authentication changes
- Database schema migrations
- Deployment to production environments
- Breaking API changes
- Major dependency updates (major versions)
- Changes affecting user data or privacy
- Modifications to CI/CD pipelines
- Adding new third-party services or integrations

## Known Limitations & Constraints

### Technical Constraints

- Node.js v18+ required
- TypeScript strict mode must remain enabled
- All code must pass linting and tests before commit
- No unencrypted secrets in Git (per CODE_STANDARDS.md)

### Process Constraints

- All work must be done in feature branches
- Pull requests required for master branch
- Update project_log.md after each session
- Update this file's `last_updated` timestamp when making changes

### Agent-Specific Guidelines

- Always read this file before starting work
- Check blockers array before proceeding
- Respect the priority matrix above
- When uncertain, ask for human guidance
- Document all assumptions and decisions

### Agent Behavior Rules

- Eagerness - Do not jump into implementation or change files unless clearly instructed. When intent is ambiguous, default to research and recommendations rather than action. Only proceed with edits when the user explicitly requests them.
- No speculation - Never speculate about code you have not opened. Read relevant files BEFORE answering questions. Never make claims about code before investigating.
- Parallel tool calls - If calling multiple tools with no dependencies between them, make all independent calls in parallel. Never use placeholders or guess missing parameters.
- Issue decomposition - NEVER put "Steps", "Phases", or numbered sequences inside a single GitHub issue. Break each step into its own issue and link them using GitHub relationships:
  - `closes #N` / `fixes #N` — this issue resolves another
  - `blocked by #N` — cannot start until N is closed
  - `relates to #N` — context link, no hard dependency
  - Example: a 3-phase migration = 3 issues with "blocked by" chains, not one issue with "Phase 1 / Phase 2 / Phase 3" headings.
- Issue/PR links — Never use a bare `#N` reference alone. Always pair it with the full GitHub URL: `[#333](https://github.com/owner/repo/issues/333)`. This applies in commit messages, PR descriptions, comments, and any agent output. Use `/issues/N` for issues and `/pull/N` for PRs.
- Awaiting approval — When work is complete but requires human sign-off before closing, apply the `in-review` label and leave a comment on the issue/PR that states: what was done, what the human needs to verify, and what action closes it. Never self-close an issue or PR.

## Commands

```bash
# Development
npm run dev              # Start development server (tsx)
npm run build            # Build project (TypeScript -> dist/)
npm start                # Run built project

# Code Quality
npm run lint             # Lint code AND markdown
npm run lint:fix         # Auto-fix lint issues
npm run format           # Format with Prettier

# Testing
npm run test             # Run tests (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Individual linting
npm run lint:code        # ESLint only
npm run lint:md          # Markdown only
npm run typecheck        # TypeScript type checking without emit
```

## Key Standards (Quick Reference)

- TypeScript strict mode - No implicit any, strict null checks
- Prettier - Single quotes, 2-space indent, 100-char width, no trailing commas
- ESLint - Prefer const, unused vars prefixed with `_`, no floating promises
- Commits - Conventional format: `type(scope): description`
- Branches - Format: `type/description` (e.g., `feature/user-auth`, `fix/login-bug`)

## Session Workflow

- Read this file (AGENTS.md)
- Check `docs/project_log.md` for recent work
- Work on tasks following CODE_STANDARDS.md
- Update `docs/project_log.md` with session log entry
- Update this file's `last_updated` field if making significant changes
- **Commits — always use the `/session-commit` skill.** Never run a bare `git commit` directly. `/session-commit` enforces the session log update, conventional commit format, and co-author trailer.

## Notes & Context

Add any additional notes, context, or information that agents should know here. Examples:

- Known blockers preventing progress (also update YAML frontmatter)
- External dependencies or services required
- Database schema or API contracts
- Team communication channels or review processes
- Performance benchmarks or SLA requirements

## GitHub Workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching strategy, commit guidelines, pull request process, and testing requirements.

Important: Keep this file synchronized and updated. This is the bridge between different experts working on the same project.
