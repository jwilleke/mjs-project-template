# Project Template

A comprehensive Node.js/TypeScript project template with production-ready tooling, code standards, and documentation.

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd <project-name>
npm install

# Verify setup
npm run lint
npm run test

# Start development
npm run dev
```

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Documentation

- **[SETUP.md](SETUP.md)** - Environment setup and installation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute and development workflow
- **[CODE_STANDARDS.md](CODE_STANDARDS.md)** - Code quality and style guidelines
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Project structure and patterns
- **[AGENTS.md](AGENTS.md)** - Project context, goals, and status (for AI agents and team collaboration)

## What's Included

### Project Structure

```
src/
├── controllers/     # HTTP handlers / API routes
├── services/        # Business logic
├── models/          # Data types and interfaces
├── middleware/      # Express middleware, etc.
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── index.ts         # Entry point
```

### Code Quality Tools

- **TypeScript** - Strict type checking
- **ESLint** - Code quality with TypeScript support
- **Prettier** - Automatic code formatting
- **EditorConfig** - Cross-editor consistency
- **Husky** - Git pre-commit hooks

### Development Scripts

```bash
npm run dev              # Start development server
npm run build            # Build project
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix issues
npm run format           # Format code with Prettier
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Configuration Files

- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting
- `tsconfig.json` - TypeScript settings
- `.editorconfig` - Editor settings
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- `.husky/` - Git hooks

## Using This Template

1. **Click "Use this template"** on GitHub or clone it
2. **Run SETUP.md** to install dependencies
3. **Update AGENTS.md** with your project context
4. **Update README.md** with your project details
5. **Start developing** following CODE_STANDARDS.md

## For Teams

This template is designed for teams and AI agents to collaborate efficiently:

- **AGENTS.md** tracks project status, goals, and priorities
- **CODE_STANDARDS.md** ensures code quality and consistency
- **CONTRIBUTING.md** defines the workflow
- **Slash commands in `.claude/`** provide quick access to context

## Git Configuration

The repository is initialized with:

- Initial commit with all template files
- `.git/` for version control
- Ready to push to GitHub

## Customization

Review and customize:

1. **README.md** - Add project-specific information
2. **CODE_STANDARDS.md** - Adjust rules for your team
3. **package.json** - Update project name and dependencies
4. **.env.example** - Add your required environment variables
5. **ARCHITECTURE.md** - Document your specific architecture

## Next Steps

1. **Read [SETUP.md](SETUP.md)** for environment setup
2. **Read [AGENTS.md](AGENTS.md)** to understand project context
3. **Read [CODE_STANDARDS.md](CODE_STANDARDS.md)** for coding guidelines
4. **Check [ARCHITECTURE.md](ARCHITECTURE.md)** for project structure
5. **Review [CONTRIBUTING.md](CONTRIBUTING.md)** for workflow

## Features

- Pre-configured TypeScript with strict mode
- ESLint + Prettier for code quality and formatting
- Git hooks for automated quality checks
- EditorConfig for cross-editor consistency
- Markdown linting rules
- VS Code settings and recommendations
- Environment variable templating
- Comprehensive documentation

## Support

- Check the documentation files for answers
- Review CODE_STANDARDS.md for coding guidelines
- See CONTRIBUTING.md for development workflow
- Check AGENTS.md for project status and priorities
