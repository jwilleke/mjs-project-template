#!/usr/bin/env bash
# install-kit.sh — idempotent installer for the mjs agent kit.
#
#   New repo : run in a fresh/empty repo  → drops the kit + seeds starter docs.
#   Upgrade  : run in an existing repo    → updates canonical files, never clobbers your content.
#   Re-run   : safe anytime to pick up a newer kit version.
#
# Usage:
#   install-kit.sh [--dry-run] [target-dir]      # target-dir defaults to the current directory
#
# Behavior per file:
#   overwrite        canonical tool files (.claude/commands, sync-labels.sh, .markdownlint.jsonc)
#   merge            .gitignore — append missing lines only
#   create-if-absent TODO.md, CLAUDE.md, private/project_log.md
#   managed-block    AGENTS.md boilerplate between <!-- KIT:START/END --> markers
#   migrate          docs/project_log.md → private/project_log.md (once)
#   supersede        remove .markdownlint.json in favor of .markdownlint.jsonc
#
# Requires: bash, git, awk. (Run utility/sync-labels.sh separately for GitHub labels.)

set -euo pipefail

DRY=0
TARGET=""
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    -*) echo "unknown flag: $a" >&2; exit 2 ;;
    *) TARGET="$a" ;;
  esac
done

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$(cd "${TARGET:-$PWD}" && pwd)"

START='<!-- KIT:START — managed by mjs-project-template; edit below the KIT:END marker -->'
END='<!-- KIT:END -->'

act() { if [ "$DRY" -eq 1 ]; then printf '  [dry-run] %s\n' "$*"; else printf '  %s\n'  "$*"; fi; }

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

seed() {                   # copy REL from kit only if absent (source at the same path)
  local rel="$1" s="$SRC/$1" d="$TARGET/$1"
  [ -f "$s" ] || { act "skip (missing in kit): $rel"; return; }
  if [ -e "$d" ]; then act "keep existing: $rel"; return; fi
  act "create: $rel"
  if [ "$DRY" -eq 0 ]; then mkdir -p "$(dirname "$d")"; cp "$s" "$d"; fi
}

ensure_gitignore() {       # append missing lines, never remove
  local gi="$TARGET/.gitignore" line
  for line in "private/" ".claude/settings.local.json"; do
    if [ -f "$gi" ] && grep -qxF -- "$line" "$gi"; then act "gitignore ok: $line"; continue; fi
    act "gitignore += $line"
    if [ "$DRY" -eq 0 ]; then printf '%s\n' "$line" >>"$gi"; fi
  done
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

ensure_agents_block() {    # managed boilerplate block in AGENTS.md
  local d="$TARGET/AGENTS.md" b="$SRC/templates/agents-boilerplate.md"
  if [ ! -f "$d" ]; then
    act "create: AGENTS.md (managed block + repo stub)"
    if [ "$DRY" -eq 0 ]; then
      { printf '%s\n' "$START"; cat "$b"; printf '%s\n\n' "$END"; cat "$SRC/templates/agents-stub.md"; } >"$d"
    fi
    return
  fi
  if grep -qF "$START" "$d"; then
    act "update AGENTS.md managed block (your content below KIT:END preserved)"
    if [ "$DRY" -eq 0 ]; then
      awk -v start="$START" -v end="$END" -v bf="$b" '
        BEGIN { while ((getline l < bf) > 0) blk = blk l "\n" }
        $0 == start { print; printf "%s", blk; skip = 1; next }
        $0 == end   { print; skip = 0; next }
        !skip       { print }
      ' "$d" >"$d.kit.tmp" && mv "$d.kit.tmp" "$d"
    fi
  else
    act "prepend AGENTS.md managed block (existing AGENTS.md content preserved below)"
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

echo "Canonical tool files (overwrite):"
overwrite ".claude/commands/status.md"
overwrite ".claude/commands/session-commit.md"
overwrite ".claude/commands/context.md"
overwrite ".claude/commands/check-todos.md"
overwrite ".claude/commands/wrap.md"
overwrite "utility/sync-labels.sh"
overwrite ".markdownlint.jsonc"
echo

echo "Merges & migrations (run before create-if-absent so existing logs migrate):"
ensure_gitignore
migrate_log
supersede_markdownlint
echo

echo "Project docs (create-if-absent / managed):"
ensure_agents_block
create_if_absent "TODO.md" "TODO.md.tmpl"
create_if_absent "CLAUDE.md" "CLAUDE.md.tmpl"
create_if_absent "private/project_log.md" "project_log.md.tmpl"
echo

echo "GitHub templates (create-if-absent — keeps your customizations):"
seed ".github/ISSUE_TEMPLATE/bug_report.md"
seed ".github/ISSUE_TEMPLATE/feature_request.md"
seed ".github/ISSUE_TEMPLATE/security.md"
seed ".github/ISSUE_TEMPLATE/epic.md"
seed ".github/ISSUE_TEMPLATE/config.yml"
seed ".github/PULL_REQUEST_TEMPLATE.md"
echo

echo "Done."
echo "Next:"
echo "  - utility/sync-labels.sh            # apply the standard GitHub labels to this repo"
echo "  - /status                           # rank work + regenerate TODO.md"
if [ "$DRY" -eq 1 ]; then echo "  (re-run without --dry-run to apply the changes above)"; fi
exit 0
