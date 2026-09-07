---
project_state: "template"
last_updated: "2026-09-07"
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

- __Commit directly to master. This is the default.__ There is one maintainer and no reviewers, so
  a self-opened, self-merged PR reviews nothing — it just splits the same explanation across a
  commit message and a PR body. Put the reasoning in the commit message and push.
- __Open a PR only when someone other than you will actually look at it before it lands.__ In
  practice that is two cases:
  - A downstream kit sync (`install-kit.sh --pr`) — it rewrites a repo you were not working in, so
    it needs an announcement and one revert point.
  - A change you specifically want reviewed before it fans out to every downstream repo.
- Do not open a PR merely because a change touches a "risky" path, closes an issue, or feels
  significant. CI runs on `push` to master as well as on `pull_request`, so a direct commit is
  still tested.
- Never write the same rationale twice. If a PR does exist, its body points at the commit message
  rather than restating it.
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
- Issues — see [GitHub Issues](#github-issues) below for decomposition, epics and sub-issues, linking, and approval. Those rules are stated once, there.

## Commands

```bash
# Development
npm run dev              # Start development server (tsx)
npm run build            # Build project (TypeScript -> dist/)
npm start                # Run built project

# Code Quality
npm run lint             # Lint code, templates and TODO bands
npm run lint:fix         # Auto-fix lint issues
npm run format           # Format with Prettier

# Testing
npm run test             # Run tests (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Individual linting
npm run lint:code        # ESLint only
npm run lint:md          # Markdown only (own CI job; not in `npm run lint`)
npm run lint:install     # Install the kit into a temp repo and check it (own CI job)
npm run typecheck        # TypeScript type checking without emit
```

## Key Standards (Quick Reference)

- TypeScript strict mode - No implicit any, strict null checks
- Prettier - Single quotes, 2-space indent, 100-char width, no trailing commas
- ESLint - Prefer const, unused vars prefixed with `_`, no floating promises
- Commits - Conventional format: `type(scope): description`
- Branches - Format: `type/description` (e.g., `feature/user-auth`, `fix/login-bug`)

## Release Policy

- __Standing authorization to cut releases.__ Cut a release on ANY `minor` or `major` version bump, or whenever the maintainer says to — without asking for confirmation. This is durable authorization; do not re-prompt "should I tag/release?" for these cases. Use the `/semver` skill.
- __Patch bumps may be deferred or consolidated.__ A chain of patch-only commits does not have to ship immediately; it can be rolled into the next minor/major or cut on request.
- __Live version between releases is `git describe`.__ Between formal cuts, the working version is `vX.Y.Z-N-g<sha>` — the last tag, the number of commits since it (`N`), and the abbreviated commit SHA. This is expected and healthy: "we have 80 commits and no release" reads as *80 commits past the last tag*, not as something broken.
- __A formal cut graduates `git describe` to a clean tag.__ Cutting a release replaces the `-N-g<sha>` suffix with a clean annotated `vX.Y.Z` tag at that commit. After the cut, `git describe` reports the clean tag again (until the next commit).

## Session Workflow

- Read this file (AGENTS.md)
- Check `docs/project_log.md` for recent work
- Work on tasks following CODE_STANDARDS.md
- Update `docs/project_log.md` with session log entry
- Update this file's `last_updated` field if making significant changes
- __Commits — always use the `/session-commit` skill.__ Never run a bare `git commit` directly. `/session-commit` enforces the session log update, conventional commit format, and co-author trailer.

## Notes & Context

Add any additional notes, context, or information that agents should know here. Examples:

- Known blockers preventing progress (also update YAML frontmatter)
- External dependencies or services required
- Database schema or API contracts
- Team communication channels or review processes
- Performance benchmarks or SLA requirements

## GitHub Issues

The issue tracker is the durable record. These rules exist because the alternative — a decision in a
chat log, a plan in one issue's body — cannot be queried, assigned, or blocked on.

### Decomposition

NEVER put "Steps", "Phases", or numbered sequences inside a single GitHub issue. Break each step into
its own issue and link them. A 3-phase migration is 3 issues with dependencies, not one issue with
"Phase 1 / Phase 2 / Phase 3" headings.

### Epics and sub-issues

An epic is a container, not a worklist. It holds the goal, the scope and the acceptance criteria; the
work lives in its children.

- __Attach every child as a real GitHub sub-issue.__ Use the sub-issue relationship, not a checklist
  of `#N` in the body. A markdown checkbox tracks nothing, blocks nothing, and does not appear on the
  child at all — the parent shows no progress and the child shows no parent. `gh issue edit` has no
  flag for this; it is the API:

  ```bash
  # attach child ISSUE_ID to parent N (sub_issue_id is the issue's numeric id, not its number)
  child_id=$(gh api "/repos/{owner}/{repo}/issues/<child-number>" --jq .id)
  gh api --method POST "/repos/{owner}/{repo}/issues/<parent-number>/sub_issues" \
    -F "sub_issue_id=$child_id"
  ```

- __The epic is blocked by its sub-issues.__ Do not close an epic while any child is open, and do not
  start work directly on an epic that has open children — the child is where it belongs.
- __Order siblings with `blocked by #N`__ where one genuinely cannot start until another closes. Note
  this is a text convention, not a GitHub relationship: it renders as a mention and enforces nothing,
  so it records intent for a reader rather than gating anything.
- __Verify before closing an epic:__ `gh api "/repos/{owner}/{repo}/issues/<n>/sub_issues"` returns
  the children and their state. An empty array on an epic means the decomposition was never recorded.

### Linking

- `closes #N` / `fixes #N` — this issue or PR resolves another.
- `blocked by #N` — cannot start until N closes (convention; see above).
- `relates to #N` — context link, no hard dependency.
- Never use a bare `#N` alone. Always pair it with the full URL:
  `[#333](https://github.com/owner/repo/issues/333)`. This applies in commit messages, PR
  descriptions, comments, and any agent output. Use `/issues/N` for issues and `/pull/N` for PRs.

### Approval and closing

- When work is complete but needs human sign-off, apply `in-review` and comment with what was done,
  what the human needs to verify, and what action closes it. Never self-close an issue or PR.
- Always remove `in-review` when closing. A closed item keeping the label makes it stop meaning
  "awaiting a decision", and the queue it drives stops being trustworthy.

## GitHub Workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching strategy, commit guidelines, pull request process, and testing requirements.

Important: Keep this file synchronized and updated. This is the bridge between different experts working on the same project.
