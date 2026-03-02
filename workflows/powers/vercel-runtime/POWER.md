````markdown
---
inclusion: manual
name: vercel-runtime
description: "Canonical Vercel runtime skill covering functions, routing, and caching with production guardrails."
metadata:
  deprecated: false
  replaced_by: null
  removal_target: null
---

# Vercel Runtime

## Purpose

Design and operate Vercel runtime behavior across serverless/edge functions, routing/middleware, and caching strategy as one coherent runtime layer.

## Use This For

- Function runtime selection (Node, Python, Edge, Fluid Compute)
- Middleware, redirects/rewrites, Edge Config routing behavior
- Cache-control, CDN behavior, ISR, Data Cache, invalidation

## Decision Flow

1. Confirm execution boundary (edge vs serverless vs region).
2. Select routing strategy and middleware scope.
3. Choose caching policy by data volatility and SLA.
4. Validate failure behavior, fallback path, and observability.

## Verification

- Runtime logs confirm expected execution target.
- Latency and cache hit ratio are measured.
- No blocking regressions in auth/routing flows.

## Related Skills

- `vercel-platform`
- `vercel-delivery`
- `vercel-security`
- `vercel-observability`
````
