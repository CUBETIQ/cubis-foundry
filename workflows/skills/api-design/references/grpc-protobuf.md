# gRPC and Protocol Buffers

## When to Use gRPC

| Factor | gRPC is better | REST is better |
|--------|---------------|----------------|
| Client type | Internal services, mobile apps | Browsers, public APIs |
| Performance | High throughput, low latency | Caching at HTTP layer needed |
| Schema | Strong typing enforced | Flexible, schema-optional |
| Streaming | Bidirectional streaming needed | Request-response only |
| Ecosystem | Polyglot microservices | Web-first, broad tooling |
| Debugging | Acceptable to use tooling (grpcurl) | Must be testable with curl |

## Protocol Buffer Schema Design

### Message Design

```protobuf
syntax = "proto3";

package taskflow.v1;

import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";

// Use singular for message names, PascalCase
message Task {
  string id = 1;
  string title = 2;
  string description = 3;
  TaskStatus status = 4;
  TaskPriority priority = 5;
  string assignee_id = 6;
  google.protobuf.Timestamp due_date = 7;
  google.protobuf.Timestamp created_at = 8;
  google.protobuf.Timestamp updated_at = 9;
}

enum TaskStatus {
  TASK_STATUS_UNSPECIFIED = 0;  // Always have a zero value as UNSPECIFIED
  TASK_STATUS_TODO = 1;
  TASK_STATUS_IN_PROGRESS = 2;
  TASK_STATUS_REVIEW = 3;
  TASK_STATUS_DONE = 4;
}

enum TaskPriority {
  TASK_PRIORITY_UNSPECIFIED = 0;
  TASK_PRIORITY_LOW = 1;
  TASK_PRIORITY_MEDIUM = 2;
  TASK_PRIORITY_HIGH = 3;
  TASK_PRIORITY_URGENT = 4;
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Package | `lowercase.dotted` | `taskflow.v1` |
| Message | `PascalCase` | `CreateTaskRequest` |
| Field | `snake_case` | `created_at`, `assignee_id` |
| Enum type | `PascalCase` | `TaskStatus` |
| Enum value | `UPPER_SNAKE_CASE` with type prefix | `TASK_STATUS_TODO` |
| Service | `PascalCase` | `TaskService` |
| RPC method | `PascalCase` verb phrase | `CreateTask`, `ListTasks` |

### Field Numbering Rules

- Fields 1-15 use 1 byte for the tag. Reserve these for frequently used fields.
- Fields 16-2047 use 2 bytes. Use for less frequent fields.
- Never reuse a field number after removing a field. Use `reserved`.
- Skip field numbers for future use if you anticipate additions.

```protobuf
message Task {
  // Frequently accessed fields: 1-15
  string id = 1;
  string title = 2;
  TaskStatus status = 3;

  // Less frequently accessed fields: 16+
  string description = 16;
  map<string, string> metadata = 17;

  // Reserved: removed fields (never reuse these numbers)
  reserved 10, 11;
  reserved "legacy_field", "old_status";
}
```

## Service Definition

```protobuf
service TaskService {
  // Unary RPCs
  rpc CreateTask(CreateTaskRequest) returns (Task);
  rpc GetTask(GetTaskRequest) returns (Task);
  rpc UpdateTask(UpdateTaskRequest) returns (Task);
  rpc DeleteTask(DeleteTaskRequest) returns (google.protobuf.Empty);

  // Server streaming
  rpc ListTasks(ListTasksRequest) returns (stream Task);

  // Client streaming
  rpc BulkCreateTasks(stream CreateTaskRequest) returns (BulkCreateResponse);

  // Bidirectional streaming
  rpc WatchTasks(stream WatchTasksRequest) returns (stream TaskEvent);
}
```

### Request and Response Messages

```protobuf
message CreateTaskRequest {
  string title = 1;
  string description = 2;
  TaskPriority priority = 3;
  string assignee_id = 4;
  google.protobuf.Timestamp due_date = 5;
  string idempotency_key = 6;    // Client-generated for safe retries
}

message GetTaskRequest {
  string id = 1;
}

message UpdateTaskRequest {
  string id = 1;
  Task task = 2;
  google.protobuf.FieldMask update_mask = 3;  // Which fields to update
}

message ListTasksRequest {
  string project_id = 1;
  int32 page_size = 2;           // Max items per page
  string page_token = 3;         // Opaque pagination token
  string filter = 4;             // Filter expression: "status=TODO AND priority=HIGH"
  string order_by = 5;           // Sort: "created_at desc"
}

