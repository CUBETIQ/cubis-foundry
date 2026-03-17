---
name: backend
description: "Drive backend architecture, API operations, and Postman-oriented execution with API, data, and reliability focus."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "backend"
  platform: "Claude Code"
  command: "/backend"
compatibility: Claude Code
---
# backend Workflow
# Backend Workflow

## When to use

Use this for backend architecture, API design, service implementation, or Postman-oriented API operations.

## Routing

- Primary specialist: `@backend-specialist`
- Database support: `@database-architect`
- Security review: `@security-auditor`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach API specifications, schema diagrams, Postman collections, and relevant service code.
- Read `ENGINEERING_RULES.md` and `TECH.md` before changing service boundaries or shared backend structure.

## Skill Routing

- Primary skills: `api-design`, `api-patterns`, `nodejs-best-practices`
- Supporting skills (optional): `auth-architect`, `database-design`, `database-design`, `nestjs-expert`, `fastapi-expert`, `graphql-architect`, `microservices-architect`, `drizzle-expert`, `firebase`, `stripe-best-practices`, `serverless-patterns`, `i18n-localization`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `api-design` for API contract work and `nodejs-best-practices` for Node.js services. Add framework-specific skill when applicable.

## Workflow steps

1. Clarify API contracts and data model requirements.
2. Design or review schema and service boundaries.
3. Implement backend logic with proper error handling and validation.
4. Write integration tests covering happy path and error cases.
5. Review for security, performance, and reliability.
6. Set `doc_impact` if the change alters service boundaries, shared contracts, or operational shape.

## Verification

- API contracts match specification.
- All endpoints have input validation and error handling.
- Integration tests cover happy path and key error cases.
- No N+1 queries or unindexed access patterns.
- Auth applied correctly to protected endpoints.

## Output Contract

```yaml
BACKEND_WORKFLOW_RESULT:
  primary_agent: backend-specialist
  supporting_agents: [database-architect?, security-auditor?, test-engineer?]
  primary_skills: [api-design, api-patterns, nodejs-best-practices]
  supporting_skills: [auth-architect?, database-design?, <framework-skill>?]
  api_changes:
    endpoints_created: [<string>] | []
    endpoints_modified: [<string>] | []
    schema_changes: [<string>] | []
  implementation:
    files_changed: [<path>]
    tests_added: [<path>]
  doc_impact: none | tech | rules | both
  verification:
    checks_run: [<command-or-test>]
    evidence: [<string>]
  follow_up_items: [<string>] | []
```