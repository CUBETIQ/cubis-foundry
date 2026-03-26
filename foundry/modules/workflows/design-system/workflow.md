---
name: design-system
command: "/design-system"
description: Define or refine reusable design tokens, components, and rules so the interface system becomes more coherent and scalable.
triggers:
  - design system
  - tokens
  - component library
  - ui consistency
agentChain:
  - implementer
primarySkills:
  - design
  - frontend-design-system
supportingSkills:
  - frontend-design-core
whenToUse: "When UI work needs reusable system decisions rather than one-off screen tweaks."
priority: medium
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Design System Workflow

## What this workflow does

Guides systematic UI work around tokens, components, states, and interaction patterns rather than isolated screen polish.

## When to use

Use this when a request affects multiple screens or requires consistent system-level design decisions.

## Agent chain

`implementer`

## Step details

1. Audit the current design system surface.
2. Define the reusable tokens, primitives, or component changes needed.
3. Apply and verify the system-level update in code or documentation.

## Skill routing

- `design` for direction and visual judgment
- `frontend-design-system` for reusable component structure
- `frontend-design-core` for execution details

## Context notes

Provide screenshots, existing component constraints, target platforms, and brand direction if available.

## Verification

The result should improve consistency across components, not just one example view.

## Output contract

```yaml
DESIGN_SYSTEM_WORKFLOW_RESULT:
  system_changes:
    - <token or component update>
  verification:
    - <evidence>
  follow_on_surfaces:
    - <remaining screen or component>
```

## Follow-up items

Typical next step: `/implement` or `/design-screen`
