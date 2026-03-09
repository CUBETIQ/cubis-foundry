---
command: "/create"
description: "Implement feature work with minimal blast radius and clear verification checkpoints."
triggers: ["create", "build", "implement", "feature", "develop"]
---
# Create Workflow

# CHANGED: routing — added explicit implementation owners by domain — prevents fallback routing and clarifies which specialist leads execution.
# CHANGED: output contract — converted free-form bullets into structured YAML — makes create results consumable by downstream workflows.
# CHANGED: skill routing — added `skill-creator` as the canonical support skill for skill package work — lets skill creation and repair route cleanly without blind startup search.

## When to use
Use this for net-new implementation after design is stable.

## Routing
- Primary coordinator: `@orchestrator`
- Backend implementation: `@backend-specialist`
- Frontend implementation: `@frontend-specialist`
- Mobile implementation: `@mobile-developer`
- Verification support: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`
- Supporting skills (optional): `api-designer`, `api-patterns`, `nodejs-best-practices`, `nestjs-expert`, `fastapi-expert`, `graphql-architect`, `react-expert`, `nextjs-developer`, `tailwind-patterns`, `frontend-design`, `design-system-builder`, `web-perf`, `skill-creator`
- Pick one primary language skill from repo signals or touched files. Add the narrowest restored specialist only when the feature is clearly backend or frontend framework-specific. Use `skill-creator` only for canonical skill-package creation or repair.

## Workflow steps
1. Confirm target files and contracts.
2. Implement smallest coherent increment.
3. Validate behavior with focused tests.
4. Capture remaining gaps and follow-ups.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
CREATE_WORKFLOW_RESULT:
  primary_agent_id: "orchestrator"
  supporting_agent_ids: ["backend-specialist", "frontend-specialist", "mobile-developer", "test-engineer"]
  primary_skill_ids: ["<dominant-language-skill>"]
  supporting_skill_ids: ["api-designer?", "api-patterns?", "nodejs-best-practices?", "nestjs-expert?", "fastapi-expert?", "graphql-architect?", "react-expert?", "nextjs-developer?", "tailwind-patterns?", "frontend-design?", "design-system-builder?", "web-perf?", "webapp-testing?", "playwright-e2e?", "skill-creator?"]
  implemented_scope:
    summary: "Describe the implemented increment"
    changed_artifacts: ["<path-or-artifact>"]
  behavioral_impact: ["Describe user-visible or system-level changes"]
  verification:
    checks_run: ["<command-or-test>"]
    evidence: ["Describe the strongest verification evidence"]
    gaps: []
  follow_up_items: []
  next_handoff:
    plan_handoff: null
```
