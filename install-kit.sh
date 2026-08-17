#!/usr/bin/env bash
# install-kit.sh — idempotent installer for the mjs agent kit.
#
#   New repo : run in a fresh/empty repo  → drops the kit + seeds starter docs.
#   Upgrade  : run in an existing repo    → updates canonical files, never clobbers your content.
#   Re-run   : safe anytime to pick up a newer kit version.
#
# Usage:
#   install-kit.sh [--dry-run] [--pr] [target-dir]
#                                                # target-dir defaults to the current directory
#
# Sync modes:
#   (default)    apply the kit in place, leaving the changes uncommitted for you to review
#   --pr         apply on a `chore/kit-sync-<version>` branch, then commit, push, and open a PR.
#                Requires an authenticated `gh`, an `origin` remote, and a clean working tree.
#                A kit sync rewrites files in a repo whose owner did not initiate the change, so it
#                gets a review point and a single revertable commit rather than landing unannounced.
#                CI runs either way — on `push` as well as `pull_request` — but a PR runs it as a
#                gate BEFORE the change lands instead of a notification after.
#                The PR is left for a human to merge.
#
# Which files are managed, and how, is declared in kit-files.tsv — NOT in this
# script. bin/kit.mjs reads the same file to check a repo, so the installer and
# the checker cannot disagree about what the kit owns.
#
# Behavior per file (kit-files.tsv column 1):
#   overwrite        canonical tool files (.claude/commands, sync-labels.sh, .markdownlint.jsonc)
#   seed             copied only when absent; source is the same path in the kit
#   create-if-absent copied only when absent; source is templates/<template>
#   managed-block    AGENTS.md boilerplate between <!-- KIT:START/END --> markers
#
# Behaviors that are not per-file lists, and so live in this script:
#   merge            .gitignore — append missing lines only
#   unignore         .gitignore — narrow a blanket `.claude/` ignore (keeps settings.local.json ignored)
#   migrate          docs/project_log.md → private/project_log.md (once)
#   supersede        remove .markdownlint.json in favor of .markdownlint.jsonc
#   retire           delete commands the kit no longer ships
#
# Requires: bash, git, awk. (Run utility/sync-labels.sh separately for GitHub labels.)
#           --pr additionally requires the `gh` CLI, authenticated.
#
# Note: macOS ships bash 3.2 — keep this script free of arrays, `mapfile`, and `${var,,}`.

set -euo pipefail

DRY=0
PR=0
TARGET=""
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --pr)      PR=1 ;;
    -*) echo "unknown flag: $a" >&2; exit 2 ;;
    *) TARGET="$a" ;;
  esac
done

TAB="$(printf '\t')"

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$(cd "${TARGET:-$PWD}" && pwd)"

KIT_VERSION="$(git -C "$SRC" describe --tags --long 2>/dev/null || git -C "$SRC" rev-parse --short HEAD)"
START="<!-- KIT:START $KIT_VERSION — managed by mjs-project-template; edit below the KIT:END marker -->"
START_PREFIX='<!-- KIT:START'
END='<!-- KIT:END -->'

act() { if [ "$DRY" -eq 1 ]; then printf '  [dry-run] %s\n' "$*"; else printf '  %s\n'  "$*"; fi; }

# --- PR mode ----------------------------------------------------------------

PR_BASE=""
PR_BRANCH=""
PR_ORIG_BRANCH=""

pr_preflight() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "--pr requires the gh CLI, which is not on PATH." >&2
    echo "  (repos synced over SSH without gh must be synced without --pr)" >&2
    exit 2
  fi
  if ! gh auth status >/dev/null 2>&1; then
    echo "--pr requires gh to be authenticated — run: gh auth login" >&2
    exit 2
  fi
  if ! git -C "$TARGET" rev-parse --git-dir >/dev/null 2>&1; then
    echo "--pr requires the target to be a git repo: $TARGET" >&2
    exit 2
  fi
  if ! git -C "$TARGET" remote get-url origin >/dev/null 2>&1; then
    echo "--pr requires an 'origin' remote in: $TARGET" >&2
    exit 2
  fi
  if [ "$SRC" = "$TARGET" ]; then
    echo "--pr refuses to run against the kit source repo itself: $SRC" >&2
    exit 2
  fi
  # A dirty tree would sweep unrelated work into the sync commit.
  if [ -n "$(git -C "$TARGET" status --porcelain)" ]; then
    echo "--pr requires a clean working tree in: $TARGET" >&2
    echo "  commit or stash first — the kit sync must be the only change in the PR" >&2
    exit 2
  fi
}

