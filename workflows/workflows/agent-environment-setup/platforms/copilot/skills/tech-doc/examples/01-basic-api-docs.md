# Example: Documenting a REST API

## Scenario

A team has built a user management microservice with authentication. The API needs comprehensive documentation for internal consumers (other teams' services) and external partners who integrate via the API. The documentation must include authentication details, endpoint descriptions, request/response examples, error catalogs, and rate limiting information.

## Prompt

"Write API documentation for our user management service. Endpoints: POST /api/users (create), GET /api/users/:id (get by ID), PATCH /api/users/:id (update), DELETE /api/users/:id (delete), POST /api/auth/login (authenticate). We use JWT bearer tokens. Include curl examples, error codes, and rate limits."

## Expected Output

### User Management API

**Base URL**: `https://api.example.com/v1`
**Authentication**: Bearer token (JWT) in the `Authorization` header
**Content-Type**: `application/json`
**Rate Limits**: 100 requests/minute per API key (standard), 1000 requests/minute (premium)

---

### Authentication

All endpoints except `POST /api/auth/login` require a valid JWT bearer token.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Obtain a token by calling the login endpoint. Tokens expire after 24 hours. Include the token in every subsequent request.

---

### POST /api/auth/login

Authenticate a user and receive a JWT token.

**Request**

```bash
curl -X POST https://api.example.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepassword123"
  }'
```

| Field | Type | Required | Description |
|---|---|---|---|
| email | string | Yes | User's email address |
| password | string | Yes | User's password (min 8 characters) |

**Success Response (200)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-03-15T14:30:00Z",
  "user": {
    "id": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice Johnson"
  }
}
```

**Error Responses**

| Status | Code | Description |
|---|---|---|
| 400 | VALIDATION_ERROR | Missing or malformed email/password |
| 401 | INVALID_CREDENTIALS | Email or password is incorrect |
| 429 | RATE_LIMITED | Too many login attempts. Retry after the `Retry-After` header value |

---

### POST /api/users

Create a new user account.

**Request**

```bash
curl -X POST https://api.example.com/v1/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "email": "bob@example.com",
    "name": "Bob Smith",
    "role": "member"
  }'
```

| Field | Type | Required | Description |
|---|---|---|---|
| email | string | Yes | Unique email address |
| name | string | Yes | Display name (1-100 characters) |
| role | string | No | One of: `admin`, `member`, `viewer`. Default: `member` |

**Success Response (201)**

```json
{
  "id": "usr_def456",
  "email": "bob@example.com",
  "name": "Bob Smith",
  "role": "member",
  "createdAt": "2025-03-14T10:00:00Z"
}
```

**Error Responses**

| Status | Code | Description |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid email format, missing required fields, or name exceeds 100 characters |
| 401 | UNAUTHORIZED | Missing or expired bearer token |
| 409 | DUPLICATE_EMAIL | A user with this email already exists |

---

### GET /api/users/:id

Retrieve a user by their unique identifier.

**Request**

```bash
curl -X GET https://api.example.com/v1/api/users/usr_abc123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Success Response (200)**

```json
{
  "id": "usr_abc123",
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "role": "admin",
  "createdAt": "2025-01-15T08:30:00Z",
  "updatedAt": "2025-03-10T14:22:00Z"
}
```

**Error Responses**

| Status | Code | Description |
|---|---|---|
| 401 | UNAUTHORIZED | Missing or expired bearer token |
| 404 | NOT_FOUND | No user exists with the given ID |

---

### Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email address is required.",
    "details": [
      { "field": "email", "issue": "required" }
    ]
  },
  "requestId": "req_xyz789"
}
```

- `code`: Machine-readable error code for programmatic handling.
- `message`: Human-readable description for debugging.
- `details`: Optional array with field-level validation errors.
- `requestId`: Unique identifier for correlating with server logs during support requests.

---

### Rate Limiting

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Maximum requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit window resets |
| `Retry-After` | Seconds to wait before retrying (only on 429 responses) |

## Key Decisions

- **curl examples for every endpoint** — copy-pasteable examples eliminate guesswork for API consumers.
- **Consistent error format with `requestId`** — enables support workflows where consumers report the request ID for server-side debugging.
- **Error table per endpoint** — lists only the errors that specific endpoint can return, not a global error catalog repeated everywhere.
- **Rate limit headers documented** — consumers need this to implement retry logic and avoid hitting limits.
- **Consumer-first organization** — endpoints are organized by use case (authenticate, then CRUD), not by HTTP method or route alphabetically.
