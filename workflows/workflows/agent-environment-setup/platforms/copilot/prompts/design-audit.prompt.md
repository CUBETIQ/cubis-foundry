# Workflow Prompt: /design-audit

Audit an existing interface against the design engine, token language, accessibility, and anti-generic UI constraints.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `frontend-design`, `frontend-design-core`, `frontend-design-style-selector`, `frontend-design-mobile-patterns`, `code-review`.
- Local skill file hints if installed: `.github/skills/frontend-design/SKILL.md`, `.github/skills/frontend-design-core/SKILL.md`, `.github/skills/frontend-design-style-selector/SKILL.md`, `.github/skills/frontend-design-mobile-patterns/SKILL.md`, `.github/skills/code-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Design Audit Workflow

## When to use

Use when an interface exists and needs a design-system, UX, or anti-slop audit before more implementation.

## Agent Chain

`explorer` -> `reviewer`

## Routing

1. **Explore**: `@explorer` inspects the target screens, existing tokens, and any relevant design-state docs.
2. **Review**: `@reviewer` evaluates visual direction, UX clarity, accessibility, and anti-generic design quality.
3. **Return**: `@reviewer` reports findings with concrete references to the current UI and design state.

## Skill Routing

- Primary skills: `frontend-design`, `frontend-design-core`
- Supporting skills (optional): `frontend-design-style-selector`, `frontend-design-mobile-patterns`, `code-review`

## Context notes

- Provide the target screen or app surface, the current quality concern, and whether the audit is visual, UX, or both.
- This route should point back to canonical design state or call out where design state is missing.

## Workflow steps

1. Explorer inspects the current interface, token usage, and relevant design state.
2. Reviewer evaluates visual direction, consistency, accessibility, and anti-generic design quality.
3. Reviewer reports concrete findings and recommends the next design or implementation route.

## Verification

- Findings reference the current design state or the absence of one.
- Distinctive design, consistency, accessibility, and component rhythm are all assessed.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: reviewer
  supporting_agents: [explorer]
  findings_count: <number>
  referenced_design_artifacts: [<path>] | []
  follow_up_items: [<string>] | []
```
