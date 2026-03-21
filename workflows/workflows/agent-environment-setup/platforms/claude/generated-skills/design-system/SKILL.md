---
name: design-system
description: "Establish or refresh canonical design state, token language, overlays, and Stitch compatibility before implementation."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "design-system"
  platform: "Claude Code"
  command: "/design-system"
compatibility: Claude Code
---
# Design System Workflow
## When to use

Use when the project needs a durable design foundation before screen generation or implementation.

## Agent Chain

`explorer` -> `planner` -> `implementer`

## Routing

1. **Explore**: `@explorer` reads current UI code, tokens, brand cues, and platform constraints.
2. **Plan**: `@planner` chooses the design direction and the required design-state files.
3. **Implement**: `@implementer` writes or refreshes `docs/foundation/DESIGN.md`, overlays, and the Stitch mirror when needed.

## Skill Routing

- Primary skills: `frontend-design`, `frontend-design-core`, `frontend-design-style-selector`, `frontend-design-system`
- Supporting skills (optional): `frontend-design-mobile-patterns`, `stitch-design-system`, `tech-doc`

## Context notes

- Provide the target product surface, intended audience, and any existing brand or token constraints.
- This route should refresh canonical design state before downstream screen generation or implementation.

## Workflow steps

1. Explorer surveys the current UI code, tokens, and existing design documents.
2. Planner chooses the visual direction and identifies which canonical docs or overlays need refresh.
3. Implementer writes or updates `docs/foundation/DESIGN.md`, overlays, and the Stitch mirror when needed.
4. The route returns the refreshed design state and the next recommended design or implementation step.

## Verification

- `docs/foundation/DESIGN.md` exists and is coherent.
- Overlays exist only when scoped detail is actually needed.
- `.stitch/DESIGN.md` is synchronized when Stitch work is in scope.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner]
  design_artifacts: [docs/foundation/DESIGN.md]
  overlays_updated: [<path>] | []
  stitch_mirror_updated: <true|false>
  follow_up_items: [<string>] | []
```