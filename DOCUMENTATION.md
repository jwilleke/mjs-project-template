# Documentation Navigation Guide

This guide helps you find the right documentation for your needs. We follow the DRY (Don't Repeat Yourself) principle to keep documentation maintainable and in sync.

## ⭐ START HERE: Global Preferences

Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) first - Contains overarching principles for:

- Writing concise, DRY code and documentation
- Progressive iteration (core features first)
- Secret management (NEVER unencrypted secrets in Git)
- Project logging with project_log.md
- GitHub CLI as primary interaction method
- Using markdownlint, .editorconfig, .prettierrc.json

This applies to ALL work on this project.

## By Topic

Current project state in machine-readable format (JSON metadata block at top)
Last update timestamp to help agents understand staleness

## Example format

```markdown
---
project_state: "active"
last_updated: "2025-01-15"
agent_priority_level: "high"
blockers: ["waiting on API key from ops team"]
---
```

## Development Documentation

- Developer Documentation (docs/)
  - Automatically keep Developer Documentation current.
  - Developer Documentation should have Module-Name.md file to serve as a summary of the module that is less than two pages
  - On major or complex modules keep and maintain Module-Name-Complete-Guide.md if required with links to Module-Name.md
- Code standards & conventions: [CODE_STANDARDS.md](./CODE_STANDARDS.md)
- Project structure: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Contribution workflow: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Source of Truth by Topic

| Topic | Source of Truth | Related Docs |
| --- | --- | --- |
| Naming conventions | CODE_STANDARDS.md | ARCHITECTURE.md (references it) |
| File structure | ARCHITECTURE.md | README.md (references it) |
| Code formatting | CODE_STANDARDS.md | CONTRIBUTING.md (references it) |
| Testing | CODE_STANDARDS.md | CONTRIBUTING.md, ARCHITECTURE.md (reference it) |
| Commit messages | CODE_STANDARDS.md | CONTRIBUTING.md (references it) |
| Performance | CODE_STANDARDS.md | ARCHITECTURE.md (references it) |
| Security | SECURITY.md | CODE_STANDARDS.md, workflows (reference it) |
| Dependencies | SECURITY.md | CODE_STANDARDS.md (references it) |
| Workflows | .github/workflows/README.md | SECURITY.md (references it) |
| Project status | AGENTS.md | All docs (reference it) |

## Quick Links by Role

### New Developer

1. CRITICAL: Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) for project principles
2. Read [SETUP.md](./SETUP.md)
3. Read [AGENTS.md](./AGENTS.md) for project context
4. Read [CODE_STANDARDS.md](./CODE_STANDARDS.md) for coding rules
5. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow

### Security Review

1. Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) (especially "NEVER put unencrypted Secrets in Git")
2. Read [SECURITY.md](./SECURITY.md)
3. Check [.github/workflows/README.md](.github/workflows/README.md) for CI/CD security
4. Review [CODE_STANDARDS.md](./CODE_STANDARDS.md#review-checklist)

### Project Lead / Manager

1. Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) for project governance
2. Check [AGENTS.md](./AGENTS.md) for current status
3. Review [CONTRIBUTING.md](./CONTRIBUTING.md) for team workflow
4. Check [.github/workflows/README.md](.github/workflows/README.md) for deployment

### AI Agent (Claude / Gemini)

1. CRITICAL: Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) first (overarching principles)
2. Run `/context` command to read AGENTS.md
3. Run `/check-todos` to see priorities
4. Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md) and all standards
5. Use project_log.md to track all work (per GLOBAL-CODE-PREFERENCES)
6. Run `/update-agents` when done

## DRY Principles Applied

This documentation follows the DRY (Don't Repeat Yourself) principle:

- ✅ Naming conventions defined once in CODE_STANDARDS.md, referenced elsewhere
- ✅ File structure defined once in ARCHITECTURE.md, referenced in README.md
- ✅ Testing standards defined once in CODE_STANDARDS.md, referenced in CONTRIBUTING.md
- ✅ Commit format defined once in CODE_STANDARDS.md, referenced in CONTRIBUTING.md
- ✅ Security guidance defined in SECURITY.md, referenced in workflows and standards
- ✅ Project status single source in AGENTS.md, referenced by all docs

Each topic has one source of truth, preventing conflicting or outdated guidance.

## Contributing to Documentation

When updating documentation:

1. Identify the authoritative source for that topic (see "Source of Truth" table above)
2. Update only that source document
3. Add cross-references from related documents
4. Never duplicate content across files
5. Update this guide if you introduce a new topic or consolidate existing ones

## Questions?

- Topic not covered? Check the appropriate file from "By Topic" section
- Can't find something? Search for keywords in the relevant source document
- Still stuck? Check [AGENTS.md](./AGENTS.md) for contact info or open an issue
