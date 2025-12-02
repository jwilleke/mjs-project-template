# Documentation Navigation Guide

This guide helps you find the right documentation for your needs. We follow the **DRY (Don't Repeat Yourself) principle** to keep documentation maintainable and in sync.

## By Topic

### Getting Started
- **First time?** Start with [README.md](./README.md)
- **Setting up locally?** Follow [SETUP.md](./SETUP.md)
- **Understanding the project?** Read [AGENTS.md](./AGENTS.md)

### Development
- **Code standards & conventions:** [CODE_STANDARDS.md](./CODE_STANDARDS.md)
  - Naming conventions (files, classes, functions, constants)
  - Code formatting (Prettier, ESLint)
  - TypeScript configuration
  - Testing standards
  - Git commit messages
  - Performance guidelines

- **Project structure:** [ARCHITECTURE.md](./ARCHITECTURE.md)
  - Directory organization
  - Technology stack
  - Common patterns
  - Deployment considerations

- **Contribution workflow:** [CONTRIBUTING.md](./CONTRIBUTING.md)
  - Branch naming
  - Development workflow
  - PR process
  - Code review

### Security
- **Security practices:** [SECURITY.md](./SECURITY.md)
  - Secret management (development & production)
  - Dependency auditing
  - Input validation
  - Authentication & authorization
  - Data protection
  - Deployment security

### DevOps & CI/CD
- **GitHub Actions workflows:** [.github/workflows/README.md](.github/workflows/README.md)
  - CI/CD pipeline setup
  - Automated testing & linting
  - Deployment configuration
  - Branch protection
  - Secret management in GitHub

### AI Agent Collaboration
- **Project context & status:** [AGENTS.md](./AGENTS.md)
  - Current project status
  - Goals and priorities
  - Known blockers
  - Session log
  - Next steps

- **Claude slash commands:** [.claude/README.md](.claude/README.md)
  - `/context` - Get project overview
  - `/check-todos` - View prioritized work
  - `/update-agents` - Document progress

## Documentation Map

```
README.md                          # Start here
├── SETUP.md                        # Environment setup
├── AGENTS.md                       # Project context (READ FIRST!)
│   ├── CODE_STANDARDS.md           # ← Naming, testing, commits
│   ├── ARCHITECTURE.md             # ← Structure, patterns
│   ├── SECURITY.md                 # ← Security & dependencies
│   └── CONTRIBUTING.md             # ← Workflow
│
├── .claude/README.md               # AI agent slash commands
│   ├── /context                    # Read AGENTS.md
│   ├── /check-todos                # View AGENTS.md priorities
│   └── /update-agents              # Update AGENTS.md
│
└── .github/workflows/README.md     # CI/CD pipelines
    └── SECURITY.md                 # ← References for secrets
```

## Source of Truth by Topic

| Topic | Source of Truth | Related Docs |
|-------|-----------------|--------------|
| **Naming conventions** | CODE_STANDARDS.md | ARCHITECTURE.md (references it) |
| **File structure** | ARCHITECTURE.md | README.md (references it) |
| **Code formatting** | CODE_STANDARDS.md | CONTRIBUTING.md (references it) |
| **Testing** | CODE_STANDARDS.md | CONTRIBUTING.md, ARCHITECTURE.md (reference it) |
| **Commit messages** | CODE_STANDARDS.md | CONTRIBUTING.md (references it) |
| **Performance** | CODE_STANDARDS.md | ARCHITECTURE.md (references it) |
| **Security** | SECURITY.md | CODE_STANDARDS.md, workflows (reference it) |
| **Dependencies** | SECURITY.md | CODE_STANDARDS.md (references it) |
| **Workflows** | .github/workflows/README.md | SECURITY.md (references it) |
| **Project status** | AGENTS.md | All docs (reference it) |

## Quick Links by Role

### New Developer
1. Read [SETUP.md](./SETUP.md)
2. Read [AGENTS.md](./AGENTS.md) for project context
3. Read [CODE_STANDARDS.md](./CODE_STANDARDS.md) for coding rules
4. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow

### Security Review
1. Read [SECURITY.md](./SECURITY.md)
2. Check [.github/workflows/README.md](.github/workflows/README.md) for CI/CD security
3. Review [CODE_STANDARDS.md](./CODE_STANDARDS.md#review-checklist)

### Project Lead / Manager
1. Check [AGENTS.md](./AGENTS.md) for current status
2. Review [CONTRIBUTING.md](./CONTRIBUTING.md) for team workflow
3. Check [.github/workflows/README.md](.github/workflows/README.md) for deployment

### AI Agent (Claude / Gemini)
1. Run `/context` command to read AGENTS.md
2. Run `/check-todos` to see priorities
3. Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md)
4. Run `/update-agents` when done

## DRY Principles Applied

This documentation follows the **DRY (Don't Repeat Yourself) principle**:

- ✅ **Naming conventions** defined once in CODE_STANDARDS.md, referenced elsewhere
- ✅ **File structure** defined once in ARCHITECTURE.md, referenced in README.md
- ✅ **Testing standards** defined once in CODE_STANDARDS.md, referenced in CONTRIBUTING.md
- ✅ **Commit format** defined once in CODE_STANDARDS.md, referenced in CONTRIBUTING.md
- ✅ **Security guidance** defined in SECURITY.md, referenced in workflows and standards
- ✅ **Project status** single source in AGENTS.md, referenced by all docs

Each topic has **one source of truth**, preventing conflicting or outdated guidance.

## Contributing to Documentation

When updating documentation:
1. Identify the **authoritative source** for that topic (see "Source of Truth" table above)
2. Update only that source document
3. Add cross-references from related documents
4. Never duplicate content across files
5. Update this guide if you introduce a new topic or consolidate existing ones

## Questions?

- Topic not covered? Check the appropriate file from "By Topic" section
- Can't find something? Search for keywords in the relevant source document
- Still stuck? Check [AGENTS.md](./AGENTS.md) for contact info or open an issue
