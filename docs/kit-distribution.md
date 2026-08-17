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

The kit is __pushed__, not pulled: an operator runs `install-kit.sh` from a local clone of this repo
against a local clone of the target repo. Nothing in a downstream repo reaches back here, and no
downstream repo can update itself.

That has one consequence worth stating plainly, because every gap below descends from it: __a
downstream repo is at whatever kit version was last pushed to it, and it has no way to find out that
a newer one exists.__ The `kit_version` stamp records what happened, not what was intended.

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
| `overwrite` | __Destroyed.__ Copied wholesale from the kit every run. | `.claude/commands/pstatus.md`, `session-commit.md`, `context.md`, `wrap.md`, `utility/sync-labels.sh`, `.markdownlint-cli2.jsonc` |
| `overwrite-or-suffix` | __Preserved.__ If the repo already owns that filename with its own content, the kit installs its copy as `<name>-kit.<ext>` and leaves yours alone. Once suffixed, always suffixed. | `.claude/commands/semver.md` |
| `managed-block` | __Destroyed inside the markers__, preserved outside them | `AGENTS.md` between `KIT:START` and `KIT:END` |
| `create-if-absent` | __Preserved.__ Written only when the file does not exist. | `TODO.md`, `CLAUDE.md`, `private/project_log.md`, `.vscode/extensions.json`, `.github/workflows/markdown-lint.yml`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` |
| `merge` | __Preserved.__ Missing lines appended, nothing removed. | `.gitignore` (adds `private/`, `.claude/settings.local.json`, `.claude/worktrees/`) |
| `unignore` | Removes a blanket `.claude/` or `CLAUDE.md` ignore so kit files get tracked; `.claude/settings.local.json` stays ignored | `.gitignore` |
| `migrate` | One-time move, runs before create-if-absent | `docs/project_log.md` → `private/project_log.md` |
| `supersede` | Deletes the file it replaces | `.markdownlint.json` → `.markdownlint.jsonc` → `.markdownlint-cli2.jsonc` |
| `retire` | Deletes commands the kit no longer ships | `.claude/commands/check-todos.md`, `.claude/commands/status.md` |

The last four are not per-file lists, so they stay in `install-kit.sh`; the rest come from the
manifest.

The rule that follows from the table: __fix kit files upstream, never in the consumer.__ If the kit
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

Every consumer carries `.agent-kit.json` at its root, written by `install-kit.sh` and read by
`bin/kit.mjs`. It is the __authoritative__ record of what the kit put there:

```json
{
  "schema": 1,
  "installed": "v1.6.0",
  "installed_ref": "v1.6.0-0-g1e15ccc",
  "installed_at": "2026-08-17",
  "files": {
    ".claude/commands/pstatus.md": { "behavior": "overwrite", "sha256": "…" }
  }
}
```

__Drift is measured on the tag, not on `git describe`.__ `git describe` moves on every commit to the
kit, so under the old comparison every consumer went behind within minutes of any push — including a
README typo. Comparing `installed` against the kit's latest tag makes "behind" mean a release
happened: a few times a year, not continuously. `installed_ref` keeps the exact commit for
provenance without participating in the comparison.

__Files are hashed, not stamped.__ A stamp records what a file claims to be; a hash records what it
is. That is what catches a partial sync, a bad merge, or a file restored from an old branch —
none of which a version string can see.

The `KIT:START` marker stays, because it delimits the managed block and is load-bearing structure.
Its version payload is now a __fallback only__, for repos not yet synced since manifests existed, and
is dropped once every consumer carries a manifest.

The frozen `kit_version` stamps in `TODO.md`, `CLAUDE.md` and `private/project_log.md` are gone.
`create-if-absent-stamped` substituted them once, at creation, and never again, so they were fossils
by construction — in three consumers the only copy lived in `private/project_log.md`, which is
gitignored, and disagreed with the marker in the same repo.

There is deliberately __no hand-maintained table of who is on which version.__ `docs/sync-log.md`
was that table, and it was retired: it declared itself non-authoritative in its own first paragraph,
listed seven sync PRs as open when four had merged and one was closed, and had no rows at all for
three consumers. A cache that must be checked against the truth before use is not worth keeping.

> __Correction (2026-08-17).__ The commit that retired it also claimed the table recorded
> `garage-car-positioning` as synced when it had never been installed. That was wrong, and the table
> was right: the repo is installed and current. The error came from reading `AGENTS.md` out of a
> local clone that was far behind its remote — the same mistake described below. Recorded here rather
> than quietly dropped, because a correction that leaves no trace is how the original claim survived.

Ask __the remote__, never a checkout on somebody's disk:

```bash
jq -r '.repos[]' downstream-repos.json | while read -r repo; do
  marker=$(gh api -H "Accept: application/vnd.github.raw" \
    "/repos/$repo/contents/AGENTS.md" 2>/dev/null | grep -o 'KIT:START [^ ]*' | head -1)
  printf '%-34s %s\n' "$repo" "${marker:-no marker}"
