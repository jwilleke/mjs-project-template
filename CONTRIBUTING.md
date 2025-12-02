# Contributing

Thank you for your interest in contributing to this project! This document provides guidelines for developers and AI agents working on this codebase. **All contributions must follow ~/GLOBAL-CODE-PREFERENCES.md**

**Before you start:**

- Read ~/GLOBAL-CODE-PREFERENCES.md for overarching project principles
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

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <project-name>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Verify setup**

   ```bash
   npm run lint
   npm run build
   ```

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

Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md) for all code conventions:

- TypeScript strict mode
- Naming conventions (kebab-case files, camelCase functions)
- Single quotes, 2-space indentation
- Explicit return types
- DRY principle

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
