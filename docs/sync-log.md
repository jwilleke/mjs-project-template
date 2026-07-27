# Template Sync Log

Current sync state for each downstream repo. The `KIT:START` comment in each repo's `AGENTS.md`
is the authoritative per-file version record; this table tracks the repo-level picture.

**Method:** sync with `install-kit.sh --pr`, which opens a PR rather than pushing to the default
branch. A sync rewrites files in a repo you were not working in, so it gets an announcement and one
revert point. (CI runs either way — the kit's workflows fire on `push` as well as `pull_request`.)
Record the method actually used per repo below — a repo without `gh` available cannot use `--pr`.

**This table drifts.** It is written by hand, so treat the `KIT:START` marker in each downstream
`AGENTS.md` as the truth and this table as a hint. Verify before relying on a row:

```bash
grep -o "KIT:START [^ ]*" /path/to/repo/AGENTS.md
```

**Excluded repos (permanent):**

- `theak/jackery-homeassistant` — upstream fork, no push access; never sync.

## Current State

`Kit Version` is the version **on the default branch**. A repo with an open sync PR is still at its
old version until that PR merges.

| Repo | Last Synced | Kit Version | Open sync PR | Method |
| --- | --- | --- | --- | --- |
| [jwilleke/garage-car-positioning](https://github.com/jwilleke/garage-car-positioning) | 2026-06-16 | v1.0.0-12-g1fa177f | [#17](https://github.com/jwilleke/garage-car-positioning/pull/17) | install-kit.sh --pr |
| [jwilleke/grow-nutrient-tank](https://github.com/jwilleke/grow-nutrient-tank) | 2026-06-16 | v1.0.0-12-g1fa177f | [#18](https://github.com/jwilleke/grow-nutrient-tank/pull/18) | install-kit.sh --pr |
| [jwilleke/grow-tent](https://github.com/jwilleke/grow-tent) | 2026-06-16 | v1.0.0-12-g1fa177f | [#6](https://github.com/jwilleke/grow-tent/pull/6) | install-kit.sh --pr |
| [jwilleke/jwilleke](https://github.com/jwilleke/jwilleke) | 2026-06-16 | v1.0.0-12-g1fa177f | — | excluded from the 2026-07-27 sync by operator |
| [jwilleke/mj-infra-flux](https://github.com/jwilleke/mj-infra-flux) | 2026-06-16 | v1.0.0-12-g1fa177f | — | skipped 2026-07-27 — untracked files in the working tree |
| [jwilleke/mjs-ha](https://github.com/jwilleke/mjs-ha) | 2026-06-16 | v1.0.0-12-g1fa177f | [#27](https://github.com/jwilleke/mjs-ha/pull/27) | install-kit.sh --pr |
| [jwilleke/ngdpbase](https://github.com/jwilleke/ngdpbase) | 2026-06-16 | v1.0.0-26-gc0e965b | [#994](https://github.com/jwilleke/ngdpbase/pull/994) | install-kit.sh --pr |
| [jwilleke/yourphr](https://github.com/jwilleke/yourphr) | 2026-06-16 | v1.0.0-26-gc0e965b | [#398](https://github.com/jwilleke/yourphr/pull/398) | install-kit.sh --pr |
| [jwilleke/deby](https://github.com/jwilleke/deby) | 2026-06-16 | v1.0.0-3-g02fd112 | [#30](https://github.com/jwilleke/deby/pull/30) | install-kit.sh --pr |

## 2026-07-27 — first PR-based sync (v1.0.0-43-g7cf371c)

Seven PRs opened with `install-kit.sh --pr`, the first use of PR mode against real remotes. All
seven are `MERGEABLE`. `ngdpbase` ran first as a watched pilot before the rest followed.

Two repos were not synced: `jwilleke` (excluded by the operator) and `mj-infra-flux`, whose working
tree held two untracked files — `--pr` refuses a dirty tree, correctly, since it stages with
`git add -A` and would otherwise sweep unrelated files into the sync commit. Commit or ignore those
two files, then re-run.

**`markdown-lint` fails on five of the seven PRs, and none of it is caused by the sync.** The
failures are pre-existing violations in each repo's own documentation, in files no sync PR touches:

| repo | total lint errors | errors in synced files |
| --- | --- | --- |
| grow-tent | 6 | 0 |
| grow-nutrient-tank | 276 | 0 |
| mjs-ha | 202 | 0 |
| deby | 61 | 0 |
| garage-car-positioning | 99 | 0 |

`markdown-lint.yml` runs only on pull requests. These repos had not opened a PR since the workflow
was seeded, so the violations were never surfaced. The sync PR is simply the first thing to run it.
Expect this on any repo's first PR-based sync — triage it as that repo's own backlog, not as sync
breakage. Errors reported under `.claude/commands/` in `deby` and `garage-car-positioning` are in
repo-specific commands (`check-k8s.md`, `check-net.md`, `update-docs.md`) that the kit does not
ship.
