````markdown
---
inclusion: manual
name: vercel-flags
description: "Vercel Feature Flags: SDK integration, platform setup, CLI workflows, dashboard management, explorer UI, and OpenFeature compatibility for safe, targeted rollouts."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, feature flags, flags sdk, flags platform, openfeature, flags dashboard, flags explorer, feature toggle, rollout, a/b test
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nextjs-developer, vercel-deployments, vercel-cli
  consolidates: vercel-flags-platform, vercel-flags-sdk, vercel-flags-cli-workflows, vercel-flags-dashboard, vercel-flags-explorer, vercel-flags-openfeature
---

# Vercel Flags

## Purpose

Implement Vercel Feature Flags end-to-end: platform configuration, SDK integration in application code, CLI management workflows, dashboard visibility, explorer UX for teams, and OpenFeature provider compatibility.

## When To Use

- Setting up feature flags on Vercel platform.
- Integrating `@vercel/flags` SDK into Next.js or other frameworks.
- Managing flags via CLI for automated rollout pipelines.
- Using the Flags Dashboard or Explorer for team visibility.
- Implementing OpenFeature-compatible providers for portability.

## Domain Areas

### Platform Setup

- Configure flag definitions and environments in Vercel dashboard.
- Assign targeting rules, rollout percentages, and user segments.

### SDK Integration

- Install `@vercel/flags` and configure provider.
- Use `unstable_flag`, `flag()`, and edge-compatible evaluation.
- Integrate with Next.js middleware and React Server Components.

### CLI Workflows

- `vercel flags ls`, `vercel flags pull`, `vercel flags push`.
- Automate flag state changes in CI/CD pipelines.

### Dashboard & Explorer

- Monitor flag state, overrides, and exposure metrics.
- Use the Toolbar and Explorer for local override during development.

### OpenFeature Compatibility

- Register Vercel as an OpenFeature provider.
- Maintain provider-agnostic flag evaluation logic.

## Operating Checklist

1. Define flag schema and targeting rules before implementation.
2. Integrate SDK with appropriate edge/server evaluation context.
3. Implement safe defaults for all flags (fail-closed).
4. Validate flag exposure in dashboard before broad rollout.
5. Automate flag lifecycle (create, rollout, cleanup) in CI.

## Output Contract

- Flag schema definitions and targeting rule design
- SDK integration code and Next.js adapter config
- CLI workflow scripts for CI/CD pipelines
- Dashboard monitoring setup and exposure validation
- Residual risks and cleanup checklist
````