done
```

A local clone is not evidence of what a repo contains. `jwilleke/mjs-ha` was 122 commits behind
origin on the machine this was written from, and a fleet-wide version table built by grepping local
checkouts was wrong for most rows. `bin/kit.mjs check` and `install-kit.sh` both read the working
tree, so both now warn when the target trails its upstream — but the warning is a guard, not a
substitute for asking the remote.

Narrative about a sync — what broke, what was skipped and why — is session history and belongs in
`docs/project_log.md`, not in a state file. Two files recording the same events drift apart, and the
drift is silent.

The set of consumers is `downstream-repos.json`:

```bash
jq -r '.repos[]' downstream-repos.json
```

`excluded[]` carries the repos deliberately kept out, each with its reason, so an absence is never
mistaken for an oversight. The default branch is __not__ recorded — it varies, and
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
- `.claude/README.md` — never added to the list; no considered reason found, probably an omission.

`/semver`, `utility/set-version.mjs` and `/update-agents` __were__ on this list and are now
distributed — see [#56](https://github.com/jwilleke/mjs-project-template/issues/56). `/semver` was
held back because shipping it would clobber forks that built their own release tooling
(`jwilleke/ngdpbase` bumps `src/utils/version.ts`; `jwilleke/mjs-ha` tags date-stamped snapshots).
That was a real objection to `overwrite`, not to distribution, so it ships as
`overwrite-or-suffix`: repos that own the name keep it and receive `semver-kit.md` alongside.

## How a repo learns it is behind

`bin/kit.mjs check` compares a repo's `KIT:START` marker against the kit's current version and
reports drift, plus any `overwrite`-managed file missing from the repo entirely.

```bash
node bin/kit.mjs check /path/to/repo          # human-readable
node bin/kit.mjs check /path/to/repo --json   # for tooling
```

Consumers do not run it by hand. `install-kit.sh` seeds `.github/workflows/kit-check.yml`
(create-if-absent), which runs weekly, checks out the kit beside the repo, and calls the checker
with `--report-issue`. When the repo is behind, __one__ tracking issue is opened and thereafter
updated in place — never a fresh issue per run, which would train everyone to ignore it.

### Why drift exits 0

Being behind is not a failure, it is the steady state: every consumer goes stale the moment the kit
is tagged. Exiting 1 on drift put a red X and a failure email on a weekly cron in repos where the
build was fine, the tests passed and the release was good — competing with red X's that mean
something, which the kit's own `/pstatus` text says is how a check gets ignored.

So the exit codes read:

| Code | Meaning |
|---|---|
| `0` | the check ran and said its piece, __including__ when the repo is behind |
| `1` | behind, and `--fail-on-drift` was passed (opt-in gating) |
| `2` | the check could not do its job: bad usage, no kit to compare against, or `--report-issue` could not file the issue |

The last row is the one that matters: once the issue is the only notification, failing to open it is
the real breakage, so a missing `GITHUB_TOKEN` on a repo that IS behind exits 2 rather than shrugging.

The issue is created graded `P2`, because the kit's own `/pstatus` labels any unplaced issue
`needs-triage` — an unlabelled drift issue would arrive in every consumer already flagged as
awaiting a decision nobody needs to make. Labels are set on __create only__: re-asserting them on
update would overrule a human who deliberately regraded the issue `deferred` during a freeze. If a
repo has never run `utility/sync-labels.sh`, GitHub rejects the whole create over the unknown label,
so the checker retries unlabelled — the notification outranks the grade.

### Why there is no `kit` label

There was one, briefly, so a repo could filter the chore out of a ranked backlog. It does not earn
its place. The `kit-check:drift` marker guarantees __one__ drift issue per repo forever, and a label
exists to filter a class, not a set of size one — and that one issue is already identifiable by its
`[kit]` title prefix and by the marker itself. A new label is also defined in no repo until someone
sweeps `utility/sync-labels.sh --all`, so its first effect would have been a chore added in order to
remove a chore. `--label kit` still works for anyone who wants it.

Both behaviours live in `bin/kit.mjs`, and the seeded workflow runs the checker from a __fresh kit
checkout__. Consumers pick this up on their next scheduled run with no re-sync.

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

It is a __build artifact__, not a second copy. `build.mjs` assembles it from the authored sources at
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

The first matters most and is the least obvious: six of the twelve consumers are __private__ repos, so
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

- __major__ — a change a consumer must act on: a command removed or renamed, a manifest behaviour
  changed such that files that were preserved are now overwritten, a `check` exit code or `--json`
  shape that existing automation reads.
- __minor__ — new commands, new templates, new managed files, new checker flags. Additive; a
  consumer that ignores the release is no worse off.
- __patch__ — wording, fixes, and clarifications inside existing files.

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

One-time setup: an npm __automation__ token (they bypass 2FA, which interactive publishing does not)
stored as the `NPM_TOKEN` repo secret.

## Known gaps

- __The overwrite warning is line-exact.__ A rule adopted upstream in different wording still
  reports as "will be lost", because the comparison is textual. Conservative in the right
  direction — a false alarm costs a glance, a missed one costs the rule.
- __The check is not yet running anywhere.__ The workflow exists and is seeded on install, but the
  nine consumers have not been synced since it was added, so none of them has it yet.
- __Nothing is on npm yet.__ The package builds, packs, and installs from a local tarball, and the
  release workflow is in place, but the first publish has not been run — so `npx @jwilleke/agent-kit`
  does not resolve, and the seeded workflow still checks the kit out rather than using it.
- __Dependabot reaches only the npm-managed consumers.__ Once published, `ngdpbase` and
  `fairways-gen2-website` can depend on the package and get PRs; the other seven have no
  `package.json` and stay on the tracking issue. That asymmetry is the profile split still to be
  decided.
- __The kit has no declared namespace.__ Nothing states which command filenames are the kit's, so a
  repo naming its own command `semver.md` cannot know it is claiming a name the kit also uses, and
  `install-kit.sh` cannot tell a retired kit command from a repo's own file. `overwrite-or-suffix`
  handles the collision it has already met; it does not declare the namespace.

## Should this be an npm package?

No — and the reason is in the consumer list, not in the tooling.

Of the twelve repos in `downstream-repos.json`, __six have a `package.json`__ and six do not — the
rest are Shell, C++, Python, Go, and a Flux/Kubernetes config repo. Distributing an agent kit through
npm would require half the fleet to adopt Node and a `package.json` they otherwise have no use for,
purely as a delivery mechanism. The kit is bash and markdown; its dependency footprint is `bash`,
`git`, `awk`, and optionally `gh`.

That split was 2:7 when this section was written and is 6:6 now, so the argument is weaker than it
was — but it is an argument about the *six*, and it does not improve as the fleet grows.

The second reason is that packaging solves the part that is already easy. The hard part of this
system is the __merge semantics__ — which files are overwritten, which are seeded once, which are
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

__The answer is "yes, as well as" rather than "instead of".__ `@jwilleke/agent-kit` is built and
published publicly, and the seeded workflow keeps working for the seven consumers that cannot
consume a package. The registry serves the two that can; it does not become the delivery mechanism
for the rest.

Public rather than private, because a private package needs an auth token in every consumer's
workflow — worse than the checkout it would replace — and the kit repo is already public, so the
contents are not confidential. What publishing adds is convenience (`npx` with no checkout step) and
a Dependabot signal for the npm-managed repos.

What remains open:

1. __Phase 3 — port the applying half out of bash.__ Largest piece, worst failure mode: a parity bug
   in the `KIT:START`/`KIT:END` surgery corrupts `AGENTS.md` in nine repos at once. `kit-files.tsv`
   makes it a mechanical port rather than a re-derivation.
2. __`install-kit.sh --from <git-ref>`__ — clone the kit shallow into a temp dir when run outside a
   checkout, so "install kit `v1.0.0-55`" is a reproducible instruction rather than a description of
   one machine's working tree.
3. __The consumer profile split__ — which repos consume the package and which stay on the checkout.
   Only becomes concrete once the package is on npm.

## Related

- `README.md` — how to run the installer, flags, and modes
- `downstream-repos.json` — the consumer list
- `AGENTS.md` — when a kit sync must go through a PR
