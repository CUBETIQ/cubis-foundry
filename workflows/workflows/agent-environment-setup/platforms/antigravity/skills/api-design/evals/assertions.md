# API Design Eval Assertions

## Eval 1: REST API Contract Design

This eval tests the ability to design a RESTful API with proper resource modeling, HTTP semantics, pagination, error handling, and OpenAPI documentation for a task management system.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `GET` — Proper HTTP method usage | REST APIs must use HTTP methods with their standardized semantics. GET for safe retrieval enables caching and is idempotent. Using POST for reads breaks HTTP semantics and cache layers. |
| 2 | contains | `cursor` — Cursor-based pagination | Offset pagination breaks when data changes between requests (duplicates, skipped items). Cursor-based pagination provides stable pages regardless of concurrent writes. |
| 3 | contains | `application/problem+json` — RFC 9457 error format | Ad-hoc error formats require custom parsing per API. Problem Details provides a standardized structure that clients can handle generically while still including API-specific detail fields. |
| 4 | contains | `openapi` — OpenAPI specification | A spec-first approach ensures documentation is always synchronized with implementation. OpenAPI enables code generation, testing, and SDK creation from a single source of truth. |
| 5 | contains | `filter` — Collection filtering support | Clients must be able to retrieve subsets of collections without downloading everything. Query parameter filters reduce payload size, database load, and client-side processing. |

### What a passing response looks like

- Resource hierarchy: `/v1/workspaces/{id}/projects/{id}/tasks/{id}/comments/{id}`.
- GET (list with filters), GET (by ID), POST (create), PATCH (partial update), DELETE for each resource.
- Cursor-based pagination: `?cursor=eyJpZCI6MTIzfQ&limit=25` with `next_cursor` in response.
- Filtering: `?status=in_progress&priority=high&assignee=user_123&due_before=2025-12-31`.
- Error responses with `application/problem+json` content type, including `type` URI, `title`, `status`, `detail`, and `errors` array for validation failures.
- OpenAPI 3.1 spec with `info`, `paths`, `components/schemas`, and `examples`.
- Standard response envelope or direct resource representation with consistent field naming (camelCase).
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Eval 2: GraphQL Schema Design

This eval tests the ability to design a GraphQL schema with Relay-style pagination, input types, union-based error handling, and DataLoader for N+1 prevention in a social content platform.

### Assertions

| # | Type | What it checks | Why it matters |
|---|------|----------------|----------------|
| 1 | contains | `Connection` — Relay-style pagination types | Relay connections provide a standardized cursor-based pagination contract that works with any GraphQL client. Custom pagination reinvents a solved problem and breaks client library expectations. |
| 2 | contains | `input` — Dedicated mutation input types | Input types encapsulate mutation arguments into a single typed object, enabling validation, documentation, and future field additions without breaking existing mutations. |
| 3 | contains | `DataLoader` — N+1 query prevention | Without DataLoader, resolving a list of posts with their authors generates N+1 database queries. DataLoader batches and deduplicates loader calls within a single request. |
| 4 | contains | `union` — Union types for error modeling | Returning errors in the data layer (union of success and error types) gives clients type-safe error handling. Throwing exceptions forces clients to parse untyped error extensions. |
| 5 | contains | `visibility` — Authorization in resolvers | Post visibility (public, followers, private) must be enforced in resolvers, not just in the client. Missing server-side authorization means private content is accessible via direct GraphQL queries. |

### What a passing response looks like

- Types: `User`, `Post`, `Comment`, `Reaction`, `MediaAttachment`, `Tag`.
- Connection types: `PostConnection { edges: [PostEdge], pageInfo: PageInfo }` with `PostEdge { cursor, node }`.
- Input types: `CreatePostInput { content, mediaIds, tagIds, visibility }`, `UpdatePostInput { content?, visibility? }`.
- Union result types: `CreatePostResult = Post | ValidationError | AuthorizationError`.
- Visibility enum: `enum PostVisibility { PUBLIC, FOLLOWERS, PRIVATE }`.
- Feed query with DataLoader for batch-loading authors, reaction counts, and comment counts.
- Resolver architecture: per-type DataLoaders instantiated per-request to avoid cross-request caching.
- Subscription type for real-time updates: `onNewComment(postId: ID!): Comment`.
