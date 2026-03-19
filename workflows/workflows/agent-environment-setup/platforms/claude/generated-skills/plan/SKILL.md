---
name: plan
description: "Research a codebase and produce a structured implementation plan. Explores first, then designs, following the 'understand before building' principle."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "plan"
  platform: "Claude Code"
  command: "/plan"
compatibility: Claude Code
---
# Plan Workflow
## When to use

Use when you need to understand a codebase area and create an actionable implementation plan before writing code. Best for architecture decisions, feature scoping, and implementation planning.

## Agent Chain

`explorer` → `planner` → `orchestrator`

## Routing

1. **Explore**: `@explorer` surveys the relevant codebase area — maps files, reads key modules, identifies patterns and constraints.
2. **Plan**: `@planner` takes exploration findings and produces a structured implementation plan with steps, testing criteria, and risks.
3. **Return**: `@orchestrator` receives the plan for delegation or approval.

## Skill Routing

- Primary skills: `spec-driven-delivery`, `system-design`
- Supporting skills (optional): `deep-research`

## Context notes

- Provide the task requirements, constraints, and any relevant background.
- The planner will record project-level observations to memory for future reference.

## Workflow steps

1. Explorer reads the task requirements and identifies relevant codebase areas.
2. Explorer produces a structured findings report (key files, architecture, observations).
3. Planner takes findings and produces an implementation plan (goal, steps, tests, risks).
4. Orchestrator reviews the plan and routes to implementation or requests revisions.

## Verification

- Plan references actual file paths and patterns from the codebase.
- Implementation steps are specific enough to execute without ambiguity.
- Testing criteria and risks are identified.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: planner
  supporting_agents: [explorer]
  plan_sections: [goal, context, design_decisions, implementation_steps, testing_criteria, risks]
  follow_up_items: [<string>] | []
```