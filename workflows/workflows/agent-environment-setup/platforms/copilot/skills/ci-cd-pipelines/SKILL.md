---
name: ci-cd-pipelines
description: "Use when designing, reviewing, or debugging CI/CD pipelines across GitHub Actions, GitLab CI, and similar platforms. Covers pipeline architecture, job sequencing, caching, artifact management, environment promotion, security hardening, and flaky-pipeline triage."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# CI/CD Pipelines

## Purpose

Use when designing, reviewing, or debugging CI/CD pipelines across GitHub Actions, GitLab CI, and similar platforms. Covers pipeline architecture, job sequencing, caching, artifact management, environment promotion, security hardening, and flaky-pipeline triage.

## When to Use

- Working on ci cd pipelines related tasks

## Instructions

1. **Understand the deployment target** — cloud, container, serverless, or bare-metal. Pipeline shape follows deployment topology.
2. **Map the job graph** — identify which steps are independent (parallelizable) and which have hard ordering dependencies. Minimize serial chains.
3. **Isolate build from test from deploy** — each stage must be independently retriable without re-running earlier stages.
4. **Cache aggressively but invalidate correctly** — hash lockfiles for dependency caches, hash source for build caches. Never cache test state.
5. **Gate deployments** — staging must pass before production. Use environment protection rules, required reviewers, or manual approvals for high-risk targets.

### Pipeline architecture

### Job graph design

- Prefer fan-out/fan-in: lint + typecheck + unit tests run in parallel, integration tests depend on all three.
- Keep each job under 10 minutes. Split large test suites across matrix jobs.
- Use `needs` / `dependencies` to declare explicit ordering — avoid relying on implicit stage ordering.

### Caching strategy

- **Dependency cache**: key on lockfile hash (`package-lock.json`, `yarn.lock`, `Gemfile.lock`, `go.sum`). Restore with fallback keys.
- **Build cache**: key on source hash or commit SHA. Use for compiled outputs, Docker layer cache, and generated code.
- **Never cache**: test databases, integration state, secrets, or environment-specific config.

### Artifact management

- Upload build artifacts between jobs — do not rebuild in deploy jobs.
- Set retention periods appropriate to the artifact type (7 days for PR artifacts, 90 days for release artifacts).
- Sign release artifacts when publishing to registries.

### Matrix builds

- Use matrix strategy for cross-platform or cross-version testing.
- Pin exact versions in matrix — do not use `latest` or floating tags.
- Use `fail-fast: false` for comprehensive test matrices, `fail-fast: true` for blocking checks.

### GitHub Actions specifics

### Workflow structure

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".node-version"
          cache: "npm"
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".node-version"
          cache: "npm"
      - run: npm ci
      - run: npm test
```

### Security hardening

- Always set top-level `permissions` to minimum required. Never use `permissions: write-all`.
- Pin actions to full SHA, not tags: `uses: actions/checkout@<sha>`.
- Use `concurrency` groups to cancel redundant runs.
- Never echo secrets. Use `GITHUB_TOKEN` scoping per job.
- Audit third-party actions — prefer official `actions/` namespace or verified publishers.

### Reusable workflows

- Extract shared logic into reusable workflows (`workflow_call` trigger).
- Pass inputs and secrets explicitly — do not inherit.
- Version reusable workflows with tags or SHA references.

### Environment promotion

- **PR** → lint + test + preview deploy (auto)
- **main** → staging deploy (auto) → smoke tests (auto)
- **Release tag** → production deploy (gated) → canary → full rollout
- Never deploy directly to production from a PR merge without a staging gate.

### Flaky pipeline triage

1. Identify flaky jobs by checking re-run success rate.
2. Common causes: timing-dependent tests, shared mutable state, network calls to external services, race conditions in parallel jobs.
3. Fix flakiness at the source — do not add retries as a permanent fix.
4. Quarantine persistently flaky tests into a separate non-blocking job.

### Constraints

- Avoid monolithic pipeline files over 300 lines — split into reusable workflows and composite actions.
- Avoid running full E2E suites on every PR — reserve for merge queue or staging.
- Avoid storing secrets in workflow files — use repository or organization secrets.
- Avoid `continue-on-error: true` on critical checks — failures must block.
- Avoid manual version bumps in CI — use semantic-release or similar automation.
- Avoid running CI steps as root when not required.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

| File                                        | Purpose                                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `references/github-actions-patterns.md`     | Reusable workflow patterns, composite actions, matrix strategies, and environment protection rules. |
| `references/pipeline-security-checklist.md` | Supply chain hardening, SLSA compliance, secret rotation, and audit trail requirements.             |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with ci cd pipelines best practices in this project"
- "Review my ci cd pipelines implementation for issues"