detect_default_branch() {  # master vs main, without assuming either
  local b=""
  b="$(cd "$TARGET" && gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || true)"
  if [ -z "$b" ]; then
    b="$(git -C "$TARGET" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
    b="${b#origin/}"
  fi
  [ -n "$b" ] || b="master"
  printf '%s' "$b"
}

pr_restore() {             # always leave the target on the branch we found it on
  if [ "$PR" -eq 0 ] || [ "$DRY" -eq 1 ] || [ -z "$PR_ORIG_BRANCH" ]; then return 0; fi
  local cur=""
  cur="$(git -C "$TARGET" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [ "$cur" != "$PR_ORIG_BRANCH" ]; then
    git -C "$TARGET" checkout --quiet "$PR_ORIG_BRANCH" 2>/dev/null || true
  fi
}

pr_begin() {
  PR_BASE="$(detect_default_branch)"
  PR_BRANCH="chore/kit-sync-$KIT_VERSION"
  echo "PR mode:"
  echo "  base branch : $PR_BASE"
  echo "  sync branch : $PR_BRANCH"
  if [ "$DRY" -eq 1 ]; then
    echo "  [dry-run] would fetch origin, branch from origin/$PR_BASE, commit, push, and open a PR"
    echo
    return 0
  fi
  PR_ORIG_BRANCH="$(git -C "$TARGET" rev-parse --abbrev-ref HEAD)"
  trap pr_restore EXIT
  git -C "$TARGET" fetch --quiet origin "$PR_BASE"
  if git -C "$TARGET" show-ref --verify --quiet "refs/heads/$PR_BRANCH"; then
    git -C "$TARGET" checkout --quiet "$PR_BRANCH"
    echo "  reusing existing sync branch"
  else
    git -C "$TARGET" checkout --quiet -b "$PR_BRANCH" "origin/$PR_BASE"
  fi
  echo
}

