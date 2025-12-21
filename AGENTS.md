---
project_state: "template"
last_updated: "2025-12-21"
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

- Read [GLOBAL-CODE-PREFERENCES.md](./GLOBAL-CODE-PREFERENCES.md) first - This contains overarching principles that govern all work on this project

## Quick Navigation - Single Source of Truth

Each document is the authoritative source for its topic. Other docs reference these sources, never duplicate content.

### Core Documentation (Single Source of Truth)

- [GLOBAL-CODE-PREFERENCES.md](./GLOBAL-CODE-PREFERENCES.md) - **SSoT:** Overarching principles (DRY, secrets management, progressive iteration, project logging)
- [SETUP.md](./SETUP.md) - **SSoT:** Installation, prerequisites, environment setup, verification steps
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - **SSoT:** Naming conventions, code formatting, linting, testing, commit message format, performance guidelines
- [ARCHITECTURE.md](./ARCHITECTURE.md) - **SSoT:** Project structure, directory conventions, file organization, technology stack
- [SECURITY.md](./SECURITY.md) - **SSoT:** Secret management, dependency security, authentication, encryption, deployment security
- [CONTRIBUTING.md](./CONTRIBUTING.md) - **SSoT:** Development workflow, branching strategy, pull request process, code review
- [DOCUMENTATION.md](./DOCUMENTATION.md) - **SSoT:** Documentation navigation, DRY principles applied to docs, finding the right doc
- [project_log.md](docs/project_log.md) - **SSoT:** Historical record of work done, next steps, session tracking

### Auxiliary Documentation

- [README.md](./README.md) - Project overview and quick start (references above docs)
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
- No unencrypted secrets in Git (per GLOBAL-CODE-PREFERENCES.md)

### Process Constraints

- All work must be done in feature branches
- Pull requests required for main branch
- Update project_log.md after each session
- Update this file's `last_updated` timestamp when making changes

### Agent-Specific Guidelines

- Always read this file before starting work
- Check blockers array before proceeding
- Respect the priority matrix above
- When uncertain, ask for human guidance
- Document all assumptions and decisions

## Notes & Context

Add any additional notes, context, or information that agents should know here. Examples:

- Known blockers preventing progress (also update YAML frontmatter)
- External dependencies or services required
- Database schema or API contracts
- Team communication channels or review processes
- Performance benchmarks or SLA requirements

## GitHub Workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching strategy, commit guidelines, pull request process, and testing requirements.

**Important:** Keep this file synchronized and updated. This is the bridge between different experts working on the same project.
