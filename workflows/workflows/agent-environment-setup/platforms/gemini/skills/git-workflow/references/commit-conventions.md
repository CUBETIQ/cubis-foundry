# Commit Conventions

## Overview

Commit conventions standardize how developers communicate changes through git history. Structured commits enable automated tooling (changelogs, version bumps, release notes) and make history searchable and meaningful.

## Conventional Commits Specification

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Rules

1. **Type is required** — one of the defined types below.
2. **Scope is optional** — a noun describing the section of the codebase (e.g., `api`, `auth`, `ui`).
3. **Description is required** — imperative mood, lowercase, no period, under 72 characters.
4. **Body is optional** — explains WHY the change was made, wrapped at 100 characters.
5. **Footer is optional** — `BREAKING CHANGE:` or issue references (`Closes #123`).

### Types

| Type       | Semantic Version | Description                                  | Examples                                      |
|------------|------------------|----------------------------------------------|-----------------------------------------------|
| `feat`     | MINOR            | New feature visible to users                 | New endpoint, new UI component, new CLI flag  |
| `fix`      | PATCH            | Bug fix                                      | Null pointer fix, incorrect calculation       |
| `docs`     | —                | Documentation only changes                   | README update, JSDoc additions                |
| `style`    | —                | Formatting, whitespace, semicolons           | Prettier run, ESLint autofix                  |
| `refactor` | —                | Code change with no behavior change          | Extract function, rename variable             |
| `perf`     | PATCH            | Performance improvement                      | Query optimization, caching                   |
| `test`     | —                | Adding or correcting tests                   | New unit test, fix flaky test                 |
| `build`    | —                | Build system or external dependency changes  | Webpack config, package.json update           |
| `ci`       | —                | CI configuration changes                     | GitHub Actions workflow, Docker build          |
| `chore`    | —                | Maintenance with no production code change   | .gitignore update, dependency bump            |

### Breaking Changes

Breaking changes can be indicated in two ways:

1. **Footer**: Add `BREAKING CHANGE: <description>` to the commit footer.
2. **Type suffix**: Append `!` after the type/scope (e.g., `feat!:` or `feat(api)!:`).

Both trigger a MAJOR version bump in semantic versioning.

## Imperative Mood

The subject line must use imperative mood — as if giving a command.

| Correct (imperative)          | Incorrect (other moods)         |
|-------------------------------|---------------------------------|
| add user authentication       | added user authentication       |
| fix null pointer in checkout  | fixes null pointer in checkout  |
| remove deprecated API         | removing deprecated API         |
| update dependency to v5       | updated dependency to v5        |

**Mental model**: "If applied, this commit will __{subject}__."

- "If applied, this commit will **add user authentication**." (correct)
- "If applied, this commit will **added user authentication**." (incorrect)

## Commit Body Best Practices

The body explains WHY, not WHAT. The diff already shows what changed.

### Good body example

```
fix(auth): handle expired refresh tokens gracefully

The refresh token endpoint returned a 500 when the token was expired
because the JWT library threw an unhandled exception. Users experienced
this as a forced logout with no explanation.

Now we catch TokenExpiredError specifically and return a 401 with a
clear error code that the frontend uses to redirect to the login page.

Closes #1847
```

### Bad body example

```
fix(auth): handle expired refresh tokens

Changed the catch block in refreshToken function to catch
TokenExpiredError and return 401 instead of 500.
```

The bad example restates the diff. The good example explains the user impact and the reasoning.

## Scope Conventions

### Single-package repository

Use functional areas as scopes:

```
feat(auth): add OAuth2 PKCE flow
fix(api): validate request body before database query
refactor(ui): extract form validation hook
```

### Monorepo

Use package names as scopes:

```
feat(web): add dark mode toggle
fix(api): handle null user in auth middleware
refactor(shared): extract validation utilities
build(deps): upgrade typescript to 5.4
```

### No scope

Omit scope for cross-cutting changes:

```
ci: add parallel test execution
docs: update contribution guidelines
chore: update .gitignore for IDE files
```

## Automation Integration

### Semantic versioning

Conventional commits map directly to semantic version bumps:

- `feat` commits trigger a **minor** version bump (1.0.0 -> 1.1.0).
- `fix` and `perf` commits trigger a **patch** version bump (1.0.0 -> 1.0.1).
- `BREAKING CHANGE` triggers a **major** version bump (1.0.0 -> 2.0.0).
- All other types trigger no version bump.

### Changelog generation

Tools like `standard-version`, `semantic-release`, and `changesets` read conventional commits to generate changelogs automatically. Only `feat`, `fix`, and `perf` appear in the changelog by default. Other types are hidden unless configured otherwise.

### Commit linting

Use `commitlint` with the `@commitlint/config-conventional` preset to enforce the format. Configure as a git hook (husky, lefthook) and in CI to catch violations before merge.

## Common Mistakes

1. **Using `chore` for everything** — `chore` is for maintenance tasks with no production impact. A bug fix is `fix`, not `chore: fix bug`.
2. **Missing scope consistency** — pick a scope convention and stick to it. Mixed scopes make filtering useless.
3. **Past tense subjects** — "added feature" should be "add feature".
4. **Subjects over 72 characters** — long subjects get truncated in `git log --oneline` and GitHub.
5. **Mixing concerns in one commit** — a commit that refactors AND adds a feature should be two commits.
6. **Empty bodies for complex changes** — if the diff is not self-explanatory, the body should explain the reasoning.
