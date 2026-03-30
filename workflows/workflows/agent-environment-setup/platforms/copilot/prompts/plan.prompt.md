# Workflow Prompt: /plan

Research the relevant codebase surface and produce a structured implementation plan before writing code.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `spec-driven-delivery`, `system-design`, `deep-research`.
- Local skill file hints if installed: `.github/skills/spec-driven-delivery/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/deep-research/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
