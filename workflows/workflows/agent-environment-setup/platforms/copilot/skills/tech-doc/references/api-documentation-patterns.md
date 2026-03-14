# API Documentation Patterns

Load this when writing or reviewing API documentation, choosing documentation format (OpenAPI, AsyncAPI), or setting up API doc tooling.

## OpenAPI specification structure

```yaml
openapi: 3.1.0
info:
  title: User Service API
  version: 2.1.0
  description: Manages user accounts, authentication, and profiles.
  contact:
    name: Platform Team
    email: platform@example.com

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://api.staging.example.com/v1
    description: Staging

security:
  - bearerAuth: []

paths:
  /users:
    post:
      summary: Create a new user
      operationId: createUser
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example:
              email: "alice@example.com"
              name: "Alice Johnson"
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConflictError'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      required: [id, email, name, createdAt]
      properties:
        id:
          type: string
          example: "usr_abc123"
        email:
          type: string
          format: email
        name:
          type: string
          maxLength: 100
        createdAt:
          type: string
          format: date-time

  responses:
    ValidationError:
      description: Request validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: "VALIDATION_ERROR"
              message: "Email address is required."
```

### Key practices

- Use `$ref` to share schemas and responses across endpoints — avoids duplication and inconsistency.
- Include `example` values for every field and response — tools like Redoc and Swagger UI display these prominently.
- Use `operationId` for every endpoint — SDK generators use this as the method name.
- Define security globally and override per-endpoint where needed.

## Endpoint documentation checklist

For each endpoint, document:

| Section | Required | Description |
|---|---|---|
| Summary | Yes | One-line description of what the endpoint does |
| Authentication | Yes | Which auth method and scopes are required |
| Request parameters | Yes | Path, query, header parameters with types |
| Request body | If applicable | Schema with field descriptions and examples |
| Success response | Yes | Status code, schema, and example body |
| Error responses | Yes | Every possible error status with code and description |
| Rate limiting | If applicable | Limits, headers, and retry guidance |
| Pagination | If applicable | Cursor/offset parameters and response format |
| Deprecation | If applicable | When deprecated, migration path, sunset date |

## Error documentation pattern

```markdown
### Error Responses

All errors follow this format:

| Field | Type | Description |
|---|---|---|
| error.code | string | Machine-readable error code |
| error.message | string | Human-readable description |
| error.details | array | Field-level validation errors (optional) |
| requestId | string | Correlation ID for support requests |

### Error Codes

| HTTP Status | Code | Description | Resolution |
|---|---|---|---|
| 400 | VALIDATION_ERROR | Request body failed validation | Check the `details` array for specific field errors |
| 401 | UNAUTHORIZED | Missing or expired auth token | Obtain a new token via POST /auth/login |
| 403 | FORBIDDEN | Token valid but insufficient permissions | Request additional scopes from your admin |
| 404 | NOT_FOUND | Resource does not exist | Verify the resource ID |
| 409 | CONFLICT | Resource already exists | Use GET to fetch existing resource or use PUT for upsert |
| 429 | RATE_LIMITED | Request limit exceeded | Wait for `Retry-After` seconds and retry |
| 500 | INTERNAL_ERROR | Unexpected server error | Retry with exponential backoff. Contact support with requestId if persistent |
```

- Document the `Resolution` column — it tells consumers what to do, not just what went wrong.
- Include the `requestId` field so consumers can reference it in support tickets.

## Pagination documentation

```markdown
### Pagination

This API uses cursor-based pagination. Include `cursor` and `limit` query parameters.

**Request:**
```
GET /api/users?limit=20&cursor=eyJpZCI6MTAwfQ==
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTIwfQ=="
  }
}
```

To fetch the next page, pass the `nextCursor` value as the `cursor` parameter.
When `hasMore` is `false`, you have reached the last page.
```

## API versioning documentation

Document the versioning strategy clearly:

```markdown
### API Versioning

This API uses URL path versioning: `/v1/`, `/v2/`.

- **Current version**: v1
- **Sunset policy**: Deprecated versions are supported for 12 months after the successor is released.
- **Breaking changes**: Only introduced in new major versions. Non-breaking additions (new fields, new endpoints) may be added to the current version.
- **Migration guides**: Published at `/docs/migration/v1-to-v2` before each major version release.
```

## AsyncAPI for event-driven APIs

```yaml
asyncapi: 3.0.0
info:
  title: Order Events
  version: 1.0.0
channels:
  orders/created:
    messages:
      orderCreated:
        payload:
          type: object
          properties:
            orderId:
              type: string
            customerId:
              type: string
            totalAmount:
              type: number
            createdAt:
              type: string
              format: date-time
```

- Use AsyncAPI for documenting webhooks, message queues, and event streams.
- Include payload schemas with the same rigor as REST request/response schemas.

## Documentation generation tools

| Tool | Input | Output | Best for |
|---|---|---|---|
| Redoc | OpenAPI YAML/JSON | Static HTML | Beautiful single-page API docs |
| Swagger UI | OpenAPI YAML/JSON | Interactive page | Try-it-out functionality |
| Stoplight | OpenAPI | Hosted portal | Team collaboration on API design |
| Docusaurus + plugin | OpenAPI | Static site pages | Integrated developer portal |
| Spectral | OpenAPI | Lint output | CI validation of spec quality |
