# FastAPI OpenAPI Guidance

## Core Patterns

- Use Pydantic models for request/response schemas
- Use `response_model` for output typing and docs
- Use `status_code` on route decorators
- Use dependency injection for auth headers

## Example Checklist

- Define `BaseModel` for request/response
- Add examples via `Field(..., example=...)`
- Document security scheme with `HTTPBearer` or `APIKeyHeader`
- Add tags on routes for grouping

## Notes

- FastAPI auto-generates OpenAPI 3.1 in recent versions; verify version
- Use `openapi_url` and `docs_url` to expose spec and UI routes
