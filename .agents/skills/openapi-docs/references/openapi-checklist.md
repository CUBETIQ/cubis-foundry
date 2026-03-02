# OpenAPI Checklist (3.1)

## Spec Metadata

- `openapi: 3.1.0`
- `info`: title, version, description, contact
- `servers`: local + staging/prod when available
- `tags`: used by all documented routes

## Security & Headers

- Add `components.securitySchemes` for auth headers
- Use `security` at global or route level
- All required headers appear in `request.headers`
- Header keys are lowercase

## Schemas

- Use the framework’s component registration mechanism (FastAPI Pydantic models, NestJS `@ApiProperty`, Express+zod/openapi registry, etc.)
- Provide examples for request/response schemas
- Prefer shared schemas for errors

## Operations

- `summary` and `description` on every operation
- Responses: `200/201`, plus `400/401/403/404/500` as appropriate
- `request.body.required: true` if Content-Type is mandatory

## Consistency

- Types and descriptions match actual validation
- IDs and formats align with persistence (UUID vs ObjectId)
- No unused tags or components
