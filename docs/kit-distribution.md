---
title: Kit Distribution
description: How the agent kit reaches downstream repos, who owns which file, and why it is not an npm package.
last_updated: "2026-08-16"
---

# Kit Distribution

How `mjs-project-template` gets into other repos, what it is allowed to overwrite when it does, and
where the model currently leaks. Read this before changing anything under `templates/`,
`.claude/commands/`, or `install-kit.sh` — those files are not local, they fan out.

`README.md` documents how to *run* the installer. This document is about the contract it enforces.

## The model in one line

The kit is **pushed**, not pulled: an operator runs `install-kit.sh` from a local clone of this repo
against a local clone of the target repo. Nothing in a downstream repo reaches back here, and no
downstream repo can update itself.

That has one consequence worth stating plainly, because every gap below descends from it: **a
downstream repo is at whatever kit version was last pushed to it, and it has no way to find out that
a newer one exists.** The `kit_version` stamp records what happened, not what was intended.

## Two entry points

| Situation | Path |
| --- | --- |
| New project | Use this repo as a GitHub template, then run `install-kit.sh` in the clone |
| Existing repo (any language) | `./install-kit.sh [--pr] /path/to/repo` from a clone of this repo |

The second is the common one, and the one the file-ownership rules exist for. `--pr` is the
preferred mode for a repo you were not otherwise working in: it branches, commits, pushes, and opens
a PR, so the change gets a review point and one revertable commit instead of landing unannounced in
someone's working tree.

`--pr` refuses to run when it cannot do that safely: no `gh`, unauthenticated `gh`, no `origin`, a
dirty working tree, or the target being this repo itself. It restores the branch it started on, even
on failure.

## Who owns which file

Every path the installer touches falls into exactly one of these behaviours. The behaviour, not the
file's contents, is what decides whether a local edit survives.

