---
command: "/backend"
description: "Route backend-focused tasks to the backend specialist with API, data, and reliability focus."
triggers: ["backend", "api", "service", "database", "performance"]
---
# Backend Workflow

Use this workflow when backend architecture or implementation is primary.

## Routing
- Primary specialist: `@backend-specialist`

## Steps
1. Ask `@backend-specialist` for solution outline.
2. Validate API contracts, data model, and failure handling.
3. Implement backend changes with tests and observability.
4. Always update API docs: OpenAPI spec, Swagger UI route, and Stoplight Elements route/component.
5. Return summary including migration and rollout notes.

## Output Contract
- API/contract changes
- OpenAPI spec path
- Swagger UI route
- Stoplight route/component status
- Migration impact
- Reliability/security notes
- Verification evidence
