---
name: graphql-architect
description: "Use when designing GraphQL schemas, resolver boundaries, batching strategy, auth and policy enforcement, federation shape, query safety, and real-time graph behavior."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# GraphQL Architect

## Purpose

Use when designing GraphQL schemas, resolver boundaries, batching strategy, auth and policy enforcement, federation shape, query safety, and real-time graph behavior.

## When to Use

- Designing or refactoring GraphQL schemas and resolver structure.
- Choosing batching, caching, federation, auth, and subscription behavior.
- Reviewing query safety, nullability, and graph boundary decisions.
- Converting a REST-shaped backend into a graph with deliberate tradeoffs.

## Instructions

1. Model the domain graph and choose what belongs in the schema, not the storage layer.
2. Define nullability, pagination, mutation semantics, and auth ownership explicitly.
3. Design resolver boundaries with batching and cache behavior in mind.
4. Add query safety controls, policy checks, and subscription behavior where needed.
5. Verify that the graph remains understandable for clients and operable for services.

### Baseline standards

- Prefer schema clarity over exposing every backend shape.
- Use batching to prevent N+1 patterns.
- Keep nullability intentional and documented.
- Keep auth and permission rules explicit at schema or resolver boundaries.
- Treat federation and subscriptions as architectural choices, not defaults.
- Make query cost and auth behavior explicit.

### Constraints

- Avoid rEST-shaped GraphQL that only mirrors endpoint habits.
- Avoid resolver logic that hides unbounded fan-out.
- Avoid ambiguous nullability and inconsistent mutation payloads.
- Avoid authorization that exists only in the client or gateway with no resolver ownership.
- Avoid adding federation complexity before single-graph boundaries are clear.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/schema-resolver-checklist.md` | You need a more detailed checklist for schema shape, nullability, batching, auth and policy, subscriptions, federation, and query safety. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with graphql architect best practices in this project"
- "Review my graphql architect implementation for issues"
