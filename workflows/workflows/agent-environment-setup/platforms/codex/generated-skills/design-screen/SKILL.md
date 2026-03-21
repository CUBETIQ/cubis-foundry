---
name: design-screen
description: "Resolve the design engine first, produce a high-signal screen brief, then optionally hand off to Stitch or implementation."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "design-screen"
  platform: "Codex"
  command: "/design-screen"
compatibility: Codex
---
# Design Screen Workflow
## When to use

Use when the task is about shaping a concrete page or screen, especially before Stitch generation or Flutter/mobile implementation.

## Agent Chain

`explorer` -> `planner` -> `implementer`

## Routing

1. **Explore**: `@explorer` reads the current product context, UI patterns, and any existing design state.
2. **Plan**: `@planner` chooses the applicable design overlays and decides whether Stitch is needed.
3. **Implement**: `@implementer` resolves the design state, writes the screen brief, and only then performs Stitch or implementation handoff work.

## Skill Routing

- Primary skills: `frontend-design`, `frontend-design-core`, `frontend-design-style-selector`, `frontend-design-screen-brief`
- Supporting skills (optional): `frontend-design-mobile-patterns`, `stitch-prompt-enhancement`, `stitch-design-system`, `stitch-design-orchestrator`, `frontend-design-implementation-handoff`, `stitch-implementation-handoff`

## Stitch Gate

Do not call Stitch until:

1. `frontend-design` has run
2. the canonical design state exists or is refreshed in the same run
3. the screen brief is ready
4. Stitch status/tool discovery succeeds

## Context notes

- Provide the product goal, target platform, and whether the screen is greenfield, a redesign, or a targeted edit.
- This route can end in either a screen brief, a Stitch call, or direct implementation handoff depending on scope.

## Workflow steps

1. Explorer surveys the relevant product surface and existing design state.
2. Planner resolves the applicable canonical design state and overlays.
3. Implementer writes the screen brief and decides whether the next step is Stitch or direct implementation.
4. If Stitch is used, the implementer follows the Stitch gate and hands the final artifact into implementation.

## Verification

- The brief is concrete enough for implementation or Stitch.
- The route explains whether the next step is direct implementation or Stitch.
- Stitch is never the first design step.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner]
  screen_briefs: [<path-or-label>]
  stitch_used: <true|false>
  design_state_inputs: [<path>]
  follow_up_items: [<string>] | []
```