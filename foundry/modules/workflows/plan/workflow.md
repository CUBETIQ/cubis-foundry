---
name: plan
command: "/plan"
description: Research the relevant codebase surface and produce a structured implementation plan before writing code.
triggers:
  - plan
  - scope
  - design
  - architecture
  - rfc
agentChain:
  - explorer
  - planner
  - orchestrator
primarySkills:
  - spec-driven-delivery
  - system-design
supportingSkills:
  - deep-research
whenToUse: "When a task is non-trivial and needs repo context, scoped tasks, and verification criteria before implementation."
priority: high
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Plan Workflow

## What this workflow does

Explores the repository, identifies the affected surfaces, and turns the request into an execution-ready plan with acceptance checks.

## When to use

Use this for architecture changes, broad refactors, new features, or any task where implementation should not begin from guesswork.

## Agent chain

`explorer -> planner -> orchestrator`

## Step details

1. `explorer` maps the relevant code and docs.
2. `planner` turns the findings into ordered tasks with verification.
3. `orchestrator` reviews the plan, trims unnecessary work, and returns the route.

## Skill routing

- `spec-driven-delivery` for Git-backed task packs and traceability
- `system-design` for architectural trade-offs
- `deep-research` only when external evidence is required

## Context notes

Provide the goal, constraints, deadline pressure, and any files or plans that already exist.

## Verification

The result should include clear scope, ordered tasks, known risks, and explicit verification per task.

## Output contract

```yaml
PLAN_WORKFLOW_RESULT:
  summary: <goal and scope>
  tasks:
    - id: T1
      step: <task>
      verification: <check>
  risks:
    - <risk>
  next_route: /implement
```

## Follow-up items

Typical next step: `/implement`
