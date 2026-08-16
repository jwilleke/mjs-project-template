# @jwilleke/agent-kit

Agent commands and document formats used across [jwilleke](https://github.com/jwilleke)'s repos,
plus a checker that tells a repo when it has fallen behind the kit.

The kit is language-agnostic — it ships markdown conventions and agent commands, not build tooling.
Most repos using it are not Node projects; this package is a delivery mechanism, not a dependency
of your application.

Canonical source: [jwilleke/mjs-project-template](https://github.com/jwilleke/mjs-project-template).

## This package is not published

It is built from the kit sources and marked `private`. There is no registry copy, so there is no
`npx @jwilleke/agent-kit`. Install it from a locally built tarball, or run the checker straight out
of a kit checkout:

```bash
cd packages/agent-kit && npm pack        # -> jwilleke-agent-kit-<version>.tgz
npm install /path/to/jwilleke-agent-kit-1.0.0.tgz
```

Repos are normally kept in step by `install-kit.sh` and the seeded `kit-check.yml` workflow, neither
of which needs this package. See `docs/kit-distribution.md` upstream.

## Check whether a repo is behind

```bash
agent-kit check                  # this repo, once installed
agent-kit check /path/to/repo
agent-kit check --json

node bin/kit.mjs check /path/to/repo    # or straight from a kit checkout
```

Reads the repo's `AGENTS.md` `KIT:START` marker, compares it against the kit version this package
was built from, and lists any kit-managed file missing from the repo. Exits `1` when the repo is
behind, `0` when it is current.

In CI, `--report-issue` opens **one** tracking issue and updates it in place on later runs:

```yaml
- run: node .kit-check/bin/kit.mjs check . --kit .kit-check --report-issue
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

That needs `permissions: issues: write`. A check that opened a fresh issue per run would teach
everyone to ignore it.

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

The package carries a semver version of its own, which matters only if it is ever published.
`kit-version.txt` separately records the upstream `git describe` commit it was cut from — that is
what the checker compares against, and what a consumer's `KIT:START` marker records. A packed copy
has no git history, so without that stamp the checker would fall back to the latest release tag and
report every consumer as ahead of the kit.
