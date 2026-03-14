# Monorepo Workflows

## Overview

A monorepo contains multiple projects, packages, or services in a single repository. Monorepos simplify dependency management and cross-project changes but require specialized tooling for CI, versioning, and change detection to remain workable at scale.

## When to Use a Monorepo

### Good fit

- Shared libraries used by multiple applications (e.g., design system, API client, utilities).
- Tightly coupled services that change together frequently.
- Teams that make cross-cutting changes spanning multiple packages.
- Organizations that want atomic commits across dependent packages.

### Poor fit

- Completely independent projects with different teams and release cycles.
- Very large codebases (100K+ files) without investment in custom tooling.
- Teams without CI infrastructure capable of selective builds.

## Directory Structure

### Standard layout

```
monorepo/
├── apps/
│   ├── web/           # Next.js frontend
│   ├── api/           # Express API
│   └── mobile/        # React Native app
├── packages/
│   ├── ui/            # Shared component library
│   ├── utils/         # Shared utilities
│   └── config/        # Shared configuration (ESLint, TypeScript)
├── tools/
│   └── scripts/       # Build and deployment scripts
├── package.json       # Root workspace config
├── turbo.json         # Turborepo pipeline config
└── nx.json            # Or Nx workspace config
```

### Package naming convention

Use a consistent org scope for all packages:

```
@myorg/web
@myorg/api
@myorg/ui
@myorg/utils
@myorg/config-eslint
@myorg/config-typescript
```

## Change Detection

### Why it matters

Running all CI jobs on every commit makes monorepos unusable at scale. A change to `packages/ui` should not trigger the API test suite. Change detection ensures only affected packages are built and tested.

### Turborepo

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

Turborepo uses content hashing to determine which packages changed. It caches build outputs and skips unchanged packages automatically.

```bash
# Run tests only for changed packages
turbo run test --filter=...[HEAD~1]

# Run build for a specific package and its dependencies
turbo run build --filter=@myorg/web...
```

### Nx

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
```

```bash
# Run tests only for affected packages
nx affected --target=test --base=main

# Visualize dependency graph
nx graph
```

### GitHub Actions with path filters

```yaml
on:
  pull_request:
    paths:
      - 'apps/web/**'
      - 'packages/ui/**'
      - 'packages/utils/**'

jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: turbo run test --filter=@myorg/web...
```

## Branching in Monorepos

### Scope commits to packages

Use conventional commit scopes matching package names:

```
feat(web): add dark mode toggle
fix(api): handle null user in auth middleware
refactor(ui): extract button variants to separate file
build(utils): upgrade lodash to v4.18
```

This enables:
- Per-package changelogs: `git log --oneline --grep="(web)"`
- Filtered CI: trigger jobs based on commit scope.
- Targeted code review: CODEOWNERS by path.

### CODEOWNERS

```
# .github/CODEOWNERS
apps/web/           @frontend-team
apps/api/           @backend-team
packages/ui/        @design-system-team
packages/utils/     @platform-team
```

CODEOWNERS ensures the right team reviews changes to their packages. Combined with required reviews, this prevents cross-team changes from merging without domain expert approval.

## Versioning Strategies

### Independent versioning

Each package has its own version. A change to `packages/ui` bumps only the `ui` version.

**Tools**: `changesets`, `lerna --independent`

**When to use**: Packages are consumed independently (e.g., published to npm separately).

### Fixed versioning

All packages share the same version. Any change bumps the shared version.

**Tools**: `lerna --fixed`

**When to use**: Packages are always deployed together (e.g., a monolithic app split into packages for organization).

### Changesets workflow

```bash
# After making changes, create a changeset
npx changeset

# During release, apply version bumps and generate changelogs
npx changeset version

# Publish to npm
npx changeset publish
```

Changesets decouple the "describe the change" step from the "bump the version" step, allowing multiple PRs to contribute to a single release.

## CI/CD Patterns

### Parallel builds with caching

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/cache@v4
        with:
          path: node_modules/.cache/turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('**/turbo.json') }}
      - run: npm ci
      - run: turbo run build test lint --concurrency=4
```

### Selective deployments

Deploy only the apps that changed:

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.changes.outputs.web }}
      api: ${{ steps.changes.outputs.api }}
    steps:
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/ui/**'
              - 'packages/utils/**'
            api:
              - 'apps/api/**'
              - 'packages/utils/**'

  deploy-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying web app"

  deploy-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying API"
```

## Common Pitfalls

1. **Running all tests on every PR** — use change detection to run only affected tests.
2. **Circular dependencies** — use `madge` or Nx's graph to detect and break cycles.
3. **Inconsistent dependency versions** — use workspace constraints or `syncpack` to enforce consistency.
4. **Slow installs** — use `npm workspaces`, `pnpm`, or `yarn` with hoisting to share dependencies.
5. **Missing root-level config** — shared ESLint, TypeScript, and Prettier configs belong in `packages/config-*`.
