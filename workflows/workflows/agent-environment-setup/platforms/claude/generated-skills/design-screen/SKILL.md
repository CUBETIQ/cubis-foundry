---
name: design-screen
description: "Turn a product goal into a concrete screen direction, then implement or hand off the resulting UI specification."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "design-screen"
  platform: "Claude Code"
  command: "/design-screen"
compatibility: Claude Code
---
# Design Screen Workflow
## What this workflow does

Creates a screen-level brief, locks the style contract and thesis set, chooses the correct owning surface, and converts that direction into implementation-ready work.

## When to use

Use this for one screen, page, or view where the main problem is composition, hierarchy, interaction cost, or presentation.

## Agent chain

`planner -> implementer`

## Step details

1. Route through `frontend-design` first to lock the style contract, visual thesis, content or system thesis, and interaction thesis.
2. Use `design` to decide whether the work is browser-first, phone-first, or desktop-first, and whether `design-system` must refresh canonical state before screen execution.
3. Build a concrete screen brief with user goal, hierarchy, states, accessibility, motion, and anti-generic constraints.
4. Implement or hand off the design through the owning surface with platform-specific verification notes.

## Skill routing

- `frontend-design` for the public UI-design front door, style contract, and thesis capture
- `design` for routing, critique language, and execution-boundary decisions
- `web-ui-design` for browser-first screen work
- `mobile-ui-design` for app-first or phone-first screen work
- `desktop-ui-design` for workspace-first, multi-pane, or expert-oriented desktop work
- `design-system` when the screen depends on shared tokens, component vocabulary, or canonical system guidance

## Context notes

Provide screen purpose, content requirements, target surfaces, state expectations, and any brand or interaction constraints.

## Verification

The output should describe hierarchy, layout, states, styling decisions, and rejected anti-patterns clearly enough to build from.

## Output contract

```yaml
DESIGN_SCREEN_WORKFLOW_RESULT:
  direction_name: <2-5 word direction>
  style_contract:
    surface_type: <value>
    style_family: <value>
    anti_patterns:
      - <value>
  theses:
    visual: <summary>
    content_or_system: <summary>
    interaction: <summary>
  owning_surface: web-ui-design | mobile-ui-design | desktop-ui-design
  implementation_notes:
    - <note>
```

## Follow-up items

Typical next step: `/implement`