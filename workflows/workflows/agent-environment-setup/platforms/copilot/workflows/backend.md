---
command: "/backend"
description: "Drive backend architecture and implementation via backend specialist with API, data, and reliability focus."
triggers: ["backend", "api", "service", "database", "performance"]
---
# Backend Workflow

# CHANGED: routing contract — made workflow-to-agent and skill mapping explicit — prevents blind startup skill_search and keeps agent selection machine-readable.
# CHANGED: output contract — replaced human-readable bullets with structured payload fields — allows downstream agents to consume workflow output without re-asking for context.

## When to use
Use this when backend architecture or service logic is primary.

## Routing
- Primary specialist: `@backend-specialist`
- Add `@database-architect` for `schema`, `migration`, `query`, `index`, or `N+1` tasks.
- Add `@security-auditor` for `auth`, `jwt`, `oauth`, `rbac`, `session`, or `secrets`.

## Skill Routing
- Primary skills: `api-designer`, `nodejs-best-practices`
- Supporting skills (optional): `api-patterns`, `database-skills`, `secure-code-guardian`, `postman`
- Primary skill route:
  - api, endpoint, REST, route, openapi, swagger, spec, contract → `api-designer`
  - backend, service, middleware, hono, fastify, node → `nodejs-best-practices`
- Supporting skills:
  - schema, migration, query, index, performance, N+1 → `database-skills`
  - auth, jwt, rbac, oauth, session, secrets → `secure-code-guardian`
  - postman, collection, environment → `postman`
  - response format, pagination, versioning → `api-patterns`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Workflow steps
1. Ask specialist(s) for design and risk assessment.
2. Validate contracts, data model, and failure handling.
3. Implement backend changes with observability.
4. Always update API docs: OpenAPI spec, Swagger UI route, and Stoplight Elements route/component.
5. Run targeted tests and summarize rollout notes.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
BACKEND_WORKFLOW_RESULT:
  primary_agent_id: "backend-specialist"
  supporting_agent_ids: ["database-architect", "security-auditor"]
  primary_skill_ids: ["api-designer", "nodejs-best-practices"]
  supporting_skill_ids: ["api-patterns", "database-skills", "secure-code-guardian", "postman"]
  contract_changes:
    summary: "Describe contract deltas"
    openapi_spec_path: null
    swagger_ui_route: null
    stoplight_route_or_component: null
  data_impact:
    migration_required: false
    migration_notes: null
  reliability_and_security:
    observability_notes: "Summarize logging, tracing, metrics, and alerting impact"
    security_notes: "Summarize auth, validation, and sensitive-data impact"
  verification:
    checks_run: ["<command-or-test>"]
    gaps: []
  next_handoff:
    plan_handoff: null
```
