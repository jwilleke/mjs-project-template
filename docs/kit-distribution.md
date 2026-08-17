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

The list lives in [`kit-files.tsv`](../kit-files.tsv), not in any tool. Both `install-kit.sh`
(which applies files) and `bin/kit.mjs` (which checks them) read it, so they cannot disagree about
what the kit owns — a drift that is otherwise silent and that this repo has already suffered once,
between `pstatus.md` and `TODO.md.tmpl`.

```bash
grep -vE '^\s*(#|$)' kit-files.tsv
```

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

The last four are not per-file lists, so they stay in `install-kit.sh`; the rest come from the
manifest.

The rule that follows from the table: **fix kit files upstream, never in the consumer.** If the kit
is wrong, it is wrong for twelve repos — change it here.

An `overwrite` file is still replaced wholesale, but no longer silently: the installer compares the
target's copy against the same file at the kit version stamped in that repo, and prints the lines
that are about to disappear. That check exists because five rules in `jwilleke/yourphr` — each added
after a real incident — were one merge away from being deleted without a trace.

### Where repo-specific knowledge goes

A command file is exactly where a repo accumulates operating knowledge, and exactly what the sync
destroys. The answer is a sibling the kit never touches:

```text
.claude/commands/pstatus.md          kit-managed, overwritten every sync
.claude/commands/pstatus.local.md    yours, never written / read / deleted by install-kit.sh
```

Each kit command ends with a section telling the agent to read its `.local.md` if present and treat
the contents as part of the command. Commit the file — it is repo knowledge, and it should travel
with the repo.

The split is worth applying honestly. "Run the ecosystem's audit, because scanners that match by
registry coordinates cannot see a git-URL dependency" is generic — it belongs upstream, and it is
now in `pstatus.md` for everyone. "Run `cd frontend && yarn audit --groups dependencies`, whose exit
code is a bitmask, see `docs/security/dependency-scanning.md`" is true of one repo — it belongs in
that repo's `.local.md`.

The managed block is the exception, and only because it is warned about. Before rewriting it, the
installer compares what is on disk against the boilerplate of the kit version stamped in that repo's
`KIT:START` marker. Differing from *that* is a local edit; differing from the incoming boilerplate is
merely an upgrade. Local edits are printed line by line, in `--dry-run` too:

```text
WARNING: AGENTS.md managed block was edited locally since kit v1.0.0-49-g7e03e8d.
         These lines are NOT in the new boilerplate and will be lost:
           - Closing issues — Always remove the `in-review` label when closing …
         Re-add anything you need BELOW the KIT:END marker, or raise it upstream.
```

It warns and proceeds — it never blocks the install, and it never merges. When the stamped version
cannot be resolved (unreachable ref, shallow clone) it degrades to a generic warning rather than a
silent pass.

A rule someone keeps re-adding to a managed block is a rule the block is missing, so treat the
warning as a feature request against the kit, not as noise.

## Versioning

The kit version is `git describe --tags --long` of the kit checkout at install time — e.g.
`v1.0.0-55-gc4b69c8`. It is not semver, and it is not meant to be: it is a pointer to a commit.

It is recorded in two places in every downstream repo:

- the `KIT:START` marker in `AGENTS.md` — this is the **authoritative** record;
- `kit_version` in the `AGENTS.md` frontmatter, written by `stamp_kit_version`.

There is deliberately **no hand-maintained table of who is on which version.** `docs/sync-log.md`
was that table, and it was retired: it declared itself non-authoritative in its own first paragraph,
and by the time it was removed it recorded a repo as synced that had never been installed, listed
seven sync PRs as open when four had merged and one was closed, and had no rows for three consumers
at all. A cache that must be checked against the truth before use is not worth keeping.

Ask the repos instead:

```bash
jq -r '.repos[]' downstream-repos.json | while read -r repo; do
  node bin/kit.mjs check "/Volumes/hd2A/workspaces/github/${repo#*/}" --kit . --json
done
```

Narrative about a sync — what broke, what was skipped and why — is session history and belongs in
`docs/project_log.md`, not in a state file. Two files recording the same events drift apart, and the
drift is silent.

