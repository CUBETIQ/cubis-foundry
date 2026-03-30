# Execution Contract

Use this contract when a design request needs a strict split between routing, systemization, and surface execution.

## Role Split

- `design` is the router and critic. It classifies the problem, diagnoses quality, and names the next owning surface.
- `design-system` is the systemizer. It normalizes canonical visual language, tokens, and component vocabulary.
- `web-ui-design` is the browser execution surface. It turns direction into concrete web layout, hierarchy, states, and handoff cues.
- `mobile-ui-design` is the mobile execution surface. It turns direction into phone-first flow, reachability, states, and platform-sensitive handoff cues.
- `desktop-ui-design` is the desktop execution surface. It turns direction into multi-pane structure, expert productivity, dense-but-legible information design, and desktop-specific handoff cues.

## Sequential Design Steps

1. Classify the request as routing/critique, systemization, web execution, mobile execution, or desktop execution.
2. If the interface already exists, diagnose the primary gap before proposing changes.
3. If the visual language needs to become durable, route to `design-system` before screen work.
4. If the task is a browser surface, route to `web-ui-design`.
5. If the task is a phone-first surface, route to `mobile-ui-design`.
6. If the task is a desktop-first workspace, route to `desktop-ui-design`.
7. Keep each surface inside its own contract. Do not blend critique, systemization, and execution in one answer.

## Deliverable Contracts

### `design`

- State the chosen route.
- Give the reason it fits.
- Name the next artifact and owning surface.
- Preserve only the constraints that must survive downstream execution.

### `web-ui-design`

- State the surface goal and visual thesis.
- Describe layout and hierarchy before components.
- Specify component boundaries, navigation, and token cues only after the base layout is locked.
- Specify states, responsive behavior, and accessibility only after the structural decisions are clear.
- End with implementation-ready handoff notes.

### `mobile-ui-design`

- State the mobile job and visual thesis.
- Describe flow and reachability before styling.
- Specify navigation rhythm, primary-action placement, safe-area behavior, and platform-sensitive notes after the flow is clear.
- Specify states only after the screen or flow structure is stable.
- End with implementation-ready handoff notes.

### `desktop-ui-design`

- State the desktop job and visual thesis.
- Describe workspace structure, pane layout, and persistent context before styling.
- Specify shortcuts, batch actions, comparison views, inspectors, and dense information patterns only after the structural model is clear.
- Specify states, productivity affordances, and desktop-specific persistence rules after the workspace model is stable.
- End with implementation-ready handoff notes.

### `design-system`

- State the canonical design-system summary.
- List the typography system, token language, spacing system, interaction/state language, and component vocabulary.
- Include usage rules only when they materially change downstream screen work.
- Call out overlays only when they add real scope.
- State which downstream surfaces should consume the refresh.
