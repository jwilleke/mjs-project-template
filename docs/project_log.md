---
title: Project Log
description: Session history for mjs-project-template.
last_updated: "2026-08-17"
kit_version: "v1.0.0-9-gae575c2"
---

# Project Log

## 2026-08-17-03

- Agent: Claude
- Subject: Correct a fleet report built from stale local clones; guard both tools against it
- Current Issue: #53
- Work Done:
  - Synced `jwilleke/mjs-ha` via `install-kit.sh --pr` — [mjs-ha#57](https://github.com/jwilleke/mjs-ha/pull/57),
    merged, both checks green. Marker now `v1.2.2-0-g14ec519`, `## Agent Kit Protocols` rename landed
    with no MD024 collision, and `kit-check.yml` now exists there
  - That PR touched one file where the dry-run predicted seven, which exposed the error: `--pr`
    branches from `origin/<default>`, the dry-run had read the working tree, and the local `mjs-ha`
    clone was **122 commits behind origin**
  - Consequence: the fleet version table posted to #53 was read from local checkouts and was wrong
    for most rows. Corrected on #53 with state read from GitHub. `garage-car-positioning` is
    installed and current — the retired `docs/sync-log.md` was right and the retirement commit was
    wrong. Four repos, not three, have no `kit-check.yml` (`mj-infra-flux` joins them)
  - v1.2.2 — an unparseable `KIT:START` marker now counts as behind rather than `unknown`. Three
    repos on pre-tag bare-SHA markers had been filing nothing at all for about a year
  - v1.3.0 — `bin/kit.mjs check` and `install-kit.sh` both warn when the target checkout trails its
    upstream; `--fetch` refreshes first. `install-kit.sh --pr` is exempt, it already branches from
    the remote
  - `docs/kit-distribution.md` carries the correction inline, and its "how to see fleet state"
    snippet now queries the GitHub API instead of looping over local clones
- Commits: 14ec519, d1793eb
- Files Modified:
  - `bin/kit.mjs`, `bin/kit.test.mjs`
  - `install-kit.sh`
  - `docs/kit-distribution.md`
  - `package.json`, `packages/agent-kit/package.json`
- Notes:
  - The frontmatter-fossil evidence in #53 for `deby` / `grow-tent` / `mjs-ha` came from
    `private/project_log.md`, which is gitignored and cannot be checked from a remote at all. Re-derive
    it from a fresh clone before relying on it.
  - Still silent, no `kit-check.yml`: `mj-infra-flux`, `geohazardwatch`, `mjs-media-handling`,
    `fairways-gen2-website`. One `install-kit.sh --pr` each fixes it permanently.

## 2026-08-17-02

- Agent: Claude
- Subject: Drop the `kit` label — grade the drift issue `P2` alone
- Current Issue: #52
- Work Done:
  - `DEFAULT_ISSUE_LABELS` is now `['P2']`. The `kit` label was meant to let a repo filter the chore
    out of a ranked backlog, but the `kit-check:drift` marker guarantees one drift issue per repo
    forever — a label filters a class, not a set of size one — and a new label is defined in no repo
    until someone sweeps `sync-labels.sh --all`, so it was a fleet-wide chore added to remove a chore
  - Removed from `utility/sync-labels.sh`; deleted the label from this repo
  - Reasoning recorded in `docs/kit-distribution.md` under _Why there is no `kit` label_ so it does
    not get re-proposed. `--label kit` still available for anyone who wants it
  - Released 1.2.1 (npm + tag); the fleet-wide label sweep is no longer needed at all
- Commits: 5897a1d
- Files Modified:
  - `bin/kit.mjs`, `utility/sync-labels.sh`
  - `templates/kit-check.yml.tmpl`
  - `README.md`, `docs/kit-distribution.md`, `packages/agent-kit/README.md`
  - `package.json`, `packages/agent-kit/package.json`

## 2026-08-17-01

- Agent: Claude
- Subject: Stop Kit Check reporting healthy repos as failures
- Current Issue: #49, #50, #51, #52
- Work Done:
  - `bin/kit.mjs` exits 0 on drift; `--fail-on-drift` restores gating. Exit 2 reserved for the check
    being unable to run, including `--report-issue` failing to file the issue that carries the news
  - Drift issue created labelled `P2` + `kit` (create-only, so a human regrade sticks); falls back to
    filing unlabelled on a 422 from an undefined label. `--label` / `--no-labels` override
  - `utility/sync-labels.sh` defines the `kit` label; applied to this repo
  - Managed AGENTS.md heading renamed to `## Agent Kit Protocols` so it cannot collide with a repo's
    own section below KIT:END; `install-kit.sh` also warns on any remaining collision at sync time
  - Added `utility/lint-fresh-install.mjs` (wired into `npm run lint`): installs into an empty repo
    and asserts lint, gitignore ordering, `git add -A` safety, idempotence, and the collision warning
  - Bumped root and `@jwilleke/agent-kit` to 1.2.0
- Commits: fcb791b, 2fcf86d
- Files Modified:
  - `bin/kit.mjs`, `bin/kit.test.mjs`
  - `install-kit.sh`, `utility/sync-labels.sh`, `utility/lint-fresh-install.mjs`
  - `templates/agents-boilerplate.md`, `templates/kit-check.yml.tmpl`
  - `README.md`, `docs/kit-distribution.md`, `packages/agent-kit/README.md`
  - `package.json`, `packages/agent-kit/package.json`, `TODO.md`

Rules for the log entry:

- Newest entry at top
- Use today's date for yyyy-MM-dd
- Use ## as an incrementing number if there are multiple entries for the same date (start at 01)
- For Agent, use the name of the AI agent (e.g., "Claude")
- For Current Issue, reference any GitHub issue numbers as #123 format
- For Commits, use the short hash(es) from git log
- For Files Modified, list every file that was changed in this session

<!-- ## Entries go below here -->

## 2026-08-16-01

- Agent: Claude
- Subject: Clear the P0 js-yaml alert and work every open issue
- Current Issue: #43, #39, #42, #38, #40
- Work Done:
  - Ran `/pstatus`: bridged Dependabot alert 22 (js-yaml GHSA-5p4m-2wfm-xmqj, high) into #43 and applied `needs-triage` to #42
  - #43 — merged Dependabot PR #41 (js-yaml 4.3.0 → 4.3.1); open Dependabot alerts now 0; closed
  - Established that `TODO.md` carries no history at all (no merged/closed counts, no narrative, no other repos) — written into `pstatus.md`, `TODO.md.tmpl`, and the AGENTS boilerplate
  - #39 — open PRs now share the priority bands with issues; `🔀 Open PRs` band removed from both `pstatus.md` and the drifted `TODO.md.tmpl`; PR priority = own label → highest linked issue → needs-triage
  - #42 — added the missing "remove `in-review` when closing" half of the rule to the boilerplate; split the underlying `install-kit.sh` silent-overwrite problem into #44
  - #38 — operator chose to keep the resume-block wipe; closed as not planned, but documented the `/wrap` → `/context` → `/pstatus` handover in the boilerplate so the behaviour stops reading as a bug
  - #40 — operator chose the stronger route: `utility/set-version.mjs` writes the version fields only (both lockfile places, no re-resolution), with tests pinning byte-identical round-trip, untouched dependency entries, lockfileVersion 1, and an exactly-two-line diff
  - Fixed a latent pre-commit failure: lint-staged handed eslint every staged `*.ts`, so any commit touching a root config (e.g. `vitest.config.ts`) failed with "not found by the project service"
  - Gate green: lint, typecheck, build, 19 tests
- Commits: 0b403df, afa118f, 092ff93, 1f1b5c3, c78dfa5, c4b69c8
- Files Modified:
  - `.claude/commands/pstatus.md`
  - `.claude/commands/semver.md`
  - `templates/agents-boilerplate.md`
  - `templates/TODO.md.tmpl`
  - `utility/set-version.mjs`
  - `utility/set-version.test.mjs`
  - `vitest.config.ts`
  - `package.json`
  - `package-lock.json`
  - `TODO.md`
  - `docs/project_log.md`
- Notes:
  - `npm audit` still reports 2 high findings not raised as Dependabot alerts — brace-expansion (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895) and nanoid (GHSA-2v37-7h3g-55p8). Both say `fixAvailable: true`; not investigated this session, no tracking issue yet.
  - `install-kit.sh` does not sync `.claude/commands/semver.md` or `utility/set-version.mjs`, so #40's fix does not reach consumers. Deliberate — adding `semver.md` to the overwrite list would clobber forks with their own bump tooling (ngdpbase).

## 2026-07-27-02

- Agent: Claude
- Subject: First PR-based kit sync across the fleet (v1.0.0-43-g7cf371c)
- Current Issue: none
- Work Done:
  - Seven PRs opened with `install-kit.sh --pr`, the first use of PR mode against real remotes. All
    seven were `MERGEABLE`. `ngdpbase` ran first as a watched pilot before the rest followed
  - Two repos not synced: `jwilleke` (excluded by the operator) and `mj-infra-flux`, whose working
    tree held two untracked files — `--pr` refuses a dirty tree, correctly, since it stages with
    `git add -A` and would otherwise sweep unrelated files into the sync commit
- Notes:
  - `markdown-lint` failed on five of the seven PRs, and none of it was caused by the sync. The
    failures were pre-existing violations in each repo's own documentation, in files no sync PR
    touches:

    | repo | total lint errors | errors in synced files |
    | --- | --- | --- |
    | grow-tent | 6 | 0 |
    | grow-nutrient-tank | 276 | 0 |
    | mjs-ha | 202 | 0 |
    | deby | 61 | 0 |
    | garage-car-positioning | 99 | 0 |

  - `markdown-lint.yml` runs only on pull requests. These repos had not opened a PR since the
    workflow was seeded, so the violations were never surfaced; the sync PR was simply the first
    thing to run it. Expect this on any repo's first PR-based sync — triage it as that repo's own
    backlog, not as sync breakage. Errors under `.claude/commands/` in `deby` and
    `garage-car-positioning` are in repo-specific commands (`check-k8s.md`, `check-net.md`,
    `update-docs.md`) that the kit does not ship

## 2026-07-27-01

- Agent: Claude
- Subject: Bridge two open Dependabot alerts into issues and patch them
- Current Issue: #22, #23
- Work Done:
  - Ran `/pstatus`: 2 open Dependabot alerts, no code-scanning analysis, 3 untriaged bugs
  - Bridged alert 17 (linkify-it, GHSA-v245-v573-v5vm) into #22 and alert 16 (brace-expansion, GHSA-3jxr-9vmj-r5cp) into #23, both `security` + `P0`
  - Applied `needs-triage` to #16 (had `bug` only, no placement label)
  - `npm audit fix`: linkify-it 5.0.1 → 5.0.2, brace-expansion 5.0.6 → 5.0.8 and 1.1.14 → 1.1.16; js-yaml → 4.2.0 and postcss → 8.5.23 carried along
  - Verified lint, tests (1 passed), and typecheck all green
  - Regenerated TODO.md — P0 band cleared
- Commits: 592a882, 064faef
- Files Modified:
  - `package-lock.json`
  - `TODO.md`
  - `docs/project_log.md`
- Notes:
  - Two advisories remain open in `npm audit` and are NOT covered by #22/#23 — both need a breaking upgrade or have no patch yet: brace-expansion GHSA-mh99-v99m-4gvg (OOM; 1.x line unpatched, would need eslint@10.8.0) and js-yaml GHSA-52cp-r559-cp3m (4.2.0 still in range). Not yet surfaced as Dependabot alerts.

## 2026-06-20-01

- Agent: Claude
- Subject: Encode release policy (standing authorization + git-describe model) — partial #10
- Current Issue: #10
- Work Done:
  - Added `## Release Policy` section to AGENTS.md: standing authorization to cut releases on any minor/major bump or on request without confirmation; patch chains may be deferred; live version between releases is `git describe` (`vX.Y.Z-N-g<sha>`); a formal cut graduates that to a clean `vX.Y.Z` tag
  - Updated `/semver` command: removed the minor/major confirmation prompt, documented the standing authorization and git-describe versioning model, added a Rules entry forbidding re-prompts while keeping the hard safety gates
  - Bumped AGENTS.md `last_updated` to 2026-06-20
  - Linked both open issues in `TODO.md` with full GitHub URLs; refreshed bands from labels
  - Applied `needs-triage` to #10 and #11 (no prior priority labels); created the `needs-triage` repo label
  - Note: the broader "make /semver project-agnostic" half of #10 (master/main detection, package.json/release-please/manual-tag mechanisms, pick a default) remains open
- Commits: c622c2a, 139b33e
- Files Modified:
  - `AGENTS.md`
  - `.claude/commands/semver.md`
  - `TODO.md`
  - `docs/project_log.md`

## 2026-06-16-02

- Agent: Claude
- Subject: Full kit sync — frontmatter, markdown-lint CI, VS Code extensions, unwrapped boilerplate; push all 8 downstream repos
- Current Issue: none
- Work Done:
  - Added YAML frontmatter with `kit_version: "KIT-VERSION"` to all templates (CLAUDE.md.tmpl, TODO.md.tmpl, project_log.md.tmpl, agents-frontmatter.md.tmpl)
  - Added richer scaffold content to CLAUDE.md.tmpl, TODO.md.tmpl, project_log.md.tmpl
  - Added `.vscode/extensions.json` recommending `DavidAnson.vscode-markdownlint` — seeded to all repos
  - Added canonical `.github/workflows/markdown-lint.yml` using `markdownlint-cli2-action` (no npm) — seeded to all repos
  - Fixed ngdpbase CI (`ci.yml`, `ci-passing-tests.yml`) to check `.markdownlint.jsonc` not just `.markdownlint.json`
  - Unwrapped all boilerplate bullets to single long lines per session feedback
  - Committed and pushed all 8 downstream repos (version bump + extensions.json where new)
  - Updated `docs/sync-log.md` with final installed versions
  - Fixed MD001 heading-increment errors in `.github/workflows/README.md`
- Commits: ae575c2, e10bd0c, 01c77cd, 1fa177f, 3083ea6, 0a27f04, dd5d8af, 50845b6
- Files Modified:
  - `templates/agents-boilerplate.md`
  - `templates/agents-frontmatter.md.tmpl`
  - `templates/CLAUDE.md.tmpl`
  - `templates/TODO.md.tmpl`
  - `templates/project_log.md.tmpl`
  - `.vscode/extensions.json`
  - `.github/workflows/markdown-lint.yml`
  - `.github/workflows/README.md`
  - `docs/sync-log.md`
  - `TODO.md`
  - `docs/project_log.md`

## 2026-06-16-01

- Agent: Claude
- Subject: Sync /session-commit rule and create sync-log to all kitted downstream repos
- Current Issue: none
- Work Done:
  - Synced issue decomposition, issue/PR links, awaiting-approval, and /session-commit rules to jwilleke/deby via SSH
  - Created `docs/sync-log.md` to track downstream repo syncs by template commit
  - Added /session-commit rule to 8 local kitted repos (jackery-homeassistant excluded — fork)
  - Backfilled sync-log entries for prior 2026-06-14 syncs
- Commits: bfe2b2c, 0c9fe25, e0dc781, 5e92460, 4d1bdd3, 95a3caf, 5a4736d, ddcfe96, 5d37f484, 576a8069
- Files Modified:
  - `docs/sync-log.md`
  - `docs/project_log.md`

## 2026-06-14-01

- Agent: Claude
- Subject: Add agent behavior rules for issue links, in-review label, and /session-commit
- Current Issue: none
- Work Done:
  - Added issue/PR link rule — agents must always pair `#N` with full GitHub URL
  - Added awaiting-approval rule — agents apply `in-review` label and leave structured comment
  - Added `/session-commit` rule — agents must never use bare `git commit`
- Commits: acbb401, f836b7a
- Files Modified:
  - `AGENTS.md`

## 2026-06-12-01

- Agent: Claude
- Subject: Rename /status skill to /pstatus to avoid built-in command conflict
- Current Issue: none
- Work Done:
  - Renamed `.claude/commands/status.md` → `pstatus.md`
  - Updated all internal `/status` references to `/pstatus` within the file
- Commits: f112d2b
- Files Modified:
  - `.claude/commands/pstatus.md` (renamed from `status.md`)
