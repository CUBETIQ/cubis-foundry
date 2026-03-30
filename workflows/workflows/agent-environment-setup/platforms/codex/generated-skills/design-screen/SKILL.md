---
name: design-screen
description: "Turn a product goal into a concrete screen direction, then implement or hand off the resulting UI specification."
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
## What this workflow does

Creates a screen-level brief, chooses the correct web or mobile design execution path, and converts that direction into implementation-ready work.

## When to use

Use this for one screen, page, or view where the main problem is composition, hierarchy, or presentation.

## Agent chain

`planner -> implementer`

## Step details

1. Route through `design` first to choose browser-first or mobile-first execution.
2. Build a concrete screen brief with user goal, content, hierarchy, and anti-generic constraints.
3. Implement or hand off the design with platform-specific verification notes.

## Skill routing

- `design` for routing and system-level critique
- `web-ui-design` for browser-first screen work
- `mobile-ui-design` for app-first or phone-first screen work
- `desktop-ui-design` for workspace-first, multi-pane, or expert-oriented desktop work
- `design-system` when the screen depends on shared tokens, components, or canonical system guidance

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