The set of consumers is `downstream-repos.json`:

```bash
jq -r '.repos[]' downstream-repos.json
```

`excluded[]` carries the repos deliberately kept out, each with its reason, so an absence is never
mistaken for an oversight. The default branch is **not** recorded — it varies, and
`install-kit.sh --pr` detects it per repo; storing it would be one more hand-kept fact to drift.

Example — open a kit-sync PR against every repo listed:

```bash
jq -r '.repos[]' downstream-repos.json | while read -r repo; do
  ./install-kit.sh --pr "/Volumes/hd2A/workspaces/github/${repo#*/}"
done
```

## What is deliberately not distributed

The installer ships the agent's *operating rules*, not this repo's Node scaffolding. Not synced, and
each for its own reason:

- `package.json`, `eslint.config.mjs`, `tsconfig*.json`, `vitest.config.ts`, `src/` — Node-specific;
  most consumers are not Node projects (see below).
- `install-kit.sh` itself — the installer lives with the kit, so a consumer cannot self-update. This
  is the push model working as designed, not an oversight, but it does mean an operator with a
  stale clone pushes a stale kit.
- `templates/`, `downstream-repos.json`, `kit-files.tsv` — kit-authoring
  material, meaningless downstream.
- `bin/kit.mjs` — the checker runs *from* a kit checkout, not from a copy in the consumer. The
  seeded workflow checks the kit out beside the repo, so the consumer always runs the current
  checker rather than a stale copy of it.
- `.claude/commands/semver.md` and `utility/set-version.mjs` — **an inconsistency, not a decision.**
  `/semver` is a real agent command that consumers would benefit from, but adding it to the
  overwrite list would clobber forks that built their own release tooling (`jwilleke/ngdpbase` did
  exactly that). Left out until someone decides which way it should go.
- `.claude/commands/update-agents.md`, `.claude/README.md` — never added to the list; no considered
  reason found, probably an omission.

## How a repo learns it is behind

`bin/kit.mjs check` compares a repo's `KIT:START` marker against the kit's current version and
reports drift, plus any `overwrite`-managed file missing from the repo entirely.

```bash
node bin/kit.mjs check /path/to/repo          # human-readable
node bin/kit.mjs check /path/to/repo --json   # for tooling
```

Consumers do not run it by hand. `install-kit.sh` seeds `.github/workflows/kit-check.yml`
(create-if-absent), which runs weekly, checks out the kit beside the repo, and calls the checker
with `--report-issue`. When the repo is behind, **one** tracking issue is opened and thereafter
updated in place — never a fresh issue per run, which would train everyone to ignore it.

### Why drift exits 0

Being behind is not a failure, it is the steady state: every consumer goes stale the moment the kit
is tagged. Exiting 1 on drift put a red X and a failure email on a weekly cron in repos where the
build was fine, the tests passed and the release was good — competing with red X's that mean
something, which the kit's own `/pstatus` text says is how a check gets ignored.

So the exit codes read:

| Code | Meaning |
|---|---|
| `0` | the check ran and said its piece, **including** when the repo is behind |
| `1` | behind, and `--fail-on-drift` was passed (opt-in gating) |
| `2` | the check could not do its job: bad usage, no kit to compare against, or `--report-issue` could not file the issue |

The last row is the one that matters: once the issue is the only notification, failing to open it is
the real breakage, so a missing `GITHUB_TOKEN` on a repo that IS behind exits 2 rather than shrugging.

The issue is created graded `P2`, because the kit's own `/pstatus` labels any unplaced issue
`needs-triage` — an unlabelled drift issue would arrive in every consumer already flagged as
awaiting a decision nobody needs to make. Labels are set on **create only**: re-asserting them on
update would overrule a human who deliberately regraded the issue `deferred` during a freeze. If a
repo has never run `utility/sync-labels.sh`, GitHub rejects the whole create over the unknown label,
so the checker retries unlabelled — the notification outranks the grade.

### Why there is no `kit` label