| Behaviour | What happens to local changes | Paths |
| --- | --- | --- |
| `overwrite` | **Destroyed.** Copied wholesale from the kit every run. | `.claude/commands/pstatus.md`, `session-commit.md`, `context.md`, `wrap.md`, `utility/sync-labels.sh`, `.markdownlint.jsonc` |
| `managed-block` | **Destroyed inside the markers**, preserved outside them | `AGENTS.md` between `KIT:START` and `KIT:END` |
| `create-if-absent` | **Preserved.** Written only when the file does not exist. | `TODO.md`, `CLAUDE.md`, `private/project_log.md`, `.vscode/extensions.json`, `.github/workflows/markdown-lint.yml`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` |
| `merge` | **Preserved.** Missing lines appended, nothing removed. | `.gitignore` (adds `private/`, `.claude/settings.local.json`, `.claude/worktrees/`) |
| `unignore` | Removes a blanket `.claude/` or `CLAUDE.md` ignore so kit files get tracked; `.claude/settings.local.json` stays ignored | `.gitignore` |
| `migrate` | One-time move, runs before create-if-absent | `docs/project_log.md` → `private/project_log.md` |
| `supersede` | Deletes the file it replaces | `.markdownlint.json` → `.markdownlint.jsonc` |
| `retire` | Deletes commands the kit no longer ships | `.claude/commands/check-todos.md`, `.claude/commands/status.md` |

The rule that follows from the table: **fix kit files upstream, never in the consumer.** A local fix
to an `overwrite` file or to the managed block is deleted by the next sync without a word. If the
kit is wrong, it is wrong for nine repos — change it here.

## Versioning

The kit version is `git describe --tags --long` of the kit checkout at install time — e.g.
`v1.0.0-55-gc4b69c8`. It is not semver, and it is not meant to be: it is a pointer to a commit.

It is recorded in two places in every downstream repo:

- the `KIT:START` marker in `AGENTS.md` — this is the **authoritative** record;
- `kit_version` in the `AGENTS.md` frontmatter, written by `stamp_kit_version`.

`docs/sync-log.md` tracks the repo-level picture but is maintained by hand and drifts. Verify
against the marker before relying on it:

```bash
grep -o "KIT:START [^ ]*" /path/to/repo/AGENTS.md
```

The set of consumers is `downstream-repos.txt`, one `owner/repo` per line, machine-readable:

```bash
grep -vE '^\s*(#|$)' downstream-repos.txt
```

## What is deliberately not distributed

The installer ships the agent's *operating rules*, not this repo's Node scaffolding. Not synced, and
each for its own reason:

- `package.json`, `eslint.config.mjs`, `tsconfig*.json`, `vitest.config.ts`, `src/` — Node-specific;
  most consumers are not Node projects (see below).
- `install-kit.sh` itself — the installer lives with the kit, so a consumer cannot self-update. This
  is the push model working as designed, not an oversight, but it does mean an operator with a
  stale clone pushes a stale kit.
- `templates/`, `downstream-repos.txt`, `docs/sync-log.md` — kit-authoring material, meaningless
  downstream.
- `.claude/commands/semver.md` and `utility/set-version.mjs` — **an inconsistency, not a decision.**
  `/semver` is a real agent command that consumers would benefit from, but adding it to the
  overwrite list would clobber forks that built their own release tooling (`jwilleke/ngdpbase` did
  exactly that). Left out until someone decides which way it should go.
- `.claude/commands/update-agents.md`, `.claude/README.md` — never added to the list; no considered
  reason found, probably an omission.

## Known gaps

- **A local edit to the managed block dies silently** ([#44](https://github.com/jwilleke/mjs-project-template/issues/44)).
  People edit the block precisely when the boilerplate is missing a rule they need — the most
  valuable signal the kit gets, and it is currently destroyed rather than reported. A downstream
  repo lost a "remove `in-review` on close" rule this way before it was adopted upstream as
  [#42](https://github.com/jwilleke/mjs-project-template/issues/42).
- **No consumer-side version check.** Nothing tells a repo it is behind. Discovery is an operator
  remembering to run a sweep.
- **`docs/sync-log.md` is hand-written** and drifts from the markers it summarises.
- **Partial command coverage** — four of the six `.claude/commands/*.md` files sync; `/semver` and
  `/update-agents` do not, so downstream agents follow different rules depending on the command.

## Should this be an npm package?

No — and the reason is in the consumer list, not in the tooling.

Of the nine repos in `downstream-repos.txt`, **two have a `package.json`**
(`jwilleke/ngdpbase`, `jwilleke/fairways-gen2-website`). The rest are Shell, C++, Python, Go, and a
Flux/Kubernetes config repo. Distributing an agent kit through npm would require seven repos to
adopt Node and a `package.json` they otherwise have no use for, purely as a delivery mechanism. The
kit is bash and markdown; its dependency footprint is `bash`, `git`, `awk`, and optionally `gh`.

The second reason is that packaging solves the part that is already easy. The hard part of this
system is the **merge semantics** — which files are overwritten, which are seeded once, which are
managed between markers. An npm package would still need `install-kit.sh` to apply those rules to a
repo. Registry distribution moves the bytes; it does not decide what happens when a consumer edited
line 40 of a managed block.

What packaging *would* genuinely fix — and these are real:

- a consumer could pin a kit version as a declared dependency rather than a stamp recording what was
  pushed to it;
- `npm outdated` / Dependabot would surface "you are behind" without an operator sweep;
- no local clone of this repo needed to install.

Those are worth having. They are also all obtainable without npm, which is the recommendation:

1. **Teach `install-kit.sh` to fetch its own source at a ref** — `--from <git-ref>`, cloning shallow
   into a temp dir when run outside a kit checkout. Removes the local-clone requirement and makes
   "install kit `v1.0.0-55`" a reproducible instruction rather than a description of one machine's
   working tree.
2. **Ship the installer into consumers** (`overwrite "install-kit.sh"`), so a repo can update itself
   from a ref instead of waiting for an operator. This is the change that converts the model from
   push-only to pull-capable, and it is a prerequisite for the point below.
3. **Add a version check** — a command, or a step in `/pstatus`, comparing the local `KIT:START`
   marker against the kit's latest tag and reporting drift. That is the actual value of "being a
   package", available without being one.

Revisit if the consumer mix changes: if most downstream repos become Node projects, an
`@jwilleke/agent-kit` package with a `bin` entry becomes the shorter path to the same three
benefits. Until then it adds a runtime to seven repos to solve a problem a git ref already solves.

## Related

- `README.md` — how to run the installer, flags, and modes
- `docs/sync-log.md` — per-repo sync state (hint; the `KIT:START` marker is the truth)
- `downstream-repos.txt` — the consumer list
- `AGENTS.md` — when a kit sync must go through a PR
