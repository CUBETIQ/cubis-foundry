# Workflow Prompt: /plan

Research a codebase and produce a structured implementation plan. Explores first, then designs, following the 'understand before building' principle.

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
