---
command: "/plan"
description: "Build a decision-complete implementation plan with interfaces, failure modes, and acceptance criteria."
triggers:
  [
    "plan",
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

- Primary coordinator: `.agent/agents/project-planner`
- Architecture support: `.agent/agents/orchestrator`
- Domain validation: `.agent/agents/backend-specialist`, `.agent/agents/frontend-specialist`, `.agent/agents/database-architect`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the feature request, problem statement, constraints, and any existing design documents.
- Read `ENGINEERING_RULES.md` first and `TECH.md` next when they exist before finalizing a non-trivial plan.
- Reuse an existing `docs/specs/<spec-id>/` pack when the change already has one instead of creating a parallel planning track.

## Skill Routing

- Primary skills: `system-design`, `api-design`
- Supporting skills (optional): `database-design`, `deep-research`, `mcp-server-builder`, `tech-doc`, `prompt-engineering`, `skill-creator`
- Start with `system-design` for system design and `api-design` for API contracts. Add `database-design` when data modeling is central, `deep-research` when fresh external knowledge or public comparison is needed.

## Workflow steps

1. Clarify scope, success criteria, and constraints.
2. Research existing patterns and dependencies, starting in-repo and escalating to `deep-research` only when outside evidence is required.
3. Decompose into tasks with ownership and dependencies.
4. Define interfaces, contracts, and failure modes.
5. Produce acceptance criteria for each milestone.
6. Record `architecture_impact`, `doc_impact`, and `traceability_status` when the work is non-trivial.
7. Identify risks, unknowns, and mitigation strategies.

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
  primary_skills: [system-design, api-design]
  supporting_skills: [database-design?, deep-research?, mcp-server-builder?]
  spec_id: <string> | null
  spec_root: docs/specs/<spec-id> | null
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
  architecture_impact:
    summary: <string>
    affects_structure: true | false
    affects_design_system: true | false
  doc_impact: none | tech | rules | both
  traceability_status: complete | partial | blocked
  follow_up_items: [<string>] | []
```

> **Antigravity note:** Use Agent Manager for parallel agent coordination. Workflow files are stored under `.agent/workflows/`.
