````markdown
---
inclusion: manual
name: vercel-ai
description: "Canonical Vercel AI skill covering AI Gateway and AI SDK integration, routing, resilience, and observability."
metadata:
  deprecated: false
  replaced_by: null
  removal_target: null
---

# Vercel AI

## Purpose

Implement Vercel AI workloads with a single operating model across AI Gateway and AI SDK: provider routing, fallback resilience, secure key handling, streaming UX, and usage observability.

## Use This For

- AI Gateway provider routing and fallback chains
- BYOK/auth strategy and OpenAI-compatible endpoints
- AI SDK integration for chat/completions/streaming
- AI request telemetry and cost/usage controls

## Decision Flow

1. Select provider topology and fallback policy.
2. Define auth and secret boundaries.
3. Implement SDK streaming/UI contract.
4. Validate latency/cost/error behavior with telemetry.

## Verification

- Gateway routes and fallback logic are deterministic.
- SDK streaming path is stable under provider failure.
- Token usage and error rates are observable per route/model.

## Related Skills

- `vercel-platform`
- `prompt-engineer`
- `vercel-observability`
````
