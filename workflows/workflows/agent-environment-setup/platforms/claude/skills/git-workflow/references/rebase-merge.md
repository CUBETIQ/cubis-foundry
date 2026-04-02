# Rebase vs Merge

## Overview

The choice between rebase and merge determines how branch history appears and how conflicts are resolved. Neither is universally better — the right choice depends on the context of the specific branch and team workflow.

## Strategies Compared

### Merge Commit

```
git checkout main
git merge feature/auth
```

Creates a merge commit that preserves both branch histories. The feature branch commits appear in chronological order alongside main branch commits.

**Produces**:
```
*   abc1234 Merge branch 'feature/auth' into main
|\
| * def5678 add auth middleware
| * ghi9012 add login endpoint
|/
* jkl3456 previous main commit
```

**When to use**:
- Multi-author branches where individual attribution matters.
- Long-running branches where the commit sequence tells a story.
- When preserving the exact development timeline is required (e.g., audit trails).

**When to avoid**:
- Feature branches with messy history (fixup commits, WIP saves).
- When a clean, linear main history is preferred.

### Squash Merge

```
git checkout main
git merge --squash feature/auth
git commit -m "feat(auth): add authentication system"
```

Combines all feature branch commits into a single commit on main. The individual commits are lost from main's history (but preserved in the PR).

**Produces**:
```
* abc1234 feat(auth): add authentication system
* jkl3456 previous main commit
```

**When to use**:
- Default strategy for feature PRs in most teams.
- Branches with messy intermediate commits (WIP, fixup, revert-then-redo).
- When each PR should appear as a single logical change on main.

**When to avoid**:
- Branches where individual commits carry meaningful distinctions (e.g., separate migration + code change).
- When commit-level `git bisect` is needed for debugging.

### Rebase Merge

```
git checkout feature/auth
git rebase main
git checkout main
git merge --ff-only feature/auth
```

Replays the feature branch commits on top of main, creating a linear history without merge commits. Each original commit is preserved but gets a new SHA.

**Produces**:
```
* def5678' add auth middleware
* ghi9012' add login endpoint
* jkl3456 previous main commit
```

**When to use**:
- Small, clean branches with meaningful individual commits.
- Teams that require a strictly linear main history.
- Before merge, to resolve conflicts in the feature branch context.

**When to avoid**:
- Shared branches (rebase rewrites SHAs, breaking collaborators).
- Branches with many commits (interactive rebase of 30+ commits is error-prone).

## Rebase Workflow

### Keeping a feature branch up to date

Instead of merging main into the feature branch (which creates noisy merge commits), rebase the feature branch onto main:

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/main
```

If conflicts occur:
1. Resolve the conflict in the affected file.
2. `git add <resolved-file>`
3. `git rebase --continue`
4. Repeat for each conflicting commit.

To abort a rebase gone wrong:
```bash
git rebase --abort
```

### Interactive rebase for cleanup

Before opening a PR, clean up the branch history:

```bash
git rebase -i origin/main
```

In the editor:
- `pick` — keep the commit as-is.
- `squash` (or `s`) — merge into the previous commit, combine messages.
- `fixup` (or `f`) — merge into the previous commit, discard this message.
- `reword` (or `r`) — keep the commit but edit the message.
- `drop` (or `d`) — remove the commit entirely.

### Common cleanup patterns

**Squash fixup commits**:
```
pick abc1234 feat(auth): add login endpoint
fixup def5678 fix typo
fixup ghi9012 fix lint error
pick jkl3456 feat(auth): add logout endpoint
```

**Reorder commits for logical grouping**:
```
pick abc1234 refactor(db): extract connection pool
pick jkl3456 feat(auth): add login endpoint
pick mno7890 test(auth): add login tests
```

## Conflict Resolution Strategies

### Prevention

1. **Rebase daily** — the longer you wait, the more conflicts accumulate.
2. **Keep branches small** — fewer changed files means fewer potential conflicts.
3. **Communicate** — if two developers are changing the same file, coordinate.
4. **Use CODEOWNERS** — ownership prevents two people from unknowingly modifying the same area.

### Resolution

1. **Understand both sides** — do not blindly accept "ours" or "theirs". Read both changes.
2. **Resolve in feature branch** — always resolve conflicts in the feature branch, never in main.
3. **Test after resolution** — run the full test suite after resolving conflicts. Conflicts often create subtle bugs.
4. **Use git rerere** — enable `git config --global rerere.enabled true` to remember conflict resolutions. Git will automatically apply the same resolution if the same conflict appears again.

### When conflicts are too complex

If a rebase produces too many conflicts:
1. Abort the rebase: `git rebase --abort`.
2. Consider merging main into the feature branch as a one-time exception.
3. Or: split the PR into smaller pieces that conflict with different parts of main.
4. Or: coordinate with the team to merge one PR first, then rebase the other.

## Repository Configuration

### GitHub merge strategy settings

Configure the default merge strategy in repository settings:

| Setting                    | Recommended for                                |
|----------------------------|------------------------------------------------|
| Allow merge commits        | Enable — needed for release merges             |
| Allow squash merging       | Enable — default for feature PRs               |
| Allow rebase merging       | Enable — for clean, small PRs                  |
| Default merge strategy     | Squash merge — cleanest main history           |
| Delete branches on merge   | Enable — prevents stale branch accumulation    |
| Require linear history     | Optional — enforces rebase or squash only      |

### Git rerere

Enable globally to remember conflict resolutions:

```bash
git config --global rerere.enabled true
```

This is especially valuable for long-running branches that must be rebased repeatedly during review.
