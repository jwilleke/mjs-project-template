# /wrap — close the session safely

End-of-session ritual. Run it **last**, before shutting down VS Code. It makes sure every change is
committed, refreshes the "Resume here" pointer at the top of the log, and reports whether it is safe
to close.

## Steps

### Step 1: Survey everything outstanding

- `git status -sb` — uncommitted changes, untracked files, branch + ahead/behind
- `git stash list` — forgotten stashes
- `git log --oneline @{u}..HEAD` — unpushed commits

### Step 2: Commit outstanding work

- If the working tree has changes other than intentionally-local files
  (`.claude/settings.local.json`, anything under `private/`), run the `/session-commit` flow to
  commit them (code + `TODO.md` + a journal entry). Otherwise note "nothing to commit".

### Step 3: Refresh the "Resume here" pointer

Overwrite the marker-delimited block at the **top** of `private/project_log.md` (above the dated
entries) so the next session knows exactly where to pick up:

```text
<!-- RESUME:START -->
## ▶ Resume here — yyyy-MM-dd

- Last worked on: one-line summary
- Branch / state: <branch>, clean | N unpushed
- In flight / parked: half-done work, or "none"
- Next steps:
  - the next concrete action
- Blockers: or "none"
<!-- RESUME:END -->
```

If the markers are present, replace the content between them; if absent, insert the block right
after the log's title. This block is always overwritten — it reflects only the latest handoff.

### Step 4: Push (ask)

- If there are unpushed commits, ask the operator whether to push before shutdown.

### Step 5: Shutdown-readiness verdict

Report one clear verdict:

- ✅ **Safe to close** — working tree clean (or only intentional local files), commits pushed
  (or explicitly held), resume pointer written.
- ⚠️ **Attention** — list anything that would be lost or forgotten on shutdown: untracked files
  not committed, stashes, unpushed commits held locally by choice.

## Notes

- `/wrap` is the close bookend to `/context` (open) and complements `/session-commit` (per-chunk).
- `/context` and `/status` read the "Resume here" block first to restore continuity.
