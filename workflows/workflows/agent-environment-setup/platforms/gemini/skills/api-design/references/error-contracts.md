# Error Contracts

## Design Principles

1. **Errors are part of the API contract.** Document every error response with the same rigor as success responses.
2. **Errors must be machine-readable.** Clients should parse errors programmatically, not by matching human-readable strings.
3. **Errors must be human-readable.** Include enough context for a developer to understand what went wrong without reading source code.
4. **Errors must be actionable.** Tell the client what to do differently.

## RFC 9457: Problem Details for HTTP APIs

The standard format for HTTP API error responses:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body contains 2 validation errors.",
  "instance": "/v1/tasks/task_123"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | URI | A URI reference that identifies the error type. Acts as a stable identifier for programmatic handling. |
| `title` | string | A short human-readable summary. Should be the same for all instances of this error type. |
| `status` | integer | The HTTP status code. Matches the response status code. |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `detail` | string | A human-readable explanation specific to this occurrence. May vary per request. |
| `instance` | string | A URI reference to the specific occurrence (the request path or a unique error ID). |

### Extension Fields

Add domain-specific fields alongside the standard ones:

```json
{
  "type": "https://api.example.com/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded 1000 requests per minute. Please retry after 30 seconds.",
  "instance": "/v1/tasks",
  "retry_after": 30,
  "rate_limit": {
    "limit": 1000,
    "remaining": 0,
    "reset_at": "2025-03-14T10:31:00Z"
  }
}
```

### Content Type

Always return `application/problem+json` for error responses:

```
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.example.com/errors/validation-failed",
  ...
}
```

## Validation Errors

Validation errors are the most complex error type because they involve multiple fields:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body contains 3 validation errors.",
  "instance": "/v1/tasks",
  "errors": [
    {
      "field": "title",
      "code": "REQUIRED",
      "message": "Title is required.",
      "rejected_value": null
    },
    {
      "field": "priority",
      "code": "INVALID_ENUM",
      "message": "Priority must be one of: low, medium, high, urgent.",
      "rejected_value": "critical"
    },
    {
      "field": "due_date",
      "code": "INVALID_FORMAT",
      "message": "Due date must be in ISO 8601 format (YYYY-MM-DD).",
      "rejected_value": "March 14"
    }
  ]
}
```

### Field Error Structure

| Field | Type | Description |
|-------|------|-------------|
| `field` | string | JSON path to the invalid field (`title`, `address.zip`, `items[0].quantity`) |
| `code` | string | Machine-readable error code for this specific validation failure |
| `message` | string | Human-readable description of what is wrong and what is expected |
| `rejected_value` | any | The value that was rejected (useful for debugging) |

### Common Validation Error Codes

| Code | Meaning | Example message |
|------|---------|----------------|
| `REQUIRED` | Field is missing | "Title is required." |
| `INVALID_FORMAT` | Value format is wrong | "Email must be a valid email address." |
| `INVALID_ENUM` | Value not in allowed set | "Status must be one of: todo, in_progress, review, done." |
| `TOO_SHORT` | String or array too short | "Password must be at least 8 characters." |
| `TOO_LONG` | String or array too long | "Title must be at most 200 characters." |
| `TOO_SMALL` | Number too small | "Quantity must be at least 1." |
| `TOO_LARGE` | Number too large | "Quantity must be at most 10000." |
| `INVALID_TYPE` | Wrong data type | "Price must be a number." |
| `DUPLICATE` | Value already exists | "A user with this email already exists." |
| `INVALID_REFERENCE` | Referenced entity not found | "Assignee user_xyz does not exist." |
| `IMMUTABLE` | Field cannot be changed | "Order ID cannot be modified after creation." |

## Error Catalog

Define a catalog of all error types your API can return:

| Error Type URI | Status | Title | When |
|---------------|--------|-------|------|
| `/errors/validation-failed` | 422 | Validation Failed | Request body fails validation |
| `/errors/not-found` | 404 | Not Found | Resource ID does not exist |
| `/errors/unauthorized` | 401 | Unauthorized | Missing or invalid authentication |
| `/errors/forbidden` | 403 | Forbidden | Authenticated but lacks permission |
| `/errors/conflict` | 409 | Conflict | Concurrent modification or duplicate |
| `/errors/rate-limited` | 429 | Rate Limit Exceeded | Too many requests |
| `/errors/internal` | 500 | Internal Server Error | Unexpected server failure |
| `/errors/service-unavailable` | 503 | Service Unavailable | Downstream service outage |

### Error Type URIs

The `type` URI should:
- Be a real, resolvable URL that returns documentation about the error
- Be stable (never change once published)
- Use your API's domain as the base
- Be human-readable: `https://api.example.com/errors/validation-failed`