message DeleteTaskRequest {
  string id = 1;
}
```

### Pagination Pattern

```protobuf
message ListTasksResponse {
  repeated Task tasks = 1;
  string next_page_token = 2;    // Empty if no more pages
  int32 total_size = 3;          // Optional: total count
}
```

## Schema Evolution

### Safe Changes (Backward Compatible)

| Change | Safety | Notes |
|--------|--------|-------|
| Add new optional field | Safe | Old clients ignore unknown fields |
| Add new enum value | Safe | Old clients see it as the default value (0) |
| Add new RPC method | Safe | Old clients do not call it |
| Add new message type | Safe | No existing code affected |
| Deprecate a field | Safe | Mark with `[deprecated = true]` |
| Change field from `required` to `optional` | Safe in proto3 | All fields are optional in proto3 |

### Unsafe Changes (Breaking)

| Change | Risk | Mitigation |
|--------|------|------------|
| Remove a field | Old clients break on send | Use `reserved` to prevent reuse |
| Rename a field | Wire format unchanged, but code regen breaks | Field number matters, not name |
| Change field type | Deserialization fails | Add new field, deprecate old |
| Change field number | Data corruption | Never do this |
| Reorder enum values | Deserialization maps wrong values | Never do this |
| Remove enum value | Old data with that value becomes invalid | Add `reserved` |

### Versioning Strategies

**Package-level versioning (recommended):**
```protobuf
package taskflow.v1;    // Initial version
package taskflow.v2;    // Breaking changes go in a new package
```

**Service-level versioning:**
```protobuf
service TaskServiceV1 { ... }
service TaskServiceV2 { ... }
```

Run both versions simultaneously. Migrate consumers gradually. Deprecate old version with a sunset timeline.

## Streaming Patterns

### Server Streaming

Server sends multiple responses to a single client request:

```
Client ──ListTasks──► Server
Client ◄──Task 1───── Server
Client ◄──Task 2───── Server
Client ◄──Task 3───── Server
Client ◄──(end)────── Server
```

Use for: Large result sets, real-time updates, log tailing.

### Client Streaming

Client sends multiple messages; server responds once:

```
Client ──Task 1──► Server
Client ──Task 2──► Server
Client ──Task 3──► Server
Client ──(end)──►  Server
Client ◄──Result── Server
```

Use for: File uploads, batch operations, telemetry ingestion.

### Bidirectional Streaming

Both sides send messages concurrently:

```
Client ──Subscribe──► Server
Client ◄──Event 1──── Server
Client ──Ack────────► Server
Client ◄──Event 2──── Server
Client ──Filter──────► Server  (change subscription mid-stream)
Client ◄──Event 3──── Server
```

Use for: Chat, collaborative editing, live dashboards.

## Error Handling

### gRPC Status Codes

| Code | Name | HTTP equivalent | Use when |
|------|------|----------------|----------|
| 0 | OK | 200 | Success |
| 1 | CANCELLED | 499 | Client cancelled the request |
| 2 | UNKNOWN | 500 | Unknown error |
| 3 | INVALID_ARGUMENT | 400 | Client sent invalid input |
| 5 | NOT_FOUND | 404 | Resource does not exist |
| 6 | ALREADY_EXISTS | 409 | Resource already exists (duplicate creation) |
| 7 | PERMISSION_DENIED | 403 | Authenticated but not authorized |
| 8 | RESOURCE_EXHAUSTED | 429 | Rate limited or quota exceeded |
| 9 | FAILED_PRECONDITION | 400 | Operation rejected due to system state |
| 10 | ABORTED | 409 | Transaction aborted (retry may succeed) |
| 12 | UNIMPLEMENTED | 501 | Method not implemented |
| 13 | INTERNAL | 500 | Internal server error |
| 14 | UNAVAILABLE | 503 | Service temporarily unavailable (retry) |
| 16 | UNAUTHENTICATED | 401 | Missing or invalid authentication |

### Rich Error Details

```protobuf
import "google/rpc/error_details.proto";

// Server returns status with details:
// Code: INVALID_ARGUMENT
// Message: "Validation failed"
// Details:
//   - BadRequest { field_violations: [
//       { field: "title", description: "Title is required" },
//       { field: "priority", description: "Must be LOW, MEDIUM, HIGH, or URGENT" }
//     ]}
```

## Interceptors (Middleware)

```
Client ──► Client Interceptor ──► Network ──► Server Interceptor ──► Handler
                                                                          │
Client ◄── Client Interceptor ◄── Network ◄── Server Interceptor ◄──────┘
```

Common interceptors:

| Interceptor | Purpose |
|-------------|---------|
| Authentication | Validate JWT/API key from metadata |
| Logging | Log request/response with trace ID |
| Metrics | Record latency, status code, method |
| Retry | Client-side retry with backoff |
| Deadline | Enforce per-RPC deadlines |
| Rate limiting | Server-side request throttling |
| Validation | Validate request messages against rules |

## Performance

### Connection Management

- gRPC uses HTTP/2 with multiplexed streams over a single TCP connection.
- One connection per client-server pair is usually sufficient.
- Use connection pooling only for very high throughput (> 10K RPS per client).
- Set keepalive pings to detect dead connections (default: 2 hours is too long, use 30-60 seconds).

### Compression

```
Channel options:
  default_compression_algorithm: gzip
  default_compression_level: medium
```

Enable gzip compression for messages > 1KB. The CPU cost is usually offset by reduced network time.

### Load Balancing

gRPC with HTTP/2 keeps connections open, which breaks L4 (TCP) load balancing:

| Strategy | How | When |
|----------|-----|------|
| Client-side LB | Client discovers servers (DNS, service registry) and balances across them | Internal services with service discovery |
| Proxy-based L7 LB | Envoy, Nginx, or cloud LB that understands HTTP/2 | External-facing, service mesh |
| Lookaside LB | Client asks a LB service for the target server | Google-style, complex but precise |

Recommendation: Use Envoy proxy or service mesh sidecar for gRPC load balancing.
