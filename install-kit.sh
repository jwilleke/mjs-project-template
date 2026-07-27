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
# Behavior per file:
#   overwrite        canonical tool files (.claude/commands, sync-labels.sh, .markdownlint.jsonc)
#   merge            .gitignore — append missing lines only
#   unignore         .gitignore — narrow a blanket `.claude/` ignore (keeps settings.local.json ignored)
#   create-if-absent TODO.md, CLAUDE.md, private/project_log.md
#   managed-block    AGENTS.md boilerplate between <!-- KIT:START/END --> markers
#   migrate          docs/project_log.md → private/project_log.md (once)
#   supersede        remove .markdownlint.json in favor of .markdownlint.jsonc
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

echo "Installing agent kit"
echo "  from: $SRC"
echo "  into: $TARGET"
[ "$DRY" -eq 1 ] && echo "  MODE: dry-run — no changes will be written"
echo

if [ "$PR" -eq 1 ]; then
  pr_preflight
  pr_begin
fi

echo "Canonical tool files (overwrite):"
overwrite ".claude/commands/pstatus.md"
overwrite ".claude/commands/session-commit.md"
overwrite ".claude/commands/context.md"
overwrite ".claude/commands/wrap.md"
overwrite "utility/sync-labels.sh"
overwrite ".markdownlint.jsonc"
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
create_if_absent_stamped "TODO.md" "TODO.md.tmpl"
create_if_absent_stamped "CLAUDE.md" "CLAUDE.md.tmpl"
create_if_absent_stamped "private/project_log.md" "project_log.md.tmpl"
echo

echo "VS Code (create-if-absent — keeps your customizations):"
seed ".vscode/extensions.json"
echo

echo "GitHub workflows (create-if-absent — keeps your customizations):"
seed ".github/workflows/markdown-lint.yml"
echo

echo "GitHub templates (create-if-absent — keeps your customizations):"
seed ".github/ISSUE_TEMPLATE/bug_report.md"
seed ".github/ISSUE_TEMPLATE/feature_request.md"
seed ".github/ISSUE_TEMPLATE/security.md"
seed ".github/ISSUE_TEMPLATE/epic.md"
seed ".github/ISSUE_TEMPLATE/config.yml"
seed ".github/PULL_REQUEST_TEMPLATE.md"
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
