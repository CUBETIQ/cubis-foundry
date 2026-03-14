````markdown
---
inclusion: manual
name: git-workflow
description: "Use when establishing or reviewing git branching strategies, PR conventions, commit hygiene, merge policies, monorepo workflows, and release tagging. Covers trunk-based development, GitFlow alternatives, conventional commits, and code review standards."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Git Workflow

## Purpose

Use when establishing or reviewing git branching strategies, PR conventions, commit hygiene, merge policies, monorepo workflows, and release tagging. Covers trunk-based development, GitFlow alternatives, conventional commits, and code review standards.

## When to Use

- Working on git workflow related tasks

## Instructions

1. **Choose a branching model** — trunk-based for high-velocity teams, short-lived feature branches for teams needing review gates.
2. **Keep branches short-lived** — merge within 1-2 days. Long-lived branches create merge pain and integration risk.
3. **Write meaningful commits** — each commit should be a logical, reviewable unit. Squash fixup commits before merge.
4. **Review before merge** — every change to protected branches goes through PR review. No direct pushes.
5. **Automate what you can** — branch protection, CI gating, auto-merge on approval, changelog generation.

### Branching strategies

### Trunk-based development (recommended)

- All developers commit to `main` (directly or via short-lived branches).
- Feature branches live for hours to 1-2 days, never weeks.
- Use feature flags for incomplete work that must be merged.
- Release from `main` via tags or release branches cut at the moment of release.
- Best for: teams with strong CI, continuous deployment capability.

### GitHub Flow

- `main` is always deployable.
- Create feature branches from `main`, open PR, review, merge back.
- Deploy from `main` after merge.
- Simpler than GitFlow. No develop branch, no release branches unless needed.
- Best for: SaaS products with single production environment.

### Release branches (when needed)

- Cut `release/X.Y` from `main` when preparing a release.
- Cherry-pick critical fixes to release branch. Never merge `main` into release.
- Tag releases from the release branch.
- Delete release branch after final patch version.

### Commit conventions

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

- `feat`: new feature visible to users → triggers minor version bump.
- `fix`: bug fix → triggers patch version bump.
- `feat!` or `BREAKING CHANGE:` footer → triggers major version bump.

### Commit message rules

- Subject line: imperative mood, under 72 characters, no period.
- Body: explain WHY, not WHAT (the diff shows what changed).
- One logical change per commit. Do not mix refactoring with behavior changes.

### Pull request standards

- Title follows conventional commit format.
- Description includes: what changed, why it changed, how to test.
- Link related issues with `Closes #123` or `Fixes #456`.
- Keep PRs under 400 lines of meaningful change. Split larger work into stacked PRs.
- Request review from domain owners, not random team members.

### Merge strategy

| Strategy     | When to use                                                         |
| ------------ | ------------------------------------------------------------------- |
| Squash merge | Default for feature PRs — clean single-commit history on main.      |
| Merge commit | When preserving individual commits matters (multi-author, long PR). |
| Rebase merge | When linear history is required and branch is small/clean.          |

- Configure repository default in GitHub settings.
- Delete branches after merge — do not accumulate stale branches.

### Protected branch rules

- [ ] Require PR reviews (minimum 1 reviewer)
- [ ] Require status checks to pass (CI, lint, test)
- [ ] Require branches to be up to date before merge
- [ ] Disable force push to `main` and release branches
- [ ] Require signed commits (optional but recommended for regulated environments)
- [ ] Enable merge queue for high-traffic repositories

### Constraints

- Avoid long-lived feature branches (>3 days) — merge pain grows exponentially.
- Avoid merge commits from `main` into feature branches — rebase instead.
- Avoid commit messages like "fix", "wip", "stuff" — they provide no value in history.
- Avoid bypassing CI checks with `--no-verify` — fix the issue instead.
- Avoid cherry-picking without tracking — document which commits were cherry-picked and why.
- Avoid force-pushing to shared branches — coordinate with collaborators first.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

| File                                | Purpose                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `references/pr-review-checklist.md` | Code review process, reviewer responsibilities, approval criteria, and common review anti-patterns. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with git workflow best practices in this project"
- "Review my git workflow implementation for issues"
````
