# Express OpenAPI Guidance

## Core Patterns

- Maintain a source OpenAPI file (YAML/JSON) or generate via schema tools
- Validate requests with a middleware (zod, joi, ajv)
- Ensure validation and docs stay in sync

## Options

- Code-first: Zod/OpenAPI registry or tsoa
- Spec-first: Handwritten OpenAPI with request validation middleware

## Example Checklist

- Centralize schemas for reuse
- Add standard error responses across routes
- Document auth headers explicitly
- Serve `/openapi.json` and Stoplight UI at `/docs`
