# REST API Design

## Resource Modeling

### Resource Hierarchy

Model resources as nouns organized in a hierarchy that reflects domain relationships:

```
/v1/workspaces                          ← Collection
/v1/workspaces/{id}                     ← Singleton
/v1/workspaces/{id}/projects            ← Nested collection
/v1/workspaces/{id}/projects/{id}       ← Nested singleton
/v1/workspaces/{id}/projects/{id}/tasks ← Deeply nested collection
```

Rules:
- Use plural nouns for collections: `/users` not `/user`
- Use kebab-case for multi-word resources: `/payment-methods` not `/paymentMethods`
- Limit nesting to 3 levels. Beyond that, use top-level resources with query filters
- Use IDs, not names, in paths: `/users/123` not `/users/john-doe`

### When to Flatten

If a resource can exist independently, promote it to a top-level endpoint:

```
Instead of: /workspaces/{wid}/projects/{pid}/tasks/{tid}/comments/{cid}
Use:        /tasks/{tid}/comments/{cid}
```

Provide the parent relationship via query parameters or response fields:
```
GET /tasks?workspace_id=ws_1&project_id=proj_1
```

## HTTP Methods

| Method | Semantics | Idempotent | Safe | Cacheable |
|--------|-----------|-----------|------|-----------|
| GET | Retrieve resource(s) | Yes | Yes | Yes |
| POST | Create resource or trigger action | No | No | No |
| PUT | Replace resource entirely | Yes | No | No |
| PATCH | Partial update | No* | No | No |
| DELETE | Remove resource | Yes | No | No |
| HEAD | GET without body (check existence) | Yes | Yes | Yes |
| OPTIONS | Discover allowed methods | Yes | Yes | No |

*PATCH can be made idempotent with JSON Merge Patch.

### POST vs. PUT vs. PATCH

```
POST /orders               ← Create (server assigns ID)
PUT /orders/123             ← Replace entire order (client sends full representation)
PATCH /orders/123           ← Update specific fields (client sends only changed fields)
```

Use PUT when the client knows the full resource representation.
Use PATCH when the client wants to update one or two fields.
Use POST for creation when the server assigns the ID.

### Non-CRUD Operations

Some operations do not map cleanly to CRUD. Options:

| Approach | Example | When |
|----------|---------|------|
| Sub-resource | POST /orders/123/cancellation | Action creates a new entity |
| State field | PATCH /orders/123 { "status": "cancelled" } | Action changes a single field |
| Controller resource | POST /orders/123/actions/cancel | Complex action with side effects |

Prefer sub-resources or state changes. Controller resources are a last resort.

## Status Codes

### Success

| Code | Meaning | Use when |
|------|---------|----------|
| 200 OK | Request succeeded | GET, PUT, PATCH with response body |
| 201 Created | Resource created | POST that creates, include Location header |
| 202 Accepted | Request accepted, processing async | Long-running operations |
| 204 No Content | Success, no body | DELETE, PUT/PATCH when no body needed |

### Client Error

| Code | Meaning | Use when |
|------|---------|----------|
| 400 Bad Request | Malformed request | Invalid JSON, missing required header |
| 401 Unauthorized | Authentication required | Missing or invalid token |
| 403 Forbidden | Authenticated but not authorized | Valid token, insufficient permissions |
| 404 Not Found | Resource does not exist | ID not found, or hiding forbidden resources |
| 405 Method Not Allowed | HTTP method not supported | PUT on a read-only resource |
| 409 Conflict | State conflict | Duplicate creation, concurrent modification |
| 422 Unprocessable Entity | Validation failed | Valid JSON but invalid field values |
| 429 Too Many Requests | Rate limited | Include Retry-After header |

### Server Error

| Code | Meaning | Use when |
|------|---------|----------|
| 500 Internal Server Error | Unexpected server failure | Unhandled exception |
| 502 Bad Gateway | Upstream service error | Downstream service returned invalid response |
| 503 Service Unavailable | Temporarily unavailable | Maintenance, overload. Include Retry-After |
| 504 Gateway Timeout | Upstream timeout | Downstream service did not respond in time |

## Response Format

