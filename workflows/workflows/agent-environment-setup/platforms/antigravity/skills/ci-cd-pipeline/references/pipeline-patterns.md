# Pipeline Patterns Reference

## Pipeline Architecture Patterns

### Linear Pipeline

The simplest pattern. Each stage runs after the previous one completes. Suitable for small projects with fast builds.

```
install -> lint -> test -> build -> deploy
```

**When to use:** Single-language projects with test suites under 5 minutes.

### Fan-Out / Fan-In

Parallel stages that merge before continuing. Maximizes throughput for independent tasks.

```
              ┌─ lint ──────┐
install ──────├─ typecheck ──├──── test ──── build
              └─ security ──┘
```

**When to use:** Multiple independent quality checks that do not share state.

### Diamond Pipeline

Multiple parallel paths that converge at multiple points. Common in monorepos.

```
              ┌─ lint-api ───── test-api ───┐
install ──────│                              ├── integration-test ── deploy
              └─ lint-web ───── test-web ───┘
```

**When to use:** Monorepos where packages have independent lint and unit test stages but share an integration test.

### Pipeline with Deployment Stages

Progressive promotion through environments with gates between stages.

```
build ── staging (auto) ── canary (1 approval) ── production (2 approvals)
           │                    │                       │
           └─ health check     └─ health check         └─ health check
                                    │
                                    └─ rollback (on failure)
```

**When to use:** Any production deployment that requires validation before full rollout.

## Stage Design Principles

### Fast Feedback First

Order stages by execution speed so developers get the fastest feedback on the most common failures.

| Stage        | Typical Duration | Catches                          |
|-------------|------------------|----------------------------------|
| Lint         | 10-30s           | Style violations, import errors  |
| Typecheck    | 15-60s           | Type errors, interface mismatches|
| Unit tests   | 30s-3m           | Logic bugs, regressions          |
| Build        | 1-5m             | Build configuration errors       |
| Integration  | 3-15m            | Cross-service contract failures  |
| E2E tests    | 5-30m            | User flow regressions            |

### Fail Fast

```yaml
strategy:
  fail-fast: true   # Cancel remaining matrix jobs when one fails
```

For CI (quality feedback), `fail-fast: true` is appropriate. For release testing, `fail-fast: false` gives a complete compatibility picture.

## Monorepo Pipeline Strategies

### Path-Based Triggering

Only run pipeline stages for changed packages.

```yaml
on:
  pull_request:
    paths:
      - 'packages/api/**'
      - 'packages/shared/**'   # Shared code triggers all consumers

jobs:
  detect-changes:
    outputs:
      api: ${{ steps.filter.outputs.api }}
      web: ${{ steps.filter.outputs.web }}
    steps:
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            api:
              - 'packages/api/**'
              - 'packages/shared/**'
            web:
              - 'packages/web/**'
              - 'packages/shared/**'

  test-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
```

### Turborepo / Nx Integration

Use build system cache to skip unchanged packages.

```yaml
- name: Build affected packages only
  run: npx turbo run build test --filter='...[origin/main]'
```

## Pipeline Optimization Techniques

| Technique | Speedup | Trade-off |
|-----------|---------|-----------|
| Dependency caching | 30-70% of install step | Cache invalidation complexity |
| Parallel jobs | Proportional to parallelism | More runner minutes billed |
| Path-based skip | Eliminates unnecessary runs | Incorrect filters miss regressions |
| Build system cache | 50-90% of build step | Cache storage costs |
| Test splitting | Linear with shard count | Flaky test isolation harder |
| Larger runners | 2-4x faster compute | Higher per-minute cost |

## Test Splitting and Sharding

```yaml
test:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - run: |
        npx jest --shard=${{ matrix.shard }}/4
```

For Playwright or Cypress:

```yaml
    - run: |
        npx playwright test --shard=${{ matrix.shard }}/${{ strategy.job-total }}
```

## Status Checks and Branch Protection

Configure branch protection rules to enforce pipeline completion before merge.

| Setting | Recommended Value | Rationale |
|---------|-------------------|-----------|
| Require status checks | lint, typecheck, test | Core quality gates |
| Require branches be up to date | Yes | Prevents merge skew |
| Require linear history | Squash or rebase | Clean git history |
| Require signed commits | Optional | Authorship verification |
| Restrict pushes | Team leads only | Prevent force-push to main |
