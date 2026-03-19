# Workflow Prompt: /orchestrate

Coordinate multiple specialist agents to solve complex, cross-domain tasks. The orchestrator decomposes work, delegates to specialists, validates deliverables, and integrates results.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `system-design`, `prompt-engineering`, `api-design`, `database-design`, `deep-research`.
- Local skill file hints if installed: `.github/skills/system-design/SKILL.md`, `.github/skills/prompt-engineering/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/deep-research/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