### Consistent Envelope

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-03-14T10:30:00Z"
  }
}
```

Or direct resource representation (simpler, preferred for single resources):

```json
{
  "id": "task_123",
  "title": "Implement pagination",
  "status": "in_progress",
  "_links": {
    "self": { "href": "/v1/tasks/task_123" },
    "project": { "href": "/v1/projects/proj_456" }
  }
}
```

### Field Naming

| Convention | Scope | Example |
|-----------|-------|---------|
| camelCase | JSON response fields | `createdAt`, `userId`, `isActive` |
| kebab-case | URL paths | `/payment-methods`, `/order-items` |
| UPPER_SNAKE_CASE | Enum values | `IN_PROGRESS`, `PAYMENT_FAILED` |
| lowercase | Query parameters | `?sort_by=created_at&order=desc` |

Pick one convention and enforce it across all endpoints. Inconsistency is the worst choice.

## Pagination

### Cursor-Based (Recommended)

```
Request:  GET /tasks?cursor=eyJpZCI6MTIzfQ&limit=25
Response:
{
  "data": [ ... 25 items ... ],
  "pagination": {
    "next_cursor": "eyJpZCI6MTQ4fQ",
    "has_more": true,
    "limit": 25
  }
}
```

The cursor is an opaque string (base64-encoded sort key). The client never needs to understand its content.

Advantages:
- Stable pages (inserts/deletes between pages do not cause duplicates or gaps)
- Efficient for large datasets (no COUNT or OFFSET)
- Works with real-time data

### Offset-Based (Simple but Fragile)

```
Request:  GET /tasks?offset=50&limit=25
Response:
{
  "data": [ ... 25 items ... ],
  "pagination": {
    "total": 1234,
    "offset": 50,
    "limit": 25
  }
}
```

Disadvantages:
- Page drift when data changes between requests
- Slow for large offsets (database must skip N rows)
- Expensive COUNT for total

Use offset-based only for admin UIs or reports where page stability is not critical.

## Filtering and Sorting

### Filter Syntax Options

```
# Bracket notation (clear, extensible)
GET /tasks?filter[status]=in_progress&filter[priority]=high

# Flat parameters (simple, works for basic cases)
GET /tasks?status=in_progress&priority=high

# LHS brackets with operators (powerful, complex)
GET /tasks?filter[due_date][lt]=2025-12-31&filter[priority][in]=high,urgent
```

### Sort Syntax

```
# Comma-separated fields, prefix with - for descending
GET /tasks?sort=-priority,created_at

# Explicit direction
GET /tasks?sort_by=priority&sort_order=desc
```

## HATEOAS (Hypermedia)

Include links in responses for API discoverability:

```json
{
  "id": "order_123",
  "status": "pending",
  "_links": {
    "self": { "href": "/v1/orders/order_123" },
    "cancel": { "href": "/v1/orders/order_123/cancellation", "method": "POST" },
    "payment": { "href": "/v1/payments/pay_456" },
    "items": { "href": "/v1/orders/order_123/items" }
  }
}
```

Benefits:
- Clients discover available actions without hardcoding URL patterns
- Server can add/remove links based on state (no `cancel` link on a shipped order)
- Reduces client coupling to URL structure

## Content Negotiation

```
Request:
  Accept: application/json

Response:
  Content-Type: application/json; charset=utf-8

For errors:
  Content-Type: application/problem+json
```

Support `Accept` header for format negotiation. Return 406 Not Acceptable if the requested format is not supported.

## Rate Limiting

Include rate limit information in every response:

```
X-RateLimit-Limit: 1000          ← Max requests per window
X-RateLimit-Remaining: 997       ← Remaining requests in window
X-RateLimit-Reset: 1710432000    ← Unix timestamp when window resets
Retry-After: 30                  ← Seconds to wait (on 429 responses)
```

### Rate Limit Strategies

| Strategy | Description | Use when |
|----------|-------------|----------|
| Fixed window | N requests per minute/hour | Simple, but allows bursts at window boundaries |
| Sliding window | N requests in the last 60 seconds | Smoother rate limiting |
| Token bucket | Refill N tokens/sec, each request costs 1 | Allows controlled bursts |
| Leaky bucket | Process at fixed rate, queue excess | Smoothest output rate |

## Caching

### Cache Control Headers

```
# Cacheable for 5 minutes, revalidate after
Cache-Control: public, max-age=300, must-revalidate

# Never cache (user-specific data)
Cache-Control: private, no-cache

# Conditional requests
ETag: "abc123"
Last-Modified: Thu, 14 Mar 2025 10:00:00 GMT
```

### When to Cache

| Resource type | Cache strategy | Example |
|--------------|---------------|---------|
| Public, rarely changing | Long TTL + CDN | Product images, static assets |
| Public, frequently changing | Short TTL + ETag | Product catalog, search results |
| User-specific | Private, no-cache or short TTL | User profile, notifications |
| Sensitive | No-store | Payment details, tokens |
