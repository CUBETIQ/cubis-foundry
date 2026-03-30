---
command: "/design-system"
description: "Establish or refresh canonical design state, token language, and overlays before implementation."
triggers: ["design-system", "design language", "token system", "design tokens", "theme system", "design foundation"]
---

# Design System Workflow

## When to use

Use when the project needs a durable design foundation before screen generation or implementation.

## Agent Chain

`explorer` -> `planner` -> `implementer`

## Routing

1. **Explore**: `@explorer` reads current UI code, tokens, brand cues, and platform constraints.
2. **Plan**: `@planner` chooses the design direction and the required design-state files.
3. **Implement**: `@implementer` writes or refreshes `docs/foundation/DESIGN.md` and overlays when needed.

## Skill Routing

- Primary skills: `design`, `web-ui-design`
- Supporting skills (optional): `mobile-ui-design`, `design-system`, `tech-doc`

## Context notes

- Provide the target product surface, intended audience, and any existing brand or token constraints.
- This route should refresh canonical design state before downstream screen generation or implementation.

## Workflow steps

1. Explorer surveys the current UI code, tokens, and existing design documents.
2. Planner chooses the visual direction and identifies which canonical docs or overlays need refresh.
3. Implementer writes or updates `docs/foundation/DESIGN.md` and overlays when needed.
4. The route returns the refreshed design state and the next recommended design or implementation step.

## Verification

- `docs/foundation/DESIGN.md` exists and is coherent.
- Overlays exist only when scoped detail is actually needed.
- Downstream design consumers can read canonical state from `docs/foundation/DESIGN.md` and any scoped overlays.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner]
  design_artifacts: [docs/foundation/DESIGN.md]
  overlays_updated: [<path>] | []
  follow_up_items: [<string>] | []
```
