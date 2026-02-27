````markdown
---
inclusion: manual
name: "git-commit"
displayName: "Git Commit"
description: "Create conventional commits with intelligent staging and message generation"
keywords: ["git", "commit", "conventional", "stage", "push", "version control"]
---

# Git Commit

## Conventional Commit Format

```
<type>[scope]: <description>
```

## Types

| Type       | Purpose                        |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting (no logic change)   |
| `refactor` | Code refactor                  |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `chore`    | Maintenance                    |

## Workflow

1. Check status: `git status --porcelain`
2. View diff: `git diff --staged` or `git diff`
3. Stage files: `git add <files>`
4. Commit: `git commit -m "<type>[scope]: <description>"`

## Rules

- One logical change per commit
- Present tense, imperative mood
- Description under 72 characters
- Reference issues: `Closes #123`

## Safety

- NEVER force push to main/master
- NEVER skip hooks without explicit request
- NEVER commit secrets
````
