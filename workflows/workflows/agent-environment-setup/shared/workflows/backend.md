---
command: "/backend"
description: "Drive backend architecture, API operations, and Postman-oriented execution with API, data, and reliability focus."
triggers: ["backend", "api", "service", "database", "performance", "postman", "collection", "workspace", "environment", "runcollection", "monitor", "mock", "api test"]
---
# Backend Workflow

# CHANGED: routing contract — made workflow-to-agent and skill mapping explicit — prevents blind startup skill_search and keeps agent selection machine-readable.
# CHANGED: output contract — replaced human-readable bullets with structured payload fields — allows downstream agents to consume workflow output without re-asking for context.

## When to use
Use this when backend architecture, service logic, API contract work, or Postman/API client execution is primary.

## Routing
- Primary specialist: `@backend-specialist`
- Add `@database-architect` for `schema`, `migration`, `query`, `index`, or `N+1` tasks.
- Add `@security-auditor` for `auth`, `jwt`, `oauth`, `rbac`, `session`, or `secrets`.
- Add `@test-engineer` when collection assertions, regression coverage, or monitor validation is part of the task.

## Skill Routing
- Primary skills: `api-designer`, `nodejs-best-practices`
- Supporting skills (optional): `api-patterns`, `architecture-designer`, `auth-architect`, `database-skills`, `database-design`, `database-optimizer`, `drizzle-expert`, `firebase`, `microservices-architect`, `nestjs-expert`, `fastapi-expert`, `graphql-architect`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `skill-creator`
- Load `api-designer` when contract shape, pagination, versioning, or error semantics are primary. Use `api-patterns` for transport-pattern tradeoffs and standard envelopes, `nodejs-best-practices` for general Node service structure, `nestjs-expert` for modular Nest backends, `fastapi-expert` for async Python/FastAPI services, and `graphql-architect` when schema and resolver design are the real problem. Bring in `auth-architect` when sessions, tokens, OAuth, passkeys, RBAC, tenant isolation, or service credentials are the real decision surface. Bring in `database-skills` for schema/query-heavy backend work, `database-design` for migration-heavy changes, `database-optimizer` for plan or index triage, `drizzle-expert` when the TypeScript access layer is the real bottleneck, `firebase` when platform-coupled Firebase behavior changes the answer, and `microservices-architect` only when service-boundary decisions are active. Keep the matching language skill as a secondary aid and reserve `skill-creator` for skill-package work.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Workflow steps
1. Classify whether the task is code-path implementation, API contract work, or Postman/client operations.
2. Validate contracts, data model, identifiers, and failure handling.
3. Implement backend changes or execute Postman actions with explicit IDs and context.
4. Update docs or collection artifacts when the request changes API behavior.
5. Run targeted validation and summarize rollout or follow-up notes.

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
  supporting_skill_ids: ["api-patterns", "auth-architect", "database-skills", "database-design", "database-optimizer", "drizzle-expert?", "firebase?"]
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
