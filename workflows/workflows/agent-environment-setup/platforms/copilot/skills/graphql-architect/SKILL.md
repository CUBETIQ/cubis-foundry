---
name: "graphql-architect"
description: "Use when designing GraphQL schemas, resolver boundaries, batching strategy, auth and policy enforcement, federation shape, query safety, and real-time graph behavior."
license: MIT
metadata:
  version: "3.0.0"
  domain: "api-architecture"
  role: "specialist"
  stack: "graphql"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "modern GraphQL schema and resolver practices"
  tags: ["graphql", "schema", "resolvers", "dataloader", "federation", "api"]
---
# GraphQL Architect

## When to use

- Designing or refactoring GraphQL schemas and resolver structure.
- Choosing batching, caching, federation, auth, and subscription behavior.
- Reviewing query safety, nullability, and graph boundary decisions.
- Converting a REST-shaped backend into a graph with deliberate tradeoffs.

## When not to use

- Simple REST contract design with no graph requirement.
- Framework-only Nest or FastAPI questions that are not GraphQL-specific.
- Database-only tuning with no resolver/query-shape impact.

## Core workflow

1. Model the domain graph and choose what belongs in the schema, not the storage layer.
2. Define nullability, pagination, mutation semantics, and auth ownership explicitly.
3. Design resolver boundaries with batching and cache behavior in mind.
4. Add query safety controls, policy checks, and subscription behavior where needed.
5. Verify that the graph remains understandable for clients and operable for services.

## Baseline standards

- Prefer schema clarity over exposing every backend shape.
- Use batching to prevent N+1 patterns.
- Keep nullability intentional and documented.
- Keep auth and permission rules explicit at schema or resolver boundaries.
- Treat federation and subscriptions as architectural choices, not defaults.
- Make query cost and auth behavior explicit.

## Avoid

- REST-shaped GraphQL that only mirrors endpoint habits.
- Resolver logic that hides unbounded fan-out.
- Ambiguous nullability and inconsistent mutation payloads.
- Authorization that exists only in the client or gateway with no resolver ownership.
- Adding federation complexity before single-graph boundaries are clear.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/schema-resolver-checklist.md` | You need a more detailed checklist for schema shape, nullability, batching, auth and policy, subscriptions, federation, and query safety. |