## Error Response by HTTP Status

### 400 Bad Request

```json
{
  "type": "https://api.example.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "The request body is not valid JSON. Unexpected token at position 42."
}
```

Use for: malformed JSON, missing Content-Type header, invalid query parameter syntax.

### 401 Unauthorized

```json
{
  "type": "https://api.example.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "The access token has expired. Please refresh your token and retry."
}
```

Always include `WWW-Authenticate` header:
```
WWW-Authenticate: Bearer error="invalid_token", error_description="Token has expired"
```

### 403 Forbidden

```json
{
  "type": "https://api.example.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to delete tasks in this project.",
  "required_permission": "project:tasks:delete"
}
```

### 404 Not Found

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task with ID 'task_xyz' does not exist.",
  "resource_type": "Task",
  "resource_id": "task_xyz"
}
```

Security note: Return 404 (not 403) for resources the user should not know exist. This prevents enumeration attacks.

### 409 Conflict

```json
{
  "type": "https://api.example.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "The task was modified by another user. Please reload and try again.",
  "current_version": "v7",
  "your_version": "v5"
}
```

Use for: optimistic locking failures, duplicate resource creation.

### 429 Too Many Requests

```json
{
  "type": "https://api.example.com/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded 1000 requests per minute.",
  "retry_after": 30
}
```

Always include `Retry-After` header with the number of seconds to wait.

### 500 Internal Server Error

```json
{
  "type": "https://api.example.com/errors/internal",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred. Please try again later.",
  "trace_id": "trace_abc123"
}
```

Rules for 500 errors:
- Never expose stack traces, database errors, or internal details.
- Include a `trace_id` so support can correlate with server logs.
- Log the full error details server-side.

## Client Error Handling

### Best Practices for API Consumers

```typescript
async function handleApiResponse(response: Response) {
  if (response.ok) {
    return response.json();
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/problem+json')) {
    const problem = await response.json();

    switch (problem.type) {
      case 'https://api.example.com/errors/validation-failed':
        throw new ValidationError(problem.errors);
      case 'https://api.example.com/errors/rate-limited':
        await sleep(problem.retry_after * 1000);
        return retry();
      case 'https://api.example.com/errors/unauthorized':
        await refreshToken();
        return retry();
      default:
        throw new ApiError(problem.title, problem.status, problem.detail);
    }
  }

  // Non-standard error response
  throw new ApiError('Unknown error', response.status);
}
```

### Retry Decisions by Status Code

| Status | Retry? | Strategy |
|--------|--------|----------|
| 400 | No | Fix the request (client bug) |
| 401 | Yes (once) | Refresh token, then retry |
| 403 | No | Request different permissions |
| 404 | No | Resource does not exist |
| 409 | Yes (once) | Refetch, merge changes, retry |
| 422 | No | Fix validation errors |
| 429 | Yes | Wait for `Retry-After` seconds |
| 500 | Yes (with backoff) | Transient server error |
| 502 | Yes (with backoff) | Upstream issue, may recover |
| 503 | Yes (with backoff) | Temporary, check `Retry-After` |
| 504 | Yes (with backoff) | Timeout, may recover |

## Testing Error Responses

### Checklist

| Test | Verify |
|------|--------|
| Missing required field | Returns 422 with field error pointing to the missing field |
| Invalid field type | Returns 422 with INVALID_TYPE code |
| Invalid enum value | Returns 422 with INVALID_ENUM code and allowed values |
| Non-existent resource | Returns 404 with resource type and ID |
| Expired token | Returns 401 with WWW-Authenticate header |
| Rate limit exceeded | Returns 429 with Retry-After header |
| Concurrent modification | Returns 409 with version information |
| Server error | Returns 500 with trace_id, no internal details |
| Content-Type header | All errors return application/problem+json |
| Error type URI | All error types resolve to documentation |
