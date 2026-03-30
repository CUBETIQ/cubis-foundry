---
command: "/design-refresh"
description: "Refresh design state and implementation surfaces after product direction, design tokens, or major UI structure changes."
triggers: ["design refresh", "refresh design", "refresh tokens", "update design system", "design drift"]
---

# Design Refresh Workflow

## When to use

Use when the product direction changed and the design system or overlays need a coordinated refresh.

## Agent Chain

`explorer` -> `planner` -> `implementer` -> `reviewer`

## Routing

1. **Explore**: `@explorer` finds the current design docs, overlays, and implementation surfaces touched by the direction change.
2. **Plan**: `@planner` decides what must be refreshed and what can stay stable.
3. **Implement**: `@implementer` updates canonical design state and overlays.
4. **Review**: `@reviewer` checks that the refreshed design state is coherent and ready for downstream implementation.

## Skill Routing

- Primary skills: `design`, `web-ui-design`, `design-system`
- Supporting skills (optional): `mobile-ui-design`, `tech-doc`

## Context notes

- Provide what changed in product direction or UI structure and which downstream surfaces are now stale.
- This route refreshes design state; it should not silently skip dependent overlays.

## Workflow steps

1. Explorer finds the current design docs, overlays, and implementation surfaces touched by the direction change.
2. Planner decides what must be refreshed and what can stay stable.
3. Implementer updates canonical design state and overlays.
4. Reviewer checks that the refreshed design state is coherent and ready for downstream implementation.

## Verification

- Canonical design state and overlays are updated together.
- Downstream design consumers are told what changed.
- Downstream consumers are told which canonical artifacts changed.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner, reviewer]
  refreshed_artifacts: [<path>]
  follow_up_items: [<string>] | []
```
