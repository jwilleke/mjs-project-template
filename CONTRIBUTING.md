# Contributing

Thank you for your interest in contributing to this project! This document provides guidelines for developers and AI agents working on this codebase. All contributions must follow [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md).

## Before You Start

- Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) for overarching project principles
- Read [AGENTS.md](./AGENTS.md) for project context and status
- Review [CODE_STANDARDS.md](./CODE_STANDARDS.md) for coding guidelines
- Check [SECURITY.md](./SECURITY.md) for security practices
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Requests](#pull-requests)
- [Code Review Process](#code-review-process)

## Getting Started

See [SETUP.md](./SETUP.md) for complete installation and setup instructions including prerequisites, cloning, dependency installation, environment configuration, and verification steps.

## Development Workflow

### Read Project Context First

Before starting work, read `AGENTS.md` to understand:

- Project goals and current status
- Architecture and tech stack
- Known blockers or issues
- Priority tasks

Use the slash command:

```bash
/context
```

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/bug-description
```

Branch naming: `type/description`

### Make Changes

Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md) for all code conventions including TypeScript strict mode, naming conventions, formatting rules, and the DRY principle.

## Making Changes

### Linting and Formatting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

### Testing

```bash
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Check coverage
```

## Commit Guidelines

See [CODE_STANDARDS.md](./CODE_STANDARDS.md#git-commit-messages) for detailed commit message guidelines.

Quick reference:

```bash
git commit -m "type(scope): description"
```

Examples: `feat(auth): add JWT refresh`, `fix(api): handle null response`, `docs: update README`

## Pull Requests

### Before Creating a PR

1. Update branch: `git fetch origin && git rebase origin/master`
2. Run tests: `npm run lint && npm run test && npm run build`
3. Update `AGENTS.md` if making significant changes

### PR Checklist

- [ ] Code follows CODE_STANDARDS.md
- [ ] Tests pass
- [ ] Linting passes
- [ ] No hardcoded secrets
- [ ] Commit messages follow conventions
- [ ] AGENTS.md updated if applicable

## Code Review Process

- Be respectful and constructive
- Review promptly
- Approve when satisfactory
- All CI checks must pass before merging

## Questions?

- Check AGENTS.md for project context
- Read CODE_STANDARDS.md for guidelines
- Open an issue for questions
