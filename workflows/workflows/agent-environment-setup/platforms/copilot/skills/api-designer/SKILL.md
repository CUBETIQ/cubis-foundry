---
name: api-designer
description: "Use when defining or reviewing external API contracts, OpenAPI specifications, resource models, pagination, versioning, and error response standards. Do not use for pure database design or framework-only handler wiring."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# API Designer

## Purpose

Use when defining or reviewing external API contracts, OpenAPI specifications, resource models, pagination, versioning, and error response standards. Do not use for pure database design or framework-only handler wiring.

## When to Use

- Defining external REST or GraphQL contracts.
- Writing or reviewing OpenAPI schemas and endpoint shapes.
- Choosing pagination, filtering, idempotency, and versioning rules.
- Standardizing error envelopes and auth-facing API behavior.

## Instructions

1. Clarify consumers, auth model, and backward-compatibility constraints.
2. Model resources, operations, and failure cases before implementation.
3. Choose transport shape, versioning policy, and pagination pattern deliberately.
4. Define request, response, and error envelopes with explicit examples.
5. Hand off a contract that implementation skills can build against without guessing.

### Baseline standards

- Prefer stable resource-oriented contracts over framework-driven shapes.
- Keep request validation explicit at the boundary.
- Document error semantics and retry expectations.
- Use pagination on collections by default.
- Make deprecation and compatibility policy explicit.

### Constraints

- Avoid verb-based URI design.
- Avoid inconsistent response envelopes across endpoints.
- Avoid silent breaking changes.
- Avoid mixing database structure directly into the external contract.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/contract-checklist.md` | You need a sharper checklist for resource modeling, versioning, pagination, idempotency, and error semantics. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with api designer best practices in this project"
- "Review my api designer implementation for issues"
