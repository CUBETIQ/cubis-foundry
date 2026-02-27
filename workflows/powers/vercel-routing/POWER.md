````markdown
---
inclusion: manual
name: vercel-routing
description: "Vercel edge routing: middleware patterns, redirects/rewrites, Edge Config for real-time config without redeploys, Edge Config integrations, and Node.js migration paths."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, routing, middleware, redirects, rewrites, edge config, edge config integrations, edge to node, a/b routing, geo routing, edge middleware
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nextjs-developer, vercel-functions, vercel-caching, vercel-flags
  consolidates: vercel-routing-middleware, vercel-redirects-rewrites, vercel-edge-config, vercel-edge-config-integrations, vercel-edge-to-node-migration
---

# Vercel Routing

## Purpose

Configure Vercel's edge routing layer with middleware patterns, redirect/rewrite rules, real-time Edge Config for runtime configuration, and migration paths away from the edge runtime.

## When To Use

- Writing Vercel Middleware for auth, geo-routing, A/B testing, or bot checks.
- Configuring redirects and rewrites in `vercel.json` or Next.js config.
- Using Edge Config for real-time feature toggling or config without redeploys.
- Integrating Edge Config with third-party providers (LaunchDarkly, etc.).
- Migrating edge-incompatible middleware to Node.js functions.

## Domain Areas

### Middleware

- Author `middleware.ts` with `NextRequest`/`NextResponse` or Web APIs.
- Apply auth checks, geo-redirects, A/B bucket assignment.
- Use `matcher` config to scope execution precisely.
- Mind cold start and bundle size constraints (1MB limit).

### Redirects & Rewrites

- Configure in `vercel.json` under `redirects` / `rewrites`.
- Permanent (308) vs temporary (307) redirects.
- Capture groups and dynamic path rewriting.
- Header-based and query-based conditional rewrites.

### Edge Config

- Create and populate Edge Config stores via dashboard or CLI.
- Read in middleware with `@vercel/edge-config` SDK.
- Zero-redeploy config changes for feature flags and kill switches.

### Edge Config Integrations

- Connect Edge Config to third-party providers.
- Sync external flag state into Edge Config automatically.

### Edge-to-Node Migration

- Identify middleware using Node.js-incompatible APIs.
- Refactor to Node.js serverless functions or API routes.
- Use `runtime: 'nodejs'` config override.

## Operating Checklist

1. Audit middleware bundle size and strip unnecessary dependencies.
2. Validate matcher patterns cover only intended routes.
3. Test redirect rules for cyclic redirect risk.
4. Populate Edge Config with safe defaults before enabling reads.
5. Document Edge Config keys and owners; restrict write access.
6. Plan edge-to-node migration with regression test coverage.

## Output Contract

- Middleware implementation with matcher config
- Redirect/rewrite rule set with conflict analysis
- Edge Config schema, population scripts, and read integration
- Edge-to-node migration plan with test strategy
- Performance impact assessment (middleware execution time)
````
