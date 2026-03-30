---
command: "/design-screen"
description: "Resolve the design engine first, produce a high-signal screen brief, then hand off to design generation or implementation."
triggers: ["design screen", "screen design", "ui design", "ux design", "landing page design", "mobile screen", "redesign ui"]
---

# Design Screen Workflow

## When to use

Use when the task is about shaping a concrete page or screen, especially before design generation or implementation.

## Agent Chain

`explorer` -> `planner` -> `implementer`

## Routing

1. **Explore**: `@explorer` reads the current product context, UI patterns, and any existing design state.
2. **Plan**: `@planner` chooses the applicable design overlays and decides whether design generation is needed.
3. **Implement**: `@implementer` resolves the design state, writes the screen brief, and only then performs design-generation or implementation handoff work.

## Skill Routing

- Primary skills: `design`, `web-ui-design`
- Supporting skills (optional): `mobile-ui-design`, `design-system`

## Design generation gate

Do not call design-generation tools until:

1. `design` has run
2. the canonical design state exists or is refreshed in the same run
3. the screen brief is ready
4. runtime status/tool discovery succeeds

## Context notes

- Provide the product goal, target platform, and whether the screen is greenfield, a redesign, or a targeted edit.
- This route can end in either a screen brief, a design-generation call, or direct implementation handoff depending on scope.

## Workflow steps

1. Explorer surveys the relevant product surface and existing design state.
2. Planner resolves the applicable canonical design state and overlays.
3. Implementer writes the screen brief and decides whether the next step is design generation or direct implementation.
4. If design-generation tools are used, the implementer follows the gate and hands the final artifact into implementation.

## Verification

- The brief is concrete enough for implementation or design generation.
- The route explains whether the next step is direct implementation or design generation.
- Design-generation tools are never the first design step.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner]
  screen_briefs: [<path-or-label>]
  generation_used: <true|false>
  design_state_inputs: [<path>]
  follow_up_items: [<string>] | []
```
