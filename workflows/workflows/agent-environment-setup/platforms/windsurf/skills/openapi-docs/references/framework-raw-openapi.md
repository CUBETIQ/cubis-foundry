# Raw OpenAPI (Spec-First) Guidance

## Core Patterns

- Keep a single `openapi.yaml` or `openapi.json`
- Reuse components for schemas and security
- Validate requests using an OpenAPI-aware validator

## Example Checklist

- Define tags and operationIds for all endpoints
- Use consistent error schema across operations
- Add examples for request/response bodies
- Expose spec and Stoplight UI endpoints
