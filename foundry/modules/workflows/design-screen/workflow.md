---
name: design-screen
command: "/design-screen"
description: Turn a product goal into a concrete screen direction, then implement or hand off the resulting UI specification.
triggers:
  - screen design
  - ui screen
  - page design
  - redesign
agentChain:
  - planner
  - implementer
primarySkills:
  - frontend-design-screen-brief
supportingSkills:
  - frontend-design-style-selector
  - frontend-design-implementation-handoff
whenToUse: "When a single screen or page needs a deliberate design direction and implementation-ready brief."
priority: medium
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Design Screen Workflow

## What this workflow does

Creates a screen-level brief, selects a visual direction, and converts that direction into implementation-ready work.

## When to use

Use this for one screen, page, or view where the main problem is composition, hierarchy, or presentation.

## Agent chain

`planner -> implementer`

## Step details

1. Build a screen brief with user goal, content, and constraints.
2. Choose a style direction and layout approach.
3. Implement or hand off the design with verification notes.

## Skill routing

- `frontend-design-screen-brief` for framing
- `frontend-design-style-selector` for visual direction
- `frontend-design-implementation-handoff` for delivery details

## Context notes

Provide screen purpose, content requirements, device targets, and any brand or interaction constraints.

## Verification

The output should describe hierarchy, layout, and styling decisions clearly enough to build from.

## Output contract

```yaml
DESIGN_SCREEN_WORKFLOW_RESULT:
  brief: <screen summary>
  design_direction: <style choice>
  implementation_notes:
    - <note>
```

## Follow-up items

Typical next step: `/implement`
