---
name: "api-designer"
description: "Use when defining or reviewing external API contracts, OpenAPI specifications, resource models, pagination, versioning, and error response standards. Do not use for pure database design or framework-only handler wiring."
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
  baseline: "OpenAPI 3.1 and current HTTP API practices"
  tags: ["api", "openapi", "rest", "graphql", "versioning", "pagination"]
---

# API Designer

## When to use

- Defining external REST or GraphQL contracts.
- Writing or reviewing OpenAPI schemas and endpoint shapes.
- Choosing pagination, filtering, idempotency, and versioning rules.
- Standardizing error envelopes and auth-facing API behavior.

## When not to use

- Pure schema/index/migration work with no contract change.
- Framework-only controller or router implementation.
- Internal-only refactors that do not alter request or response boundaries.

## Core workflow

1. Clarify consumers, auth model, and backward-compatibility constraints.
2. Model resources, operations, and failure cases before implementation.
3. Choose transport shape, versioning policy, and pagination pattern deliberately.
4. Define request, response, and error envelopes with explicit examples.
5. Hand off a contract that implementation skills can build against without guessing.

## Baseline standards

- Prefer stable resource-oriented contracts over framework-driven shapes.
- Keep request validation explicit at the boundary.
- Document error semantics and retry expectations.
- Use pagination on collections by default.
- Make deprecation and compatibility policy explicit.

## Avoid

- Verb-based URI design.
- Inconsistent response envelopes across endpoints.
- Silent breaking changes.
- Mixing database structure directly into the external contract.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/contract-checklist.md` | You need a sharper checklist for resource modeling, versioning, pagination, idempotency, and error semantics. |
