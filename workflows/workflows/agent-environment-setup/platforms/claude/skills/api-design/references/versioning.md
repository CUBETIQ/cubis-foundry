# API Versioning

## Versioning Strategies

### URL Path Versioning

```
/v1/users
/v2/users
```

| Pro | Con |
|-----|-----|
| Explicit, visible in logs and documentation | Multiple code paths or separate deployments |
| Easy to route at load balancer level | URL pollution (version in every path) |
| Simple for clients to understand | Hard to version individual endpoints |

Best for: Public APIs, REST APIs, large version increments.

### Header-Based Versioning

```
GET /users
Accept: application/vnd.myapp.v2+json
```

or custom header:
```
GET /users
API-Version: 2
```

| Pro | Con |
|-----|-----|
| Clean URLs | Invisible in browser, harder to test with curl |
| Can version individual endpoints | Requires client awareness |
| Easy to add without URL changes | Proxies may not forward custom headers |

Best for: Internal APIs, APIs where URL stability matters.

### Query Parameter Versioning

```
GET /users?version=2
```

| Pro | Con |
|-----|-----|
| Simple to implement | Easy to forget, optional parameter |
| Works with existing URL structure | Not RESTful (version is not a resource) |
| Easy to test | Caching may ignore query params |

Best for: Quick experiments, internal tools. Not recommended for production public APIs.

### Semantic Versioning for APIs

```
Major.Minor.Patch
2.1.3

Major: Breaking changes (new URL path version)
Minor: Backward-compatible additions (new fields, endpoints)
Patch: Bug fixes (no schema changes)
```

Clients should pin to a major version. Minor and patch changes are transparent.

## Backward Compatibility Rules

### Safe Changes (Non-Breaking)

| Change | Why it is safe |
|--------|---------------|
| Add new optional field to response | Existing clients ignore unknown fields |
| Add new endpoint | Existing clients do not call it |
| Add new optional query parameter | Existing requests work without it |
| Add new enum value | Existing clients default to handling unknown values |
| Widen a constraint (accept more input) | Existing valid input remains valid |
| Add new error code | Existing clients handle it as a generic error |

### Breaking Changes (Require New Version)

| Change | Why it breaks |
|--------|--------------|
| Remove a field from response | Clients expecting the field crash |
| Rename a field | Clients cannot find the field by name |
| Change field type (string to int) | Deserialization fails |
| Make an optional field required | Existing requests without the field fail |
| Change URL structure | Existing client URLs break |
| Remove an endpoint | Clients get 404 |
| Narrow a constraint (reject previously valid input) | Existing valid requests fail |
| Change error response format | Client error handling breaks |

### Handling Breaking Changes

When a breaking change is unavoidable:

1. **Introduce the new version** alongside the old one.
2. **Announce deprecation** with a timeline.
3. **Add Sunset headers** to the old version.
4. **Monitor traffic** on the old version.
5. **Migrate consumers** to the new version.
6. **Remove the old version** after the sunset date.

## Deprecation Process

### Deprecation Headers

```
Deprecation: true
Sunset: Sat, 01 Jun 2025 00:00:00 GMT
Link: <https://api.example.com/v2/users>; rel="successor-version"
```

| Header | Purpose |
|--------|---------|
| `Deprecation: true` | Signals that the endpoint is deprecated |
| `Sunset` | Date after which the endpoint may be removed |
| `Link: rel="successor-version"` | Points to the replacement endpoint |

### Deprecation Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| Announcement | 1 month before | Add deprecation headers, update documentation, notify consumers |
| Active deprecation | 3-6 months | Return deprecation warnings, log consumer usage, send reminders |
| Sunset | Target date | Return 410 Gone or redirect to new version |
| Removal | 1 month after sunset | Remove code, endpoints, and documentation |

### Consumer Tracking

Track which consumers use deprecated endpoints:

```json
{
  "deprecated_endpoint_usage": {
    "endpoint": "GET /v1/users",
    "consumers": [
      { "api_key": "key_abc", "last_called": "2025-03-01", "daily_calls": 15000 },
      { "api_key": "key_def", "last_called": "2025-02-28", "daily_calls": 500 }
    ],
    "sunset_date": "2025-06-01",
    "replacement": "GET /v2/users"
  }
}
```

Contact high-volume consumers directly before sunset.

## Migration Patterns

### Parallel Running

Run both versions simultaneously:

```
API Gateway
  ├── /v1/* → V1 Service (existing)
  └── /v2/* → V2 Service (new)
```

Both services may share the same database (if the schema is compatible) or have separate data stores with synchronization.

### Adapter Pattern

V2 endpoint internally translates to V1 logic during migration:

```
Client → V2 API → V2 Adapter → V1 Business Logic → Response
                       ↑
          Translates V2 request to V1 format
          Translates V1 response to V2 format
```

This allows shipping V2 immediately while migrating business logic gradually.

### Feature Flags for Gradual Migration

```
if (feature_flag("use_v2_user_service")) {
  return v2UserService.getUser(id);
} else {
  return v1UserService.getUser(id);
}
```

Roll out the new version to a percentage of traffic, monitor, and gradually increase.

## API Evolution Best Practices

### Design for Evolution from Day One

1. **Use envelopes.** Wrap responses in `{ "data": ..., "meta": ... }` so you can add pagination, links, or metadata later without breaking the data shape.

2. **Make all fields optional in requests.** Required fields cannot be removed later. Validate in business logic, not in the schema.

3. **Use string IDs, not integers.** String IDs accommodate format changes (UUID → ULID) without a breaking change.

4. **Version the schema, not just the URL.** Include a schema version in the response so clients can detect changes:
```json
{ "data": { ... }, "meta": { "schema_version": "2025-03-14" } }
```

5. **Document everything.** Every field, every endpoint, every error code. Undocumented behavior becomes a contract that clients depend on.

### Additive-Only Changes

The safest evolution strategy is additive-only:

```
V1 response:
{ "id": "123", "name": "Alice" }

V1.1 response (additive):
{ "id": "123", "name": "Alice", "email": "alice@example.com" }

V1.2 response (additive):
{ "id": "123", "name": "Alice", "email": "alice@example.com", "avatar_url": "..." }
```

Existing clients ignore new fields. No version bump needed.

### When Additive Is Not Enough

If you need to:
- Change a field's type or semantics
- Remove a field
- Restructure the response

Then create a new major version:
- `/v1/users` returns `{ "name": "Alice" }`
- `/v2/users` returns `{ "display_name": "Alice", "full_name": { "first": "Alice", "last": "Smith" } }`

## Testing Versioned APIs

### Contract Tests

For each API version:
1. Record the expected request/response as a contract.
2. Run the contract against the live API in CI.
3. If the contract breaks, the test fails.

### Compatibility Matrix

| Consumer | Producer v1 | Producer v2 |
|----------|------------|------------|
| Client v1 | Passes | Must pass (backward compatible) |
| Client v2 | May fail | Passes |

Test that all supported consumer versions work with the latest producer version.
