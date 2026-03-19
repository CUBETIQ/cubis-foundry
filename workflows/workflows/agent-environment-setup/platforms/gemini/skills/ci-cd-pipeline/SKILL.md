---
name: ci-cd-pipeline
description: "Use when designing, optimizing, or debugging CI/CD pipelines: GitHub Actions workflows, GitLab CI configurations, pipeline caching strategies, matrix builds, deployment gates, artifact management, and release automation."
---
# CI/CD Pipeline

## Purpose

Guide the design and implementation of production-grade CI/CD pipelines that are fast, reliable, and secure. Every instruction prioritizes build reproducibility, minimal pipeline duration, safe deployment progression, and auditability of the entire release path from commit to production.

## When to Use

- Designing a new CI/CD pipeline for a project or migrating from one CI system to another.
- Optimizing slow pipelines with caching, parallelism, or matrix build strategies.
- Configuring deployment gates, approval workflows, and environment promotion rules.
- Setting up artifact management, container image builds, or release tagging.
- Debugging flaky pipelines, intermittent test failures, or caching invalidation issues.
- Reviewing pipeline configurations for security vulnerabilities such as secret leakage or supply chain risks.

## Instructions

1. **Identify the target CI platform and runtime constraints before writing configuration** because GitHub Actions, GitLab CI, CircleCI, and Jenkins each have different YAML schemas, runner models, and caching semantics. Writing platform-agnostic advice produces non-functional configs.

2. **Structure pipelines into discrete stages with explicit dependencies** so that fast-feedback stages (lint, typecheck) run first and expensive stages (integration tests, builds) only execute when preconditions pass, reducing wasted compute time.

3. **Use matrix builds to test across multiple runtime versions and operating systems** because a single-environment pipeline misses version-specific bugs and platform-incompatible code paths that surface only in production.

4. **Implement aggressive dependency caching with content-based keys** so that unchanged dependency trees are restored in seconds rather than re-installed from scratch, which is the single largest speedup for most pipelines.

5. **Pin action versions and container image digests to specific SHAs** because floating tags (e.g., `@v3`, `latest`) can be hijacked in a supply chain attack, and unpinned versions cause non-reproducible builds when upstream updates break compatibility.

6. **Store secrets in the platform's encrypted secret store and inject them as environment variables at runtime** because hardcoded credentials in YAML files are visible in version history and accessible to anyone with repository read access.

7. **Separate build artifacts from deployment steps using artifact upload/download** so that the exact binary that passed tests is the binary that gets deployed, eliminating "works on CI, fails in production" drift caused by rebuilding during deployment.

8. **Configure deployment gates with required approvals for production environments** because automated promotion without human review creates a single-failure path from a merged PR to a customer-facing outage.

9. **Implement progressive deployment strategies (canary, blue-green, rolling)** so that bad releases affect a small percentage of traffic before full rollout, and automated rollback can trigger when health checks degrade.

10. **Add concurrency controls and cancel-in-progress rules for branch pipelines** because parallel runs of the same workflow on the same branch waste resources and can cause race conditions in deployments and stateful operations.

11. **Emit structured pipeline telemetry (duration, stage timing, failure rates) to an observability backend** so that pipeline performance trends are visible, SLOs can be set on build times, and regressions are caught before they become team-wide bottlenecks.

12. **Use reusable workflow templates and composite actions for cross-repository consistency** because duplicating pipeline logic across repositories leads to configuration drift, missed security patches, and inconsistent build behavior.

13. **Configure branch protection rules to enforce status checks before merge** so that the main branch always reflects a green build, and developers cannot bypass quality gates by merging without waiting for pipeline completion.

14. **Implement SBOM generation and container image signing in release pipelines** because software supply chain security requires a verifiable chain of custody from source to deployed artifact, and regulatory frameworks increasingly mandate provenance attestation.

15. **Design idempotent deployment steps that can be safely retried** because transient infrastructure failures (network timeouts, cloud API rate limits) will cause intermittent failures, and non-idempotent deployments risk double-applying database migrations or duplicate resource creation.

16. **Run security scanning (SAST, dependency audit, container scan) as a dedicated pipeline stage** so that vulnerabilities are caught before merge rather than discovered in production, and scan results are attached to the pull request for reviewer visibility.

## Output Format

Provide complete pipeline configuration files with inline comments explaining non-obvious decisions. Include file paths relative to the repository root (e.g., `.github/workflows/ci.yml`). When showing caching strategies, include both the cache key expression and the fallback restore keys. For deployment configurations, always show the environment protection rules alongside the deployment step.

## References

| File                                    | Load when                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `references/github-actions.md`          | Designing or debugging GitHub Actions workflows, composite actions, or reusable workflow templates.    |
| `references/pipeline-patterns.md`       | Structuring multi-stage pipelines, optimizing parallelism, or designing fan-out/fan-in patterns.       |
| `references/caching.md`                 | Implementing dependency caching, build artifact caching, or Docker layer caching strategies.           |
| `references/deployment-strategies.md`   | Configuring canary, blue-green, or rolling deployments with health check gating.                       |
| `references/security.md`               | Hardening pipelines against supply chain attacks, secret management, or compliance scanning.            |

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
