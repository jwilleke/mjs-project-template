# Architecture

This document outlines the project structure and architectural decisions. **All architectural decisions follow the principles in ~/GLOBAL-CODE-PREFERENCES.md**

**Related documents:**

- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Coding standards and conventions
- [SECURITY.md](./SECURITY.md) - Security guidelines and best practices
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow
- [AGENTS.md](./AGENTS.md) - Project context and goals

## Project Structure

```
docs/ - Developer documentation
src/
├── controllers/     # HTTP request handlers / API routes
├── services/        # Business logic and core functionality
├── models/          # Data models and TypeScript types
├── middleware/      # Express middleware or similar
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions and interfaces
└── index.ts         # Application entry point
```

## Directory Conventions

- controllers/ - Handle incoming requests and orchestrate responses
- services/ - Contain business logic, database operations, external API calls
- models/** - Data structures, interfaces, type definitions
- middleware/ - Authentication, logging, error handling, validation
- utils/ - Pure functions, helpers, shared utilities
- types/ - TypeScript interfaces and types (can also inline in files if small)

## Naming Conventions

See [CODE_STANDARDS.md](./CODE_STANDARDS.md#naming-conventions) for complete naming conventions.

## Technology Stack

- Runtime: Node.js (v18+)
- Language: TypeScript
- Package Manager: npm
- [Add project-specific technologies]

## Key Dependencies

- [List main dependencies and their purpose]

## Configuration Files

- **tsconfig.json** - TypeScript compiler configuration (strict mode enabled)
- **.eslintrc.json** - ESLint rules for code quality
- **.prettierrc.json** - Prettier rules for code formatting
- **.env** - Environment variables (not committed)
- **package.json** - Project metadata and scripts

## Code Quality Standards

All code must adhere to standards defined in `CODE_STANDARDS.md`:

- TypeScript strict mode
- ESLint linting
- Prettier formatting
- Unit tests for functionality
- DRY principle (Don't Repeat Yourself)

## Development Workflow

1. **Read context**: Check `AGENTS.md` for project status and priorities
2. **Create branch**: `git checkout -b feature/name`
3. **Make changes**: Follow `CODE_STANDARDS.md`
4. **Test and lint**: `npm run lint && npm run test`
5. **Commit**: Follow conventional commit format
6. **Push and PR**: Create pull request with clear description

## Common Patterns

### Error Handling

[Document error handling patterns used in the project]

### Async Operations

[Document how async/await and promises are handled]

### Database Access

[Document database patterns if applicable]

### External APIs

[Document external API integration patterns]

## Performance Considerations

See [CODE_STANDARDS.md](./CODE_STANDARDS.md#performance-considerations) for performance guidelines.

## Security Considerations

- Never commit `.env` files or secrets
- Validate all user input
- Use parameterized queries for database operations
- Follow OWASP guidelines
- Keep dependencies updated

## Testing Strategy

See [CODE_STANDARDS.md](./CODE_STANDARDS.md#testing) for testing standards and guidelines.

## Deployment

[Document deployment process, environments, and CI/CD if applicable]

## Documentation

- Keep README up to date
- Document complex algorithms
- Add examples for public APIs
- Update AGENTS.md when making significant changes
- Keep this ARCHITECTURE.md in sync with actual structure

## Adding New Features

1. Plan in `AGENTS.md` (high priority, medium priority, low priority sections)
2. Create feature branch
3. Follow file structure conventions
4. Write tests alongside code
5. Update documentation
6. Create pull request with references to issues

## Dependencies and Maintenance

- Review dependencies regularly
- Run `npm audit` to check for vulnerabilities
- Update dependencies thoughtfully
- Document why each dependency is needed
- Remove unused dependencies

## Related Documents

- **README.md** - Project overview and quick start
- **SETUP.md** - Environment setup instructions
- **CONTRIBUTING.md** - How to contribute
- **CODE_STANDARDS.md** - Code quality and style guidelines
- **AGENTS.md** - Project context and status (shared across AI agents)
