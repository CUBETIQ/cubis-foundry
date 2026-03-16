# Foundry Detail Reference

## tiered-routing

### Direct skill shortcuts

| Signal | Primary skill | Supporting skill |
| --- | --- | --- |
| openapi, swagger, REST design, contract | `api-designer` | — |
| api, route, endpoint, middleware, hono, fastify | `nodejs-best-practices` | `api-patterns` |
| schema, migration, drizzle, query, index, N+1 | `database-skills` | `api-patterns` |
| auth, jwt, oauth, rbac, session, secrets | `secure-code-guardian` | `nodejs-best-practices` |
| postman, collection, newman, environment | `postman` | `api-designer` |
| stitch, design-to-code, screen-to-code, ui diff, sync screen | `stitch` | `frontend-design` |
| create skill, update skill, fix skill metadata, repair references | `skill-creator` | — |

### Routing policy

- Classify the request before any MCP call.
- Prefer one route, one primary agent, and one primary skill.
- Search only once and only when the exact skill ID is unclear.
- If search returns nothing, continue with local repo evidence and note the gap if relevant.

## plan-handoff-and-execution

### PLAN_HANDOFF schema

```yaml
PLAN_HANDOFF:
  tasks:
    - id: 1
      title: "Define API contract"
      domain: api-design
      skill_hint: api-designer
      depends_on: []
      output_artifact: openapi/service.yaml
      stop_if_failed: true
  shared_context:
    stack: "Hono · Drizzle · Neon · TypeScript"
    constraints: "Edge-ready, parameterized queries only"
    active_files: ["src/", "db/", "openapi/"]
  execution_mode: sequential
  loaded_skills: [api-designer]
  stop_conditions:
    - "output_artifact missing AND stop_if_failed: true"
    - "destructive or irreversible action not in plan"
    - "required skill missing after 1 skill_search attempt"
    - "explicit user pause or redirect"
```

### EXECUTION_SUMMARY schema

```yaml
EXECUTION_SUMMARY:
  completed: [1, 2]
  skipped: []
  stopped_at: null
  stop_reason: null
  artifacts:
    - task_id: 1
      artifact: openapi/service.yaml
  skills_used: [api-designer, nodejs-best-practices]
  dropped: []
```
