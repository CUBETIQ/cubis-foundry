---
name: design-audit
description: "Audit an existing interface against the design engine, token language, accessibility, and anti-generic UI constraints."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "design-audit"
  platform: "Codex"
  command: "/design-audit"
compatibility: Codex
---
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