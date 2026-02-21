````markdown
---
inclusion: manual
name: vercel-platform
description: "Vercel platform operations: project configuration, RBAC, 2FA/OIDC/SSO, secure compute, REST API, SDK, webhooks, integrations, MCP for agents, image optimization, OG images, cron jobs, monorepos, microfrontends, and multi-tenant architecture."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, project config, rbac, 2fa, oidc, sso, secure compute, rest api, vercel sdk, webhooks, integrations marketplace, mcp for agents, image optimization, og image, cron jobs, monorepo, microfrontends, multi-tenant, automation, audit
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: devops-engineer, secure-code-guardian, monitoring-expert, vercel-deployments, vercel-observability
  consolidates: vercel-automation, vercel-project-configuration, vercel-rbac-access-groups, vercel-2fa-enforcement, vercel-oidc-federation, vercel-secure-compute, vercel-rest-api, vercel-sdk, vercel-webhooks-and-checks, vercel-integrations-native, vercel-marketplace-partner-api, vercel-mcp-for-agents, vercel-agent-workflows, vercel-image-optimization, vercel-og-image-generation, vercel-cron-jobs, vercel-microfrontends, vercel-monorepos, vercel-multi-tenant
---

# Vercel Platform

## Purpose

Administer Vercel at the platform level — project configuration, team access control, identity/SSO, secure networking, REST API automation, webhooks, native integrations, architecture patterns (monorepos, microfrontends, multi-tenant), and platform-level features like image optimization, OG image generation, and cron jobs.

## When To Use

- Configuring project-level settings in `vercel.json`.
- Managing team RBAC roles and access groups.
- Enforcing 2FA or configuring OIDC/SSO federation.
- Using Secure Compute for private networking (VPC-like).
- Automating Vercel operations via REST API or SDK.
- Registering webhooks for deployment events.
- Installing and building native integrations or marketplace partners.
- Configuring Vercel MCP for agent-driven platform automation.
- Optimizing images via `next/image` or Vercel's Image Optimization API.
- Generating Open Graph images with `@vercel/og`.
- Scheduling background jobs with Vercel Cron.
- Structuring monorepo builds and microfrontend app groups.
- Implementing multi-tenant SaaS on Vercel.

## Domain Areas

### Project Configuration

- `vercel.json` schema: functions, headers, redirects, rewrites, regions.
- Framework detection and override settings.

### RBAC & Access Groups

- Assign Owner, Member, Viewer roles per project or team.
- Access groups for project-level permission scoping.

### Identity & Security (2FA / OIDC / Secure Compute)

- Enforce 2FA for all team members.
- Configure OIDC federation for CI/CD token-based auth.
- Use Secure Compute for private egress to internal services.

### REST API & SDK

- Authenticate with `VERCEL_TOKEN`; respect rate limits.
- Use `@vercel/sdk` (TypeScript) for typed API access.
- Common endpoints: deployments, env vars, domains, projects.

### Webhooks & Checks

- Register webhooks for `deployment.created`, `deployment.succeeded`, etc.
- Implement deployment checks (CI gates) via the Checks API.

### Integrations & Marketplace

- Install native integrations (e.g., observability, storage).
- Build marketplace partner integrations with OAuth and webhooks.

### MCP for Agents

- Run Vercel MCP server locally or in CI for agent workflows.
- Use for automated deployment queries, log retrieval, and config changes.

### Image Optimization & OG Images

- Use `next/image` for automatic format conversion and resizing.
- Generate OG images on the fly with `@vercel/og` (ImageResponse).
- Cache OG images appropriately.

### Cron Jobs

- Define cron schedules in `vercel.json` under `crons`.
- Secure cron handler endpoints with `CRON_SECRET`.
- Monitor cron execution logs in Vercel dashboard.

### Monorepos

- Configure `rootDirectory` per project for monorepo packages.
- Use Turborepo + Vercel Remote Cache for fast incremental builds.

### Microfrontends

- Define app groups and routing in Vercel Microfrontends config.
- Route per-path segments to independent Next.js apps.

### Multi-Tenant Architecture

- Use hostname-based routing in middleware for tenant resolution.
- Scope environment variables and storage per tenant.
- Combine with Edge Config for real-time tenant config.

## Operating Checklist

1. Audit and lock project configuration in `vercel.json`.
2. Review and tighten RBAC roles; remove over-privileged members.
3. Enforce 2FA for all team members; configure OIDC for CI.
4. Validate REST API token scopes; rotate stale tokens.
5. Test webhook delivery with replay; implement idempotent handlers.
6. Verify cron endpoint security with `CRON_SECRET` validation.
7. Validate monorepo build filtering and Turborepo cache hit rates.

## Output Contract

- `vercel.json` configuration with annotated sections
- RBAC role matrix and access group definitions
- Identity/SSO configuration steps and validation evidence
- REST API and SDK integration patterns
- Webhook handler implementation with idempotency
- Architecture diagram for monorepo/microfrontend/multi-tenant setup
- Residual risks and follow-up actions
````
