---
name: orchestrate
description: "Coordinate multiple specialist agents to solve complex, cross-domain tasks. The orchestrator decomposes work, delegates to specialists, validates deliverables, and integrates results."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "orchestrate"
  platform: "Claude Code"
  command: "/orchestrate"
compatibility: Claude Code
---
# Orchestrate Workflow
## When to use

Use when a task spans multiple domains (backend + frontend, database + API, security + deployment) and requires coordinated specialist work with validation between steps.

## Agent Chain

`orchestrator` → delegates to specialists as needed

## Routing

- **Coordinator**: `@orchestrator`
- Specialist routing determined by task decomposition
- Orchestrator selects agents from: `@explorer`, `@planner`, `@implementer`, `@reviewer`, `@debugger`, `@tester`, `@security-reviewer`, `@docs-writer`, `@devops`, `@database-specialist`, `@frontend-specialist`

## Skill Routing

- Primary skills: `system-design`, `prompt-engineering`
- Supporting skills (optional): `api-design`, `database-design`, `deep-research`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the full task description, constraints, acceptance criteria, and relevant context when starting.

## Workflow steps

1. Analyze the task and identify domains involved.
2. Decompose into discrete work items with acceptance criteria.
3. Identify dependencies and determine execution order.
4. Delegate each item to the best specialist with full context.
5. Validate each deliverable against acceptance criteria.
6. Iterate on failures with specific feedback (max 3 rounds).
7. Integrate outputs, verify cross-task consistency, and report.

## Verification

- All sub-tasks completed and validated against acceptance criteria.
- Cross-domain consistency verified.
- No unresolved blockers or failed validations.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: orchestrator
  sub_tasks_completed: [<string>]
  sub_tasks_failed: [<string>] | []
  cross_domain_consistency: <pass|fail>
  follow_up_items: [<string>] | []
```