pr_finish() {
  echo "PR mode — publishing:"
  if [ "$DRY" -eq 1 ]; then
    echo "  [dry-run] would commit the changes above, push $PR_BRANCH, and open a PR"
    return 0
  fi
  if [ -z "$(git -C "$TARGET" status --porcelain)" ]; then
    echo "  no changes — already at kit $KIT_VERSION"
    git -C "$TARGET" checkout --quiet "$PR_ORIG_BRANCH"
    git -C "$TARGET" branch -D "$PR_BRANCH" >/dev/null 2>&1 || true
    return 0
  fi

  git -C "$TARGET" add -A
  local files
  files="$(git -C "$TARGET" diff --cached --name-status | sed 's/^/  /')"

  git -C "$TARGET" commit --quiet -F - <<EOF
chore(kit): sync to $KIT_VERSION

Applied by install-kit.sh from mjs-project-template.

Files changed:
$files
EOF

  git -C "$TARGET" push --quiet -u origin "$PR_BRANCH"
  echo "  pushed $PR_BRANCH"

  local url=""
  url="$(cd "$TARGET" && gh pr create \
    --base "$PR_BASE" --head "$PR_BRANCH" \
    --title "chore(kit): sync to $KIT_VERSION" \
    --body "Automated kit sync from [mjs-project-template](https://github.com/jwilleke/mjs-project-template), applied by \`install-kit.sh\`.

Kit version: \`$KIT_VERSION\`

## Files changed

\`\`\`text
$files
\`\`\`

Canonical kit files are overwritten wholesale; your own content is untouched. \`AGENTS.md\` changes
are confined to the managed block between the \`KIT:START\` / \`KIT:END\` markers.

Merging when CI is green is the expected path. If a change here is wrong, fix it upstream in the
template rather than in this repo — the next sync would overwrite a local fix." 2>/dev/null || true)"

  if [ -z "$url" ]; then
    # A PR for this branch may already be open from an earlier run.
    url="$(cd "$TARGET" && gh pr view "$PR_BRANCH" --json url -q .url 2>/dev/null || true)"
  fi
  if [ -n "$url" ]; then
    echo "  PR: $url"
  else
    echo "  warning: branch pushed but no PR URL resolved — open one manually" >&2
  fi

  git -C "$TARGET" checkout --quiet "$PR_ORIG_BRANCH"
  echo "  restored branch: $PR_ORIG_BRANCH"
}

# --- behaviors --------------------------------------------------------------

overwrite() {              # overwrite REL from kit (canonical tool file)
  local rel="$1" s="$SRC/$1" d="$TARGET/$1"
  [ -f "$s" ] || { act "skip (missing in kit): $rel"; return; }
  if [ -f "$d" ] && cmp -s "$s" "$d"; then act "unchanged: $rel"; return; fi
  warn_local_file_edits "$rel"
  act "overwrite: $rel"
  if [ "$DRY" -eq 0 ]; then
    mkdir -p "$(dirname "$d")"; cp "$s" "$d"
    case "$rel" in *.sh) chmod +x "$d" ;; esac
  fi
}

create_if_absent() {       # create REL from templates/TMPL only if absent
  local rel="$1" s="$SRC/templates/$2" d="$TARGET/$1"
  if [ -e "$d" ]; then act "keep existing: $rel"; return; fi
  act "create: $rel"
  if [ "$DRY" -eq 0 ]; then mkdir -p "$(dirname "$d")"; cp "$s" "$d"; fi
}

create_if_absent_stamped() { # like create_if_absent but substitutes YYYY-MM-DD and KIT-VERSION
  local rel="$1" s="$SRC/templates/$2" d="$TARGET/$1"
  if [ -e "$d" ]; then act "keep existing: $rel"; return; fi
  act "create: $rel"
  if [ "$DRY" -eq 0 ]; then
    mkdir -p "$(dirname "$d")"
    sed -e "s/YYYY-MM-DD/$(date +%Y-%m-%d)/" -e "s/KIT-VERSION/$KIT_VERSION/" "$s" >"$d"
  fi
}

seed() {                   # copy REL from kit only if absent (source at the same path)
  local rel="$1" s="$SRC/$1" d="$TARGET/$1"
  [ -f "$s" ] || { act "skip (missing in kit): $rel"; return; }
  if [ -e "$d" ]; then act "keep existing: $rel"; return; fi
  act "create: $rel"
  if [ "$DRY" -eq 0 ]; then mkdir -p "$(dirname "$d")"; cp "$s" "$d"; fi
}

ensure_gitignore() {       # append missing lines, never remove
  local gi="$TARGET/.gitignore" line
  for line in "private/" ".claude/settings.local.json" ".claude/worktrees/"; do
    if [ -f "$gi" ] && grep -qxF -- "$line" "$gi"; then act "gitignore ok: $line"; continue; fi
    act "gitignore += $line"
    if [ "$DRY" -eq 0 ]; then printf '%s\n' "$line" >>"$gi"; fi
  done
}

unignore_claude() {        # un-ignore shared kit files (commands, CLAUDE.md) so they get tracked
  local gi="$TARGET/.gitignore"
  [ -f "$gi" ] || return 0
  if grep -qxE '\.claude/?' "$gi"; then
    act "gitignore -= .claude/ (blanket ignore removed; .claude/settings.local.json stays ignored)"
    if [ "$DRY" -eq 0 ]; then
      grep -vxE '\.claude/?' "$gi" >"$gi.kit.tmp" && mv "$gi.kit.tmp" "$gi"
    fi
  fi
  if grep -qxE '/?CLAUDE\.md' "$gi"; then
    act "gitignore -= CLAUDE.md (the thin pointer should be tracked, not local-only)"
    if [ "$DRY" -eq 0 ]; then
      grep -vxE '/?CLAUDE\.md' "$gi" >"$gi.kit.tmp" && mv "$gi.kit.tmp" "$gi"
    fi
  fi
}

migrate_log() {            # docs/project_log.md → private/project_log.md (once)
  local old="$TARGET/docs/project_log.md" new="$TARGET/private/project_log.md"
  [ -f "$old" ] || return 0
  if [ -f "$new" ]; then act "log: private/project_log.md already exists (leaving docs/ copy alone)"; return; fi
  act "migrate: docs/project_log.md → private/project_log.md (git mv + rm --cached)"
  if [ "$DRY" -eq 0 ]; then
    mkdir -p "$TARGET/private"
    if git -C "$TARGET" ls-files --error-unmatch docs/project_log.md >/dev/null 2>&1; then
      git -C "$TARGET" mv docs/project_log.md private/project_log.md
      git -C "$TARGET" rm --cached private/project_log.md >/dev/null
    else
      mv "$old" "$new"
    fi
  fi
}

supersede_markdownlint() { # .markdownlint.json → .markdownlint.jsonc
  local old="$TARGET/.markdownlint.json"
  [ -f "$old" ] || return 0
  act "remove superseded: .markdownlint.json (replaced by .markdownlint.jsonc)"
  if [ "$DRY" -eq 0 ]; then
    if git -C "$TARGET" ls-files --error-unmatch .markdownlint.json >/dev/null 2>&1; then
      git -C "$TARGET" rm -q .markdownlint.json
    else
      rm -f "$old"
    fi
  fi
}

retire_deprecated() {      # remove retired command files from downstream repos
  local rel old
  for rel in ".claude/commands/check-todos.md" ".claude/commands/status.md"; do
    old="$TARGET/$rel"
    [ -f "$old" ] || continue
    act "remove retired: $rel (use /pstatus instead)"
    if [ "$DRY" -eq 0 ]; then
      if git -C "$TARGET" ls-files --error-unmatch "$rel" >/dev/null 2>&1; then
        git -C "$TARGET" rm -q "$rel"
      else
        rm -f "$old"
      fi
    fi
  done
}

warn_duplicate_headings() { # a heading in the managed block repeated below KIT:END fails MD024
  local d="$TARGET/AGENTS.md" b="$SRC/templates/agents-boilerplate.md"
  [ -f "$d" ] || return 0
  [ -f "$b" ] || return 0
  grep -qF "$END" "$d" || return 0

  # Headings come from the INCOMING boilerplate, not from the block on disk.
  # Reading the target's own block would compare the outgoing headings in
  # --dry-run (where nothing has been spliced yet) and so miss exactly the
  # collision a heading rename introduces — which is the case this exists for.
  local dupes
  dupes="$(awk -v bf="$b" '
    BEGIN { while ((getline l < bf) > 0) if (l ~ /^#+[ \t]/) incoming[l] = 1 }
    /<!-- KIT:END/ { below = 1; next }
    below && /^#+[ \t]/ && ($0 in incoming) { printf "             line %d: %s\n", NR, $0 }
  ' "$d")"
  [ -n "$dupes" ] || return 0

  echo "  WARNING: AGENTS.md has headings that appear BOTH in the kit-managed block and in your" >&2
  echo "           own content below KIT:END. markdownlint MD024 fails on this:" >&2
  printf '%s\n' "$dupes" >&2
  echo "           Rename YOUR heading — the managed block is rewritten on every sync, so a" >&2
  echo "           rename there does not survive." >&2
}

stamp_kit_version() {      # write/update kit_version in AGENTS.md frontmatter
  local d="$TARGET/AGENTS.md"
  [ -f "$d" ] || return 0
  head -1 "$d" | grep -qx -- '---' || return 0   # no frontmatter — skip
  if grep -q '^kit_version:' "$d"; then
    act "frontmatter: kit_version = $KIT_VERSION (update)"
    if [ "$DRY" -eq 0 ]; then
      awk -v v="$KIT_VERSION" '/^kit_version:/{print "kit_version: \"" v "\""} !/^kit_version:/{print}' "$d" >"$d.kit.tmp" && mv "$d.kit.tmp" "$d"
    fi
  else
    act "frontmatter: kit_version = $KIT_VERSION (insert)"
    if [ "$DRY" -eq 0 ]; then
      awk -v v="$KIT_VERSION" 'BEGIN{c=0} /^---$/{c++; if(c==2){print "kit_version: \"" v "\""}} {print}' "$d" >"$d.kit.tmp" && mv "$d.kit.tmp" "$d"
    fi
  fi
}

apply_group() {            # apply every kit-files.tsv row in group $1, in file order
  local want="$1" manifest="$SRC/kit-files.tsv" beh path tmpl group
  if [ ! -f "$manifest" ]; then
    echo "kit-files.tsv missing from the kit: $manifest" >&2
    exit 2
  fi
  # Tab is IFS whitespace, so consecutive tabs would collapse — every row carries
  # all four columns, with `-` standing in for an absent template.
  while IFS="$TAB" read -r beh path tmpl group; do
    case "$beh" in ''|'#'*) continue ;; esac
    [ "$group" = "$want" ] || continue
    case "$beh" in
      overwrite)                overwrite "$path" ;;
      seed)                     seed "$path" ;;
      create-if-absent)         create_if_absent "$path" "$tmpl" ;;
      create-if-absent-stamped) create_if_absent_stamped "$path" "$tmpl" ;;
      managed-block)            : ;;   # ensure_agents_block handles this one
      *) echo "unknown behavior in kit-files.tsv: $beh ($path)" >&2; exit 2 ;;
    esac
  done <"$manifest"
}

stamped_kit_version() {    # the kit version recorded in the target's AGENTS.md marker
  local d="$TARGET/AGENTS.md"
  [ -f "$d" ] || return 0
  sed -n "s/.*$START_PREFIX \([^ ]*\).*/\1/p" "$d" | head -1
}

kit_ref_of() {             # a git ref for a stamped version: v1.0.0-57-gc4b69c8 or a bare sha
  case "$1" in
    *-g*) printf '%s' "${1##*-g}" ;;
    *)    printf '%s' "$1" ;;
  esac
}

warn_local_file_edits() {  # say what overwriting an `overwrite` file is about to destroy
  local rel="$1" s="$SRC/$1" d="$TARGET/$1"
  local stamped ref prev lost
  [ -f "$d" ] || return 0

  stamped="$(stamped_kit_version)"
  [ -n "$stamped" ] || return 0
  ref="$(kit_ref_of "$stamped")"

  prev="$(mktemp "${TMPDIR:-/tmp}/kitfile.XXXXXX")"
  lost="$(mktemp "${TMPDIR:-/tmp}/kitlost.XXXXXX")"

  # Same test as the managed block: differing from the version this repo was
  # synced at is a local edit; differing from the incoming file is an upgrade.
  if git -C "$SRC" show "$ref:$rel" >"$prev" 2>/dev/null; then
    if cmp -s "$d" "$prev"; then rm -f "$prev" "$lost"; return 0; fi
  else
    rm -f "$prev" "$lost"; return 0      # cannot tell an edit from an upgrade — stay quiet
  fi

  grep -Fxv -f "$s" "$d" | grep -v '^[[:space:]]*$' >"$lost" || true
  if [ -s "$lost" ]; then
    echo "  WARNING: $rel was edited locally since kit $stamped, and is overwritten wholesale." >&2
    echo "           These lines are NOT in the incoming version and will be lost:" >&2
    sed 's/^/             /' "$lost" >&2
    echo "           Generic rules belong upstream in the kit. Repo-specific notes belong in" >&2
    echo "           ${rel%.md}.local.md, which the kit never touches." >&2
  fi

  rm -f "$prev" "$lost"
}

managed_block_of() {       # print the KIT-managed block of $1, markers excluded
  awk '/<!-- KIT:START/{f=1;next} /<!-- KIT:END/{f=0} f' "$1"
}

warn_local_block_edits() { # say what a managed-block rewrite is about to destroy
  local d="$TARGET/AGENTS.md" b="$SRC/templates/agents-boilerplate.md"
  local stamped sha cur prev lost status
  [ -f "$d" ] || return 0
  grep -qF "$START_PREFIX" "$d" || return 0

  cur="$(mktemp "${TMPDIR:-/tmp}/kitblock.XXXXXX")"
  prev="$(mktemp "${TMPDIR:-/tmp}/kitprev.XXXXXX")"
  lost="$(mktemp "${TMPDIR:-/tmp}/kitlost.XXXXXX")"
  managed_block_of "$d" >"$cur"

  # Identical to what is about to be written: nothing can be lost.
  if cmp -s "$cur" "$b"; then rm -f "$cur" "$prev" "$lost"; return 0; fi

  # Compare against the boilerplate of the kit version this repo was stamped
  # with. Differing from THAT is a local edit; differing from the incoming
  # boilerplate is just an upgrade.
  stamped="$(stamped_kit_version)"
  sha="$(kit_ref_of "$stamped")"
  status="unknown"
  if [ -n "$sha" ] &&
     git -C "$SRC" show "$sha:templates/agents-boilerplate.md" >"$prev" 2>/dev/null; then
    if cmp -s "$cur" "$prev"; then status="clean"; else status="edited"; fi
  fi

  case "$status" in
    clean) rm -f "$cur" "$prev" "$lost"; return 0 ;;
    edited)
      echo "  WARNING: AGENTS.md managed block was edited locally since kit $stamped." >&2 ;;
    unknown)
      echo "  WARNING: AGENTS.md managed block differs from the incoming boilerplate," >&2
      echo "           and kit $stamped could not be resolved to compare against." >&2 ;;
  esac

  # Lines present locally but absent from the incoming boilerplate are exactly
  # what the rewrite drops.
  grep -Fxv -f "$b" "$cur" | grep -v '^[[:space:]]*$' >"$lost" || true
  if [ -s "$lost" ]; then
    echo "           These lines are NOT in the new boilerplate and will be lost:" >&2
    sed 's/^/             /' "$lost" >&2
  else
    echo "           No lines are lost — the local copy only reorders or trims." >&2
  fi
  echo "           Re-add anything you need BELOW the KIT:END marker, or raise it upstream." >&2

  rm -f "$cur" "$prev" "$lost"
}

ensure_agents_block() {    # managed boilerplate block in AGENTS.md
  local d="$TARGET/AGENTS.md" b="$SRC/templates/agents-boilerplate.md"
  if [ ! -f "$d" ]; then
    act "create: AGENTS.md (frontmatter + managed block + repo stub)"
    if [ "$DRY" -eq 0 ]; then
      local fm="$SRC/templates/agents-frontmatter.md.tmpl"
      { sed -e "s/YYYY-MM-DD/$(date +%Y-%m-%d)/" -e "s/KIT-VERSION/$KIT_VERSION/" "$fm"; printf '\n%s\n' "$START"; cat "$b"; printf '%s\n\n' "$END"; cat "$SRC/templates/agents-stub.md"; } >"$d"
    fi
    return
  fi
  if grep -qF "$START_PREFIX" "$d"; then
    # Warn BEFORE the rewrite, and in dry-run too — the point is to see it coming.
    warn_local_block_edits
    act "update AGENTS.md managed block (your content below KIT:END preserved)"
    if [ "$DRY" -eq 0 ]; then
      awk -v prefix="$START_PREFIX" -v start="$START" -v end="$END" -v bf="$b" '
        BEGIN { while ((getline l < bf) > 0) blk = blk l "\n" }
        substr($0, 1, length(prefix)) == prefix { print start; printf "%s", blk; skip = 1; next }
        $0 == end   { print; skip = 0; next }
        !skip       { print }
      ' "$d" >"$d.kit.tmp" && mv "$d.kit.tmp" "$d"
    fi
    return
  fi
  # no markers yet — insert the block, AFTER YAML frontmatter if the file has one
  if head -1 "$d" | grep -qx -- '---'; then
    act "insert AGENTS.md managed block (after frontmatter; existing content preserved)"
    if [ "$DRY" -eq 0 ]; then
      { printf '%s\n' "$START"; cat "$b"; printf '%s\n' "$END"; } >"$d.block.tmp"
      awk -v bf="$d.block.tmp" '
        BEGIN { while ((getline l < bf) > 0) blk = blk l "\n" }
        { print }
        /^---$/ { c++; if (c == 2 && !done) { printf "\n%s", blk; done = 1 } }
      ' "$d" >"$d.kit.tmp" && mv "$d.kit.tmp" "$d"
      rm -f "$d.block.tmp"
    fi
  else
    act "prepend AGENTS.md managed block (existing content preserved below)"
    if [ "$DRY" -eq 0 ]; then
      { printf '%s\n' "$START"; cat "$b"; printf '%s\n\n' "$END"; cat "$d"; } >"$d.kit.tmp" && mv "$d.kit.tmp" "$d"
    fi
  fi
}

# --- run --------------------------------------------------------------------

warn_target_behind_remote() {  # never assume the target checkout is current
  # --pr branches from origin/<default> and is unaffected. Plain mode writes
  # into whatever is on disk, so a stale clone gets a sync applied on top of an
  # old tree and committed as though it were current. A local mjs-ha 122 commits
  # behind origin is what prompted this.
  [ "$PR" -eq 1 ] && return 0
  git -C "$TARGET" rev-parse --git-dir >/dev/null 2>&1 || return 0

  local upstream behind
  upstream="$(git -C "$TARGET" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
  [ -n "$upstream" ] || return 0
  behind="$(git -C "$TARGET" rev-list --count "HEAD..$upstream" 2>/dev/null || echo 0)"
  [ "$behind" -gt 0 ] 2>/dev/null || return 0

  echo "  WARNING: this checkout is $behind commit(s) behind $upstream." >&2
  echo "           The kit would be applied on top of a stale tree and committed as if current." >&2
  echo "           Pull first, or use --pr, which branches from the remote instead." >&2
  echo >&2
}

echo "Installing agent kit"
echo "  from: $SRC"
echo "  into: $TARGET"
[ "$DRY" -eq 1 ] && echo "  MODE: dry-run — no changes will be written"
echo

warn_target_behind_remote

if [ "$PR" -eq 1 ]; then
  pr_preflight
  pr_begin
fi

echo "Canonical tool files (overwrite):"
apply_group canonical
echo

echo "Merges & migrations (run before create-if-absent so existing logs migrate):"
ensure_gitignore
unignore_claude
migrate_log
supersede_markdownlint
retire_deprecated
echo

echo "Project docs (create-if-absent / managed):"
ensure_agents_block
stamp_kit_version
warn_duplicate_headings
apply_group docs
echo

echo "VS Code (create-if-absent — keeps your customizations):"
apply_group vscode
echo

echo "GitHub workflows (create-if-absent — keeps your customizations):"
apply_group workflows
echo

echo "GitHub templates (create-if-absent — keeps your customizations):"
apply_group templates
echo

if [ "$PR" -eq 1 ]; then
  pr_finish
  echo
fi

echo "Done."
echo "Next:"
echo "  - utility/sync-labels.sh            # apply the standard GitHub labels to this repo"
echo "  - /pstatus                          # rank work + regenerate TODO.md"
if [ "$PR" -eq 0 ]; then
  echo "  - review the changes above, then commit them on a feature branch"
  echo "    (or re-run with --pr to branch, push, and open the PR for you)"
fi
if [ "$DRY" -eq 1 ]; then echo "  (re-run without --dry-run to apply the changes above)"; fi
exit 0
