# @jwilleke/agent-kit

Agent commands and document formats used across [jwilleke](https://github.com/jwilleke)'s repos,
plus a checker that tells a repo when it has fallen behind the kit.

The kit is language-agnostic — it ships markdown conventions and agent commands, not build tooling.
Most repos using it are not Node projects; this package is a delivery mechanism, not a dependency
of your application.

Canonical source: [jwilleke/mjs-project-template](https://github.com/jwilleke/mjs-project-template).

Repos are kept in step by `install-kit.sh` and the seeded `kit-check.yml` workflow, neither of which
requires this package — it is the convenient path for repos that already speak npm, not the only
one. See `docs/kit-distribution.md` upstream.

## Check whether a repo is behind

```bash
npx @jwilleke/agent-kit check              # this repo
npx @jwilleke/agent-kit check /path/to/repo
npx @jwilleke/agent-kit check --json
```

Reads the repo's `AGENTS.md` `KIT:START` marker, compares it against the kit version this package
was built from, and lists any kit-managed file missing from the repo.

Exits `0` even when the repo is behind — drift is the expected steady state, so gating on it makes a
weekly cron permanently red on a repo where nothing is broken. `2` means the check could not run.
Pass `--fail-on-drift` to opt in to `1` on drift.

In CI, `--report-issue` opens **one** tracking issue and updates it in place on later runs:

```yaml
- run: npx @jwilleke/agent-kit check . --report-issue
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

That needs `permissions: issues: write`. A check that opened a fresh issue per run would teach
everyone to ignore it.

The issue is created labelled `P2` + `kit` (override with `--label`, suppress with `--no-labels`) so
`/pstatus` bands it instead of flagging it `needs-triage`. Labels are applied on create only, so a
human regrade sticks.

## What is in the package

| Path | What it is |
| --- | --- |
| `bin/kit.mjs` | the checker; no dependencies |
| `commands/` | agent slash commands (`pstatus`, `wrap`, `context`, `session-commit`) |
| `templates/` | `AGENTS.md` boilerplate, `TODO.md`, `CLAUDE.md`, project log, kit-check workflow |
| `kit-files.tsv` | which files the kit manages, and how |
| `kit-version.txt` | the kit commit this package was built from |

Applying files to a repo is still `install-kit.sh` in the upstream repo. This package reports and
carries; it does not yet write.

## Versioning

The package follows semver on its own contents. `kit-version.txt` separately records the upstream
`git describe` commit it was cut from — that is what the checker compares against, and what a
consumer's `KIT:START` marker records. A packed copy has no git history, so without that stamp the
checker would fall back to the latest release tag and report every consumer as ahead of the kit.
