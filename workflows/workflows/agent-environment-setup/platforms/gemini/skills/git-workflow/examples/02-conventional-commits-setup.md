# Example: Set Up Conventional Commits with Automated Enforcement

## Scenario

A TypeScript monorepo with 3 packages. The team has no commit conventions. Git history is full of messages like "fix stuff", "wip", and "update". The team wants to adopt conventional commits and generate changelogs automatically.

## User Prompt

> Set up conventional commits in our TypeScript monorepo. We have packages: @app/web, @app/api, and @app/shared. We want automated enforcement and changelog generation.

## Expected Response

### 1. Install Tooling

```bash
# Commit linting
npm install -D @commitlint/cli @commitlint/config-conventional

# Git hooks
npm install -D husky

# Changelog generation
npm install -D standard-version
```

### 2. Configure Commitlint

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'api', 'shared', 'deps', 'ci']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
```

### 3. Set Up Git Hooks

```bash
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### 4. Commit Message Template

```
<type>(<scope>): <description>

[optional body — explain WHY, not WHAT]

[optional footer — BREAKING CHANGE: or Closes #123]
```

**Types by package:**

| Type       | When to use                             | Example                                           |
|------------|-----------------------------------------|---------------------------------------------------|
| `feat`     | New user-visible functionality          | `feat(web): add dark mode toggle`                 |
| `fix`      | Bug fix                                 | `fix(api): handle null user in auth middleware`    |
| `refactor` | Code change with no behavior change     | `refactor(shared): extract validation utilities`   |
| `docs`     | Documentation only                      | `docs(api): add OpenAPI descriptions for /users`  |
| `test`     | Adding or fixing tests                  | `test(web): add snapshot tests for NavBar`        |
| `build`    | Build system or dependency changes      | `build(deps): upgrade typescript to 5.4`          |
| `ci`       | CI/CD pipeline changes                  | `ci: add parallel test execution`                 |
| `perf`     | Performance improvement                 | `perf(api): add database query caching`           |
| `chore`    | Maintenance with no production impact   | `chore: update .gitignore for IDE files`          |

### 5. Changelog Generation

```json
// .versionrc (standard-version config)
{
  "types": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance" },
    { "type": "refactor", "section": "Refactoring", "hidden": true },
    { "type": "docs", "hidden": true },
    { "type": "test", "hidden": true },
    { "type": "ci", "hidden": true },
    { "type": "chore", "hidden": true }
  ]
}
```

### 6. CI Enforcement

```yaml
# .github/workflows/commitlint.yml
name: Commit Lint
on: [pull_request]
jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD
```

### 7. Team Onboarding

Add to CONTRIBUTING.md:

```markdown
## Commit Conventions

This repository uses [Conventional Commits](https://www.conventionalcommits.org/).

- Commits are enforced by commitlint via a pre-commit hook.
- Scopes must be one of: `web`, `api`, `shared`, `deps`, `ci`.
- Subject line: imperative mood, under 72 characters, no period.
- Body: explain WHY, not WHAT. The diff shows what changed.
- Breaking changes: add `BREAKING CHANGE:` footer or `!` after type.
```

## Why This Response Works

- Covers the full pipeline: local enforcement (husky + commitlint), CI enforcement, and changelog output.
- Scopes are tied to the monorepo package names, making commit filtering per-package possible.
- Includes a type reference table the team can use daily.
- CI step validates all commits in a PR, not just the latest, catching squash-and-rewrite issues.
- Onboarding documentation ensures new team members adopt the convention immediately.
