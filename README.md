# Project Template

A Node.js/TypeScript project template with production-ready tooling, code standards, and multi-agent collaboration framework.

## Quick Start

### Prerequisites

- Node.js v18+ (`node --version`) — [download](https://nodejs.org/)
- npm v9+ (`npm --version`)
- Git (`git --version`)

### Setup

```bash
git clone <repository-url>
cd <project-name>
nvm use                  # Uses .nvmrc (Node 20)
npm install
cp .env.example .env     # Edit with your values
```

### Verify

```bash
npm run lint             # Lint code + markdown
npm run typecheck        # TypeScript type checking
npm run test             # Run tests
npm run build            # Build project
```

## Development Scripts

```bash
npm run dev              # Start development server (tsx)
npm run build            # Build project (TypeScript -> dist/)
npm start                # Run built project
npm run lint             # Lint code AND markdown
npm run lint:fix         # Auto-fix lint issues
npm run format           # Format with Prettier
npm run test             # Run tests (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run lint:code        # ESLint only
npm run lint:md          # Markdown only
npm run typecheck        # TypeScript type checking without emit
```

## Documentation

- [AGENTS.md](AGENTS.md) - Project context, status, and AI agent collaboration
- [CODE_STANDARDS.md](CODE_STANDARDS.md) - Code quality, style, and guiding principles
- [ARCHITECTURE.md](ARCHITECTURE.md) - Project structure and patterns
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow and PRs
- [SECURITY.md](SECURITY.md) - Security guidelines and best practices
- [.github/workflows/README.md](.github/workflows/README.md) - CI/CD pipelines

## What's Included

### Code Quality Tools

- TypeScript - Strict type checking
- ESLint 9 - Code quality with flat config (`eslint.config.mjs`)
- Vitest - Fast test runner
- Prettier - Automatic code formatting
- Markdownlint - Documentation consistency
- EditorConfig - Cross-editor consistency
- Husky + lint-staged - Pre-commit hooks on changed files only

### Configuration Files

- `eslint.config.mjs` - ESLint rules (flat config)
- `vitest.config.ts` - Test runner configuration
- `.prettierrc.json` - Prettier formatting
- `.markdownlint-cli2.jsonc` - Markdown rules, globs and ignores (one file)
- `tsconfig.json` - TypeScript settings (ESM)
- `tsconfig.build.json` - Build-only config
- `.editorconfig` - Editor settings
- `.env.example` - Environment template
- `.nvmrc` - Node version for nvm
- `.husky/` - Git hooks

### GitHub Integration

- CI workflow - Lint, typecheck, test, build, security audit
- Deploy workflow - Production deployment template
- PR template - Standardized pull request format
- Issue templates - Bug reports and feature requests

## Using This Template

This repo serves two missions: a __Node/TypeScript starter__ and the canonical home of the
__agent kit__ (commands, labels, markdown rules, GitHub templates) that any repo — Node or not —
can install via `install-kit.sh`.

### For New Projects (Node starter)

- Clone this template
- Run `npm install`
- Update AGENTS.md with your project context
- Update README.md with your project details
- Start developing following CODE_STANDARDS.md

### Installing the agent kit into any repo (new or existing)

`install-kit.sh` is idempotent — run it on an empty repo to scaffold, or on an existing repo to
upgrade. It overwrites canonical tool files, merges `.gitignore`, seeds docs/issue templates
create-if-absent, manages the AGENTS.md block, and migrates `docs/project_log.md` →
`private/project_log.md`. Re-run anytime to pick up a newer kit version.

Which files it manages, and how, is declared in [`kit-files.tsv`](kit-files.tsv) — the installer
does not carry its own list.

For the contract behind those behaviours — which files are overwritten versus preserved, how the
version is recorded, what is deliberately not distributed, and why the kit is not an npm package —
see [docs/kit-distribution.md](docs/kit-distribution.md). Read it before changing anything under
`templates/` or `.claude/commands/`; those files fan out to every downstream repo.

#### What a repo needs to qualify

Almost nothing, and nothing about its language. The kit installs into C++, Go, Python, Shell and
Flux repos as readily as Node ones — half the current consumers have no `package.json`.

__To install:__ `bash`, `git` and `awk` __on your machine__, not in the target. The target can be an
empty directory.

__To install with `--pr`__, the target must additionally be a git repo, have an `origin` remote, and
have a __clean working tree__ — the sync has to be the only change in the PR. You also need an
authenticated `gh`. A repo reachable only over SSH without `gh` must be synced without `--pr`.

__To keep itself up to date afterwards,__ three things, all on GitHub's side:

1. __Actions enabled__, so the seeded `kit-sync.yml` can run.
2. __Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and
   approve pull requests."__ It is off by default in many repos and organisations, and no
   `permissions:` block in a workflow can grant it. Without it the sync still applies cleanly and
   pushes its branch — it files an issue with a compare link instead of failing.
3. __Nothing else.__ No PAT, no GitHub App, no secret to rotate. `GITHUB_TOKEN` only, scoped to the
   repo and expiring with the job.

At runtime the job uses `node`, `npx`, `git` and `gh`, all of which GitHub runners already ship. That
is why the checker is dependency-free Node: a C++ or Go repo runs it without adopting a runtime.

__The one real constraint__ is markdown. A repo's existing files must satisfy the kit's rules, and
the sync brings them into line for you — `install-kit.sh` runs `markdownlint-cli2 --fix` over the
target using the config it just installed. What that cannot repair is content nobody authored:
vendored libraries, generated API docs, scraped pages. Those take a `.markdownlint-cli2.jsonc` beside
them, which the kit never writes into and which therefore survives every sync. The installer names
the offending directories when it finds them.

#### Keeping a repo up to date

`install-kit.sh` seeds `.github/workflows/kit-sync.yml`. On a push to the default branch, or on
demand, the repo checks itself out, checks the kit out beside it, and — if it is behind — __runs the
installer and opens a pull request__ labelled `P2`. Merging it is the only manual step.

There is no cron. A schedule fires while nobody is looking, and GitHub disables scheduled workflows
after 60 days of repository inactivity, so it stops firing in exactly the dormant repos that drift
furthest.

Drift is measured on __tags__, not commits. A consumer is behind when a release has been cut, not
every time anything lands here — otherwise twelve repos would open a pull request over a typo fix.

The workflow itself is a thin stub; its body is `utility/kit-sync.sh`, an ordinary kit file. That
split exists because `GITHUB_TOKEN` may not push a file under `.github/workflows/`, so logic held in
the workflow could only ever be updated by a human syncing every consumer by hand.

Run the checker by hand against any repo from a kit checkout:

```bash
node bin/kit.mjs check /path/to/repo          # 0 even when behind; 2 if it could not check
node bin/kit.mjs check /path/to/repo --fail-on-drift   # opt in to drift gating CI
node bin/kit.mjs check /path/to/repo --json   # machine-readable
```

```bash
./install-kit.sh --dry-run /path/to/repo   # preview every change
./install-kit.sh /path/to/repo             # apply in place, leaving changes uncommitted
/path/to/repo/utility/sync-labels.sh owner/repo   # apply the standard GitHub labels
```

#### Syncing via pull request

`--pr` applies the kit on a `chore/kit-sync-<version>` branch, commits, pushes, and opens a PR
instead of leaving changes in your working tree. This is the preferred way to sync a downstream
repo: a sync rewrites files in a repo whose owner did not initiate the change, so it gets a review
point and a single revertable commit rather than landing unannounced. CI runs either way — the kit's
workflows fire on `push` as well as `pull_request` — but a PR runs it as a gate *before* the change
lands rather than a notification after.

```bash
./install-kit.sh --pr /path/to/repo           # branch, commit, push, open PR
./install-kit.sh --dry-run --pr /path/to/repo # preview, touching nothing
```

The PR is left open for a human to merge — the script never lands it.

Requires an authenticated `gh`, an `origin` remote, and a clean working tree — the sync must be the
only change in the PR. It detects `master` vs `main` rather than assuming, restores the branch you
started on (including on failure), and reports "already at kit `<version>`" without opening an empty
PR when there is nothing to apply. A repo synced over SSH without `gh` must be synced without
`--pr`.

## For Teams

This template supports teams and AI agents collaborating:

- AGENTS.md - Single source of truth for project state (works with any AI agent)
- CLAUDE.md - Thin pointer to AGENTS.md (auto-loaded by Claude Code)
- CODE_STANDARDS.md - Coding rules and guiding principles
- CONTRIBUTING.md - Development workflow

## Troubleshooting

### npm install fails

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Node version issues

```bash
nvm install 20
nvm use 20
```

### Port already in use

```bash
PORT=3001 npm run dev
```

## Customization

- README.md - Add project-specific information
- CODE_STANDARDS.md - Adjust rules for your team
- package.json - Update project name and dependencies
- .env.example - Add your required environment variables
- ARCHITECTURE.md - Document your specific architecture
- SECURITY.md - Review and customize security policies
- .github/workflows/ - Configure CI/CD for your deployment target
