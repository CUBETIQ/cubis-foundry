---
command: "/backend"
description: "Drive backend architecture and implementation via backend specialist with API, data, and reliability focus."
triggers: ["backend", "api", "service", "database", "performance"]
---
# Backend Workflow

Use this when backend architecture or service logic is primary.

## Routing
- Primary specialist: `@backend-specialist`
- Add `@database-architect` for schema/query changes.
- Add `@security-auditor` when auth, secrets, or sensitive data are involved.

## Steps
1. Ask specialist(s) for design and risk assessment.
2. Validate contracts, data model, and failure handling.
3. Implement backend changes with observability.
4. Always update API docs: OpenAPI spec, Swagger UI route, and Stoplight Elements route/component.
5. Run targeted tests and summarize rollout notes.

## Output Contract
- API/contract changes
- OpenAPI spec path
- Swagger UI route
- Stoplight route/component status
- Migration impact
- Reliability/security notes
- Verification evidence