There was one, briefly, so a repo could filter the chore out of a ranked backlog. It does not earn
its place. The `kit-check:drift` marker guarantees **one** drift issue per repo forever, and a label
exists to filter a class, not a set of size one — and that one issue is already identifiable by its
`[kit]` title prefix and by the marker itself. A new label is also defined in no repo until someone
sweeps `utility/sync-labels.sh --all`, so its first effect would have been a chore added in order to
remove a chore. `--label kit` still works for anyone who wants it.

Both behaviours live in `bin/kit.mjs`, and the seeded workflow runs the checker from a **fresh kit
checkout**. Consumers pick this up on their next scheduled run with no re-sync.

This is why the checker is Node with no dependencies: Actions runners already ship Node, so
`grow-tent` (C++) and `yourphr` (Go) run it without adopting a runtime or gaining a `package.json`.
The workflow is the only file a consumer needs, and it is seeded create-if-absent, so a repo that
edits the schedule keeps its version.

Phases 2 and 3 of [#45](https://github.com/jwilleke/mjs-project-template/issues/45) — publishing
`@jwilleke/agent-kit` so the workflow becomes a one-line `npx`, and porting the applying half out of
bash — are deliberately deferred until this shape has proven itself.

## The package

`packages/agent-kit/` is the kit in Node package form: `@jwilleke/agent-kit`, a `bin` with no
dependencies, carrying the commands, the templates, `kit-files.tsv`, and the checker.

It is published publicly, under the `@jwilleke` scope. Public rather than private is deliberate: a
private package or GitHub Packages would need an auth token in every consumer's workflow, which is a
worse trade than the credential-free checkout the kit already uses.

It is a **build artifact**, not a second copy. `build.mjs` assembles it from the authored sources at
the repo root at pack time and rebuilds its directories from scratch, so a file deleted upstream
cannot survive in the package. Nothing under `packages/agent-kit/bin`, `commands/`, or `templates/`
is committed — those paths are gitignored, and editing them there is editing a build output.

```bash
cd packages/agent-kit && npm pack           # runs build.mjs via prepack
npx @jwilleke/agent-kit check /path/to/repo
```

### What ships, and why it is safe to ship

The package contains only kit content: the four commands, six templates, `kit-files.tsv`,
`kit-version.txt`, the checker, and a README. Sixteen files.

Publishing makes those bytes permanent and world-readable, so the contents were audited rather than
assumed before the first release, and that audit is worth repeating whenever the manifest grows:

```bash
cd packages/agent-kit && npm pack && tar xzf jwilleke-agent-kit-*.tgz
grep -rniE "deby|grow-nutrient-tank|mjs-ha|fairways-gen2-website" package   # private consumers
grep -rn "/Volumes/\|/Users/" package                                       # local paths
grep -rhoE "https?://[A-Za-z0-9./_-]+" package | sort -u                    # every host
```

The first matters most and is the least obvious: six of the twelve consumers are **private** repos, so
naming one in a shipped template would disclose its existence. `downstream-repos.json` names all twelve
and is deliberately not in the package.

### Two version numbers, deliberately

The package has a semver version of its own. `kit-version.txt` inside it separately records the
`git describe` commit the package was cut from, and *that* is what the checker compares against a
consumer's `KIT:START` marker.

They cannot be collapsed into one. A published package needs a version that means something to npm;
the marker needs a commit pointer that means something to `install-kit.sh`. The stamp is also load
bearing rather than informational: an installed package has no git history, so without it the
checker falls back to the latest release tag — which is older than any `git describe` marker — and
reports every consumer as *ahead of* the kit while exiting 0. A silent false pass.

### What a package version means

Publishing forces a judgement `git describe` never did. For `@jwilleke/agent-kit`:

- **major** — a change a consumer must act on: a command removed or renamed, a manifest behaviour
  changed such that files that were preserved are now overwritten, a `check` exit code or `--json`
  shape that existing automation reads.
- **minor** — new commands, new templates, new managed files, new checker flags. Additive; a
  consumer that ignores the release is no worse off.
- **patch** — wording, fixes, and clarifications inside existing files.

Rule of thumb: if a consumer who upgrades without reading the release notes could lose work or have
a workflow break, it is major.

### Releasing

Bump `version` in `packages/agent-kit/package.json` and push. That is the whole procedure — no tag,
no manual publish. `.github/workflows/release-kit.yml` asks the registry whether that exact version
exists: `404` means release it, `200` means stop. Any other response fails the job rather than
guessing, and a missing `NPM_TOKEN` skips the release instead of failing every push.

The version field is therefore the only release control. Pushes that change kit content without
touching it are no-ops, which is the intended behaviour: content moves continuously, releases are
deliberate.

A published version is permanent — npm allows unpublishing only within 72 hours, and the name is
claimed for good on first release.

One-time setup: an npm **automation** token (they bypass 2FA, which interactive publishing does not)
stored as the `NPM_TOKEN` repo secret.

## Known gaps

- **The overwrite warning is line-exact.** A rule adopted upstream in different wording still
  reports as "will be lost", because the comparison is textual. Conservative in the right
  direction — a false alarm costs a glance, a missed one costs the rule.
- **The check is not yet running anywhere.** The workflow exists and is seeded on install, but the
  nine consumers have not been synced since it was added, so none of them has it yet.
- **Nothing is on npm yet.** The package builds, packs, and installs from a local tarball, and the
  release workflow is in place, but the first publish has not been run — so `npx @jwilleke/agent-kit`
  does not resolve, and the seeded workflow still checks the kit out rather than using it.
- **Dependabot reaches only the npm-managed consumers.** Once published, `ngdpbase` and
  `fairways-gen2-website` can depend on the package and get PRs; the other seven have no
  `package.json` and stay on the tracking issue. That asymmetry is the profile split still to be
  decided.
- **Partial command coverage** — four of the six `.claude/commands/*.md` files sync; `/semver` and
  `/update-agents` do not, so downstream agents follow different rules depending on the command.

## Should this be an npm package?

No — and the reason is in the consumer list, not in the tooling.

Of the twelve repos in `downstream-repos.json`, **six have a `package.json`** and six do not — the
rest are Shell, C++, Python, Go, and a Flux/Kubernetes config repo. Distributing an agent kit through
npm would require half the fleet to adopt Node and a `package.json` they otherwise have no use for,
purely as a delivery mechanism. The kit is bash and markdown; its dependency footprint is `bash`,
`git`, `awk`, and optionally `gh`.

That split was 2:7 when this section was written and is 6:6 now, so the argument is weaker than it
was — but it is an argument about the *six*, and it does not improve as the fleet grows.

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

The second — the one you actually feel — is already delivered without npm, by the seeded workflow
described above. That was phase 1 of
[#45](https://github.com/jwilleke/mjs-project-template/issues/45).

**The answer is "yes, as well as" rather than "instead of".** `@jwilleke/agent-kit` is built and
published publicly, and the seeded workflow keeps working for the seven consumers that cannot
consume a package. The registry serves the two that can; it does not become the delivery mechanism
for the rest.

Public rather than private, because a private package needs an auth token in every consumer's
workflow — worse than the checkout it would replace — and the kit repo is already public, so the
contents are not confidential. What publishing adds is convenience (`npx` with no checkout step) and
a Dependabot signal for the npm-managed repos.

What remains open:

1. **Phase 3 — port the applying half out of bash.** Largest piece, worst failure mode: a parity bug
   in the `KIT:START`/`KIT:END` surgery corrupts `AGENTS.md` in nine repos at once. `kit-files.tsv`
   makes it a mechanical port rather than a re-derivation.
2. **`install-kit.sh --from <git-ref>`** — clone the kit shallow into a temp dir when run outside a
   checkout, so "install kit `v1.0.0-55`" is a reproducible instruction rather than a description of
   one machine's working tree.
3. **The consumer profile split** — which repos consume the package and which stay on the checkout.
   Only becomes concrete once the package is on npm.

## Related

- `README.md` — how to run the installer, flags, and modes
- `downstream-repos.json` — the consumer list
- `AGENTS.md` — when a kit sync must go through a PR
