---
name: api-design
description: API design best practices covering REST, GraphQL, gRPC patterns, versioning strategies, pagination, error contracts, and OpenAPI specifications for robust service interfaces.
---
# API Design

## Purpose

Provide comprehensive guidance for designing APIs that are intuitive, consistent, evolvable, and well-documented. Covers RESTful resource modeling, GraphQL schema design, gRPC service definitions, versioning strategies, pagination patterns, error contracts, and OpenAPI specification authoring. Ensures that APIs serve as stable, self-documenting contracts between producers and consumers regardless of protocol choice.

## When to Use

- Designing a new REST API with resource-oriented endpoints
- Modeling a GraphQL schema with queries, mutations, and subscriptions
- Defining gRPC service contracts with Protocol Buffers
- Choosing a versioning strategy for an evolving API
- Implementing pagination for large collection endpoints
- Designing error response contracts with structured problem details
- Writing or reviewing OpenAPI / Swagger specifications
- Evaluating which API paradigm (REST, GraphQL, gRPC) fits a given use case

## Instructions

1. **Choose the API paradigm based on consumer needs** — Use REST for broad public consumption with caching needs, GraphQL for clients that need flexible data shaping (mobile, dashboards), and gRPC for high-performance internal service communication so that the protocol matches the consumption pattern. See `references/rest-design.md`.

2. **Model resources as nouns, not verbs** — Design REST endpoints around domain resources (`/orders`, `/users/{id}/addresses`) rather than RPC-style actions (`/createOrder`) so that the API is predictable, cacheable, and consistent with HTTP semantics.

3. **Use HTTP methods with their standardized semantics** — GET for safe retrieval (cacheable, idempotent), POST for creation, PUT for full replacement, PATCH for partial update, DELETE for removal so that clients and intermediaries (caches, proxies, CDNs) can reason about behavior from the method alone.

4. **Design GraphQL schemas around client use cases** — Structure types and fields to match how clients query data rather than mirroring backend database tables so that clients get exactly the data they need in a single round trip. See `references/graphql-patterns.md`.

5. **Define gRPC services with evolution-safe Protobuf** — Use optional fields, reserved field numbers, and backward-compatible message changes so that server and client can evolve independently without breaking existing consumers. See `references/grpc-protobuf.md`.

6. **Version APIs from the first release** — Include the version in the URL path (`/v1/`) for REST or in the schema namespace for gRPC and plan a deprecation timeline for each version so that consumers have a stable contract and a migration path. See `references/versioning.md`.

7. **Implement cursor-based pagination for large collections** — Use opaque cursors (encoded primary key or timestamp) instead of offset-based pagination so that page stability is maintained when data is inserted or deleted between requests.

8. **Return structured error responses with problem details** — Follow RFC 9457 (Problem Details for HTTP APIs) with `type`, `title`, `status`, `detail`, and `instance` fields so that consumers can programmatically handle errors without parsing human-readable messages. See `references/error-contracts.md`.

9. **Use consistent naming conventions across all endpoints** — Adopt camelCase for JSON fields, kebab-case for URL paths, UPPER_SNAKE_CASE for enum values, and document the convention so that the API feels like a single cohesive product rather than a collection of endpoints written by different teams.

10. **Design idempotent operations with idempotency keys** — Require clients to send an `Idempotency-Key` header for POST requests so that retries due to network failures cannot create duplicate resources.

11. **Include hypermedia links for discoverability** — Provide `_links` or `links` in responses with relation types (`self`, `next`, `related`) so that clients can navigate the API programmatically without hardcoding URL templates.

12. **Validate request payloads at the gateway** — Apply JSON Schema validation or Protobuf field validation before the request reaches business logic so that malformed input is rejected early with clear, actionable error messages.

13. **Rate limit with informative headers** — Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` (or RFC draft `RateLimit` headers) so that clients can implement backoff strategies without trial-and-error.

14. **Document every endpoint with OpenAPI 3.1** — Write OpenAPI specs with descriptions, examples, and schema references for every request/response so that documentation is generated from the spec and stays synchronized with the implementation.

15. **Design for backward compatibility by default** — Add new fields as optional, never remove or rename existing fields, and use feature flags or new endpoints for breaking changes so that existing clients continue to work without modification after a deployment.

16. **Implement content negotiation for format flexibility** — Support `Accept` and `Content-Type` headers to negotiate JSON, Protocol Buffers, or other formats so that the same endpoint can serve different client needs without URL proliferation.

## Output Format

Deliver:

1. **Endpoint catalog** — Resource paths, methods, request/response schemas, and status codes
2. **Schema definitions** — OpenAPI components, GraphQL types, or Protobuf messages with field documentation
3. **Error contract** — Structured error response format with example payloads for common failure modes
4. **Versioning plan** — Version numbering scheme, deprecation timeline, and migration guidance
5. **Pagination specification** — Cursor or offset strategy with example request/response pairs

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/rest-design.md` | Task involves RESTful resource modeling, HTTP semantics, or HATEOAS patterns. |
| `references/graphql-patterns.md` | Task involves GraphQL schema design, resolvers, DataLoader, or subscription patterns. |
| `references/grpc-protobuf.md` | Task involves gRPC service definitions, Protobuf schema evolution, or streaming patterns. |
| `references/versioning.md` | Task involves API versioning strategies, deprecation policies, or backward compatibility. |
| `references/error-contracts.md` | Task involves error response design, problem details, or validation error formatting. |

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
