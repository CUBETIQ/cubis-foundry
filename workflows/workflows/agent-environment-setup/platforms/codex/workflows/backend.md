---
command: "/backend"
description: "Drive backend architecture, API operations, and Postman-oriented execution with API, data, and reliability focus."
triggers:
  [
    "backend",
    "api",
    "service",
    "database",
    "performance",
    "postman",
    "collection",
    "workspace",
    "environment",
    "runcollection",
    "monitor",
    "mock",
    "api test",
  ]
---

# Backend Workflow

## When to use

Use this for backend architecture, API design, service implementation, or Postman-oriented API operations.

## Routing

- Primary specialist: `the backend-specialist posture`
- Database support: `the database-architect posture`
- Security review: `the security-auditor posture`
- Verification support: `the test-engineer posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach API specifications, schema diagrams, Postman collections, and relevant service code.
- Read `ENGINEERING_RULES.md` and `TECH.md` before changing service boundaries or shared backend structure.

## Skill Routing

- Primary skills: `api-design`, `api-design`, `javascript-best-practices`
- Supporting skills (optional): `owasp-security-review`, `database-design`, `database-design`, `nestjs`, `fastapi`, `api-design`, `microservices-design`, `drizzle-orm`, `database-design`, `stripe-integration`, `ci-cd-pipeline`, `frontend-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`
- Start with `api-design` for API contract work and `javascript-best-practices` for Node.js services. Add framework-specific skill when applicable.

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
  primary_skills: [api-design, api-design, javascript-best-practices]
  supporting_skills: [owasp-security-review?, database-design?, <framework-skill>?]
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

> **Codex note:** Prefer native Codex delegation when the host exposes it. Otherwise follow AGENTS.md specialist postures inline while keeping the same routing and verification contract.
