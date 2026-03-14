# CI/CD Pipeline Eval Assertions

## Eval 1: GitHub Actions Workflow Design

This eval tests the core CI/CD skill: designing a GitHub Actions workflow with proper stage structure, matrix builds, caching, and security practices for a Node.js monorepo.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `actions/checkout@` — Pinned action usage       | Every workflow starts with checkout. Pinning to a SHA digest prevents supply chain attacks via tag hijacking. |
| 2 | contains | `matrix` — Matrix build strategy                | Testing across Node 18 and Node 20 catches version-specific bugs before they reach production. A single version gives false confidence. |
| 3 | contains | `cache` — Dependency caching                    | pnpm store caching eliminates redundant package downloads. Without caching, dependency installation dominates pipeline duration. |
| 4 | contains | `needs:` — Job dependency declarations          | Explicit job dependencies enforce stage ordering: install -> lint/typecheck/test -> build. Without `needs`, jobs run in arbitrary order. |
| 5 | contains | `pull_request` — Event trigger configuration    | The workflow must trigger on pull_request events and conditionally gate deploy-preview steps to PRs targeting main. |

### What a passing response looks like

- A `.github/workflows/ci.yml` file with `on: pull_request` and `on: push` triggers.
- A matrix strategy specifying `node-version: [18, 20]` with `pnpm` setup.
- Dependency caching using `actions/cache` or pnpm's built-in store path with a lockfile-based key.
- Parallel lint, typecheck, and test jobs that declare `needs: install`.
- Build and deploy-preview jobs gated with `if: github.event_name == 'pull_request' && github.base_ref == 'main'`.
- All third-party actions pinned to full SHA digests rather than floating version tags.

---

## Eval 2: Deployment Gate Configuration

This eval tests the deployment skill: designing a promotion pipeline with environment protection, approval gates, progressive rollout, and automated rollback.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `environment:` — GitHub environment usage       | GitHub environments provide built-in protection rules, deployment logs, and secret scoping. Ad-hoc conditionals lose these features. |
| 2 | contains | `health` — Health check verification            | Deploying without verifying health creates silent failures. Health checks confirm the new version serves traffic correctly. |
| 3 | contains | `rollback` — Rollback mechanism                 | Automated rollback on canary health failure limits blast radius. Without rollback, a bad canary degrades 10% of traffic indefinitely. |
| 4 | contains | `canary` — Canary deployment stage              | Canary routing sends a small traffic percentage to the new version first. Skipping canary means 100% of users hit a bad deploy simultaneously. |
| 5 | contains | `staging` — Staging environment definition      | Staging as the first promotion step catches integration issues before any production traffic is affected. Auto-deploy on main push provides fast feedback. |

### What a passing response looks like

- Three GitHub environment definitions: `staging`, `production-canary`, `production`.
- Staging job triggered by `push` to `main` with no required reviewers.
- Production-canary job with `environment: production-canary` and one required reviewer.
- Production job with `environment: production` and two required reviewers.
- Health check step after each deployment that polls an endpoint and fails the job on unhealthy response.
- Rollback step in the canary job that triggers when the health check fails, reverting to the previous container image tag.
- Clear separation between container image build (done once) and deployment (done per environment).
