---
command: "/plan"
description: "Build a decision-complete implementation plan with interfaces, failure modes, and acceptance criteria."
triggers: ["plan", "spec", "design", "roadmap", "acceptance", "brainstorm", "idea", "options", "tradeoff", "approach"]
---
# Plan Workflow

# CHANGED: output contract — upgraded to canonical PLAN_HANDOFF schema — lets implementation agents continue task 1→N without re-routing or user restatement.
# CHANGED: skill routing — added `skill-creator` as a planning support skill for skill package design and maintenance work.

## When to use
Use this when execution needs a stable specification.

## Routing
- Primary specialist: `@project-planner`
- Scope clarification: `@product-manager`
- Architecture review: `@backend-specialist`
- Verification planning: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `architecture-designer`, `skill-creator`
- Supporting skills (optional): `api-designer`, `api-patterns`, `database-skills`, `database-design`, `database-optimizer`, `drizzle-expert`, `firebase`, `deep-research`, `mcp-builder`, `agentic-eval`, `openai-docs`, `prompt-engineer`, `microservices-architect`, `nodejs-best-practices`, `nestjs-expert`, `fastapi-expert`, `graphql-architect`, `react-expert`, `nextjs-developer`, `tailwind-patterns`, `frontend-design`, `design-system-builder`, `web-perf`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`
- Use `architecture-designer` for system-shape, interface, and boundary planning; use `skill-creator` for skill-catalog planning. Add `deep-research` when public evidence or latest-source verification matters, `mcp-builder` for MCP server design, `agentic-eval` for benchmark or rubric planning, `openai-docs` for OpenAI-specific latest-doc work, `prompt-engineer` for instruction quality review, and the narrowest domain specialist first when the plan already has a clear implementation surface.

## Workflow steps
1. Lock scope and non-goals.
2. Define architecture, boundaries, and data flow.
3. Specify interfaces and validation rules.
4. Document failure modes and mitigations.
5. Define tests and release acceptance criteria.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
PLAN_HANDOFF:
  tasks:
    - id: 1
      title: "Describe the first implementation task"
      domain: "backend"
      skill_hint: "api-designer"
      depends_on: []
      output_artifact: "path-or-artifact"
      stop_if_failed: true
  shared_context:
    stack: "Describe the target stack"
    constraints: "List hard requirements and guardrails"
    active_files: ["path-or-artifact"]
  execution_mode: "sequential"
  loaded_skills: ["api-designer"]
  stop_conditions:
    - "output_artifact missing AND stop_if_failed: true"
    - "destructive or irreversible action not in plan"
    - "required skill missing after 1 skill_search attempt"
    - "explicit user pause or redirect"
```
