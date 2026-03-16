---
command: "/plan"
description: "Build a decision-complete implementation plan with interfaces, failure modes, and acceptance criteria."
triggers:
  [
    "plan",
    "spec",
    "design",
    "roadmap",
    "acceptance",
    "brainstorm",
    "idea",
    "options",
    "tradeoff",
    "approach",
  ]
---

# Plan Workflow

## When to use

Use this when starting a new feature, project, or significant change that needs a structured implementation plan before coding begins.

## Routing

- Primary coordinator: `@project-planner`
- Architecture support: `@orchestrator`
- Domain validation: `@backend-specialist`, `@frontend-specialist`, `@database-architect`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the feature request, problem statement, constraints, and any existing design documents.

## Skill Routing

- Primary skills: `architecture-designer`, `api-designer`
- Supporting skills (optional): `database-skills`, `deep-research`, `mcp-builder`, `openai-docs`, `prompt-engineer`, `skill-creator`
- Start with `architecture-designer` for system design and `api-designer` for API contracts. Add `database-skills` when data modeling is central, `deep-research` when fresh external knowledge or public comparison is needed.

## Workflow steps

1. Clarify scope, success criteria, and constraints.
2. Research existing patterns and dependencies, starting in-repo and escalating to `deep-research` only when outside evidence is required.
3. Decompose into tasks with ownership and dependencies.
4. Define interfaces, contracts, and failure modes.
5. Produce acceptance criteria for each milestone.
6. Identify risks, unknowns, and mitigation strategies.

## Verification

- Every task has an owner, acceptance criteria, and verification approach.
- Dependencies form a valid DAG with no cycles.
- Risk assessment covers top 3 failure scenarios.
- Plan reviewed against existing codebase conventions.

## Output Contract

```yaml
PLAN_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [orchestrator?, backend-specialist?, frontend-specialist?, database-architect?]
  primary_skills: [architecture-designer, api-designer]
  supporting_skills: [database-skills?, deep-research?, mcp-builder?]
  plan:
    scope_summary: <string>
    tasks:
      - id: <task-id>
        description: <string>
        owner: <agent-name>
        dependencies: [<task-id>]
        acceptance_criteria: [<string>]
    interfaces: [<string>]
    risks: [<string>]
    milestones: [<string>]
  follow_up_items: [<string>] | []
```
