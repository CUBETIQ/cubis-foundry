---
name: "api-patterns"
description: "Use when choosing between REST, GraphQL, and type-safe RPC patterns, or when standardizing response envelopes, versioning, pagination, auth shape, and API protection strategy."
license: MIT
metadata:
  version: "3.0.0"
  domain: "api"
  role: "specialist"
  stack: "api-design"
  category: "core-operating"
  layer: "core-operating"
  canonical: true
  maturity: "stable"
  baseline: "modern HTTP and graph API patterns"
  tags: ["api", "rest", "graphql", "rpc", "pagination", "versioning", "auth"]
---

# API Patterns

## When to use

- Choosing REST vs GraphQL vs type-safe RPC for a new surface.
- Standardizing response envelopes, pagination, filtering, and error format.
- Planning auth, rate limits, and evolution strategy for an API surface.
- Reviewing whether an API design matches client and organizational constraints.

## When not to use

- Pure endpoint implementation after the pattern choice is already fixed.
- Database design with no API-facing consequence.
- Framework-only controller wiring.

## Core workflow

1. Clarify clients, latency needs, ownership model, and compatibility constraints.
2. Choose transport shape based on product and team context, not habit.
3. Standardize response and error patterns before implementation fans out.
4. Define pagination, filtering, and auth strategy explicitly.
5. Make versioning and operational protections part of the design, not an afterthought.

## Baseline standards

- Use one consistent response and error vocabulary per API surface.
- Prefer explicit evolution strategy over “we will figure it out later.”
- Match the pattern to client needs and team capability.
- Treat rate limiting and abuse controls as part of API design.
- Keep auth semantics visible and documented.

## Avoid

- Defaulting to REST, GraphQL, or RPC by trend alone.
- Inconsistent envelopes across related endpoints.
- Mixing public and internal conventions into one confused surface.
- Delaying versioning and pagination decisions until after rollout.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/pattern-selection-checklist.md` | You need a sharper decision aid for REST vs GraphQL vs RPC, response envelopes, auth shape, and versioning tradeoffs. |
