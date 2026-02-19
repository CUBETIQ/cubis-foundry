---
name: vercel-request-collapsing
description: "Use request collapsing to protect origins under burst traffic."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, cache, request, collapsing
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nextjs-developer, web-perf, seo-fundamentals
---

# Vercel Request Collapsing

## Purpose
Use request collapsing to protect origins under burst traffic.

## When To Use
- Vercel platform changes in the `cache` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Define freshness and consistency targets before setting cache behavior.
2. Apply headers and routing rules that enforce those targets deterministically.
3. Test cache hits, misses, and invalidation behavior under repeated requests.
4. Capture operational guidance for purge and rollback procedures.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
