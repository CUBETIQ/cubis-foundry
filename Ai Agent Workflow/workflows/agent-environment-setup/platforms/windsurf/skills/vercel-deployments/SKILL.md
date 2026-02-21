---
name: vercel-deployments
description: "Vercel deployment lifecycle: git-triggered deployments, build pipeline, build output API, deployment promotion, environment management, preview/production protection, and generated URL patterns."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, deployment, git deploy, build pipeline, build output api, deployment promotion, environments, preview, production, protection, generated urls, build image
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: devops-engineer, vercel-cli, vercel-caching, vercel-domains
  consolidates: vercel-git-deployments, vercel-deployment-promotion, vercel-deployment-protection, vercel-protection-bypass-automation, vercel-environments, vercel-build-pipeline, vercel-build-output-api, vercel-build-image-upgrades, vercel-generated-urls
---

# Vercel Deployments

## Purpose
Manage the full Vercel deployment lifecycle from git-triggered builds to production promotion, including environment management, deployment protection, build pipeline customization, and URL strategies.

## When To Use
- Setting up git-based automatic deployments (push-to-deploy).
- Configuring build pipeline steps and custom build commands.
- Using Build Output API for framework-agnostic output generation.
- Promoting preview deployments to production.
- Configuring deployment protection (password, SSO, Vercel Auth).
- Automating protection bypass for CI/CD testing.
- Managing multiple environments (production, preview, development).
- Understanding and controlling generated deployment URL patterns.
- Upgrading build image versions.

## Domain Areas

### Git Deployments
- Branch → environment mapping (main → production, etc.).
- Ignored build step configuration.
- Monorepo detection and build filtering.

### Build Pipeline
- Custom `buildCommand`, `outputDirectory`, `installCommand`.
- Build caching and artifact reuse.
- Build environment variable injection.

### Build Output API
- Framework-agnostic output format: static files, functions, middleware.
- `config.json`, `routes`, and prerender configs.

### Build Image Upgrades
- Choose and lock Node.js / system dependency versions.
- Upgrade strategy and regression testing plan.

### Deployment Promotion
- Promote preview to production via CLI or dashboard.
- Instant rollback to previous production deployment.

### Deployment Protection
- Configure Vercel Authentication, password protection, or IP allowlists for previews.
- Set per-environment protection levels.

### Protection Bypass Automation
- Use `VERCEL_AUTOMATION_BYPASS_SECRET` for CI access to protected deployments.
- Rotate secrets and audit bypass usage.

### Environments
- Manage production, preview, and development environment variables.
- Scope secrets per target environment.
- Use environment variable groups for shared config.

### Generated URLs
- Understand deployment URL anatomy (`project-hash-team.vercel.app`).
- Configure custom domains alongside generated URLs.
- Use deployment URLs in CI testing pipelines.

## Operating Checklist
1. Validate git branch → environment mapping before first deploy.
2. Test build pipeline locally with `vercel build` before pushing.
3. Set deployment protection for preview environments.
4. Configure protection bypass secret for CI/CD pipelines.
5. Stage → promote workflow: test on preview, promote to production.
6. Verify instant rollback readiness before any risky deploy.

## Output Contract
- Build pipeline configuration (`vercel.json` / framework config)
- Environment variable structure per environment tier
- Deployment protection settings and bypass secret rotation plan
- Promotion runbook with rollback steps
- Residual risks and follow-up actions
