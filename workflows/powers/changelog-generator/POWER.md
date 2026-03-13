````markdown
---
inclusion: manual
name: changelog-generator
description: Generate changelogs from conventional commits, semantic versioning, release notes, and automated version management workflows.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Changelog Generator

## Purpose

Guide changelog generation, release notes writing, and version management using conventional commits and semantic versioning.

## When to Use

- Generating a CHANGELOG.md from commit history
- Writing release notes for a new version
- Setting up automated versioning workflows
- Reviewing commit message format and conventions
- Planning a release with breaking changes

## Instructions

### Step 1 — Follow Conventional Commits

**Format**: `<type>(<scope>): <description>`

| Type       | SemVer Bump | When                                   |
| ---------- | ----------- | -------------------------------------- |
| `feat`     | Minor       | New feature for users                  |
| `fix`      | Patch       | Bug fix for users                      |
| `docs`     | None        | Documentation only                     |
| `style`    | None        | Formatting, no logic change            |
| `refactor` | None        | Code restructuring, no behavior change |
| `perf`     | Patch       | Performance improvement                |
| `test`     | None        | Adding or fixing tests                 |
| `build`    | None        | Build system or dependencies           |
| `ci`       | None        | CI/CD configuration                    |
| `chore`    | None        | Maintenance tasks                      |

**Breaking changes**: Add `!` after type or `BREAKING CHANGE:` in footer:

```
feat!: remove deprecated API endpoints

BREAKING CHANGE: /v1/users endpoint has been removed. Use /v2/users instead.
```

### Step 2 — Generate Changelog

**Changelog format** (Keep a Changelog style):

```markdown
# Changelog

## [2.1.0] - 2025-01-15

### Added

- User profile image upload (#234)
- Dark mode support for dashboard (#256)

### Fixed

- Login timeout on slow connections (#245)
- Currency formatting for Japanese Yen (#249)

### Changed

- Increased password minimum length to 12 characters (#251)

## [2.0.0] - 2024-12-01

### Breaking Changes

- Removed deprecated /v1/users endpoint — use /v2/users (#230)

### Added

- New user roles system with RBAC (#220)
```

**Mapping rules**:

- `feat` → **Added**
- `fix` → **Fixed**
- `feat!` / `BREAKING CHANGE` → **Breaking Changes**
- `perf` → **Performance**
- `refactor` with user-visible changes → **Changed**
- `deprecate` → **Deprecated**
- `remove` → **Removed**

### Step 3 — Semantic Versioning

**MAJOR.MINOR.PATCH** (e.g., 2.1.3):

- **MAJOR**: Breaking changes (API removal, incompatible changes)
- **MINOR**: New features (backward-compatible additions)
- **PATCH**: Bug fixes (backward-compatible fixes)

**Pre-release versions**: `2.1.0-beta.1`, `2.1.0-rc.1`

**Rules**:

- Version 0.x.y is for initial development (anything may change)
- First stable release is 1.0.0
- Never change a released version — create a new one

### Step 4 — Write Release Notes

**Release notes structure**:

1. **Headline** — one sentence summarizing the release theme
2. **Highlights** — 2-3 most important changes with context
3. **Full changelog** — categorized list of all changes
4. **Migration guide** — for breaking changes, step-by-step upgrade instructions
5. **Contributors** — acknowledge contributors

**Good highlights**:

```markdown
### Highlights

**Dark Mode** — The dashboard now supports dark mode, automatically
matching your system preference. Toggle manually in Settings → Appearance.

**Faster Search** — Search results now load 3x faster thanks to a new
indexing strategy. No changes needed on your end.
```

### Step 5 — Automate the Workflow

**CI pipeline**:

1. Lint commit messages on PR (reject non-conventional)
2. On merge to main: determine version bump from commits
3. Generate changelog entry
4. Bump version in package.json / pyproject.toml
5. Create git tag
6. Create GitHub Release with release notes
7. Publish to package registry

## Output Format

```
## Version
[version number and bump reasoning]

## Changelog Entry
[formatted changelog in Keep a Changelog style]

## Release Notes
[user-facing summary with highlights and migration guide]
```

## Examples

**User**: "Generate a changelog for our latest release"

**Response approach**: Scan commits since last tag. Categorize by type. Generate changelog in Keep a Changelog format. Determine version bump (major/minor/patch). Write release highlights.

**User**: "We have breaking API changes — how do we release this?"

**Response approach**: Bump major version. Write migration guide with before/after examples. Add deprecation notices in the previous minor release if possible. Generate changelog with Breaking Changes section first.
````
