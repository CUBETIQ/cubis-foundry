---
name: design-system
description: "Define or refine reusable design tokens, components, and rules so the interface system becomes more coherent and scalable."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "design-system"
  platform: "Codex"
  command: "/design-system"
compatibility: Codex
---
# Design System Workflow
## What this workflow does

Guides systematic UI work around canonical design state, tokens, components, states, interaction patterns, and cross-surface visual direction rather than isolated screen polish.

## When to use

Use this when a request affects multiple screens, needs consistent system-level decisions, or requires `docs/foundation/DESIGN.md` to become the durable design source of truth.

## Agent chain

`planner -> implementer`

## Step details

1. Use `frontend-design` to lock the style contract and thesis set that the system must preserve.
2. Audit the current design-system surface and canonical direction.
3. Define the reusable token, primitive, component, responsive, and do or do not rules needed for the main target surfaces.
4. Apply and verify the system-level update in documentation or code, with `docs/foundation/DESIGN.md` treated as canonical and Stitch treated as a downstream consumer only.

## Skill routing

- `frontend-design` for public UI-design intake and system-before-screen framing
- `design-system` for the canonical `DESIGN.md` contract and cross-surface systemization
- `design` for route and critique support when the system work starts from drift or audit findings
- `web-ui-design` for browser-first system structure and component vocabulary
- `mobile-ui-design` when the system change must survive app-first surfaces too
- `desktop-ui-design` when the system change must support multi-pane, keyboard-first, or desktop-grade productivity surfaces

## Context notes

Provide screenshots, existing component constraints, target platforms, and any brand direction or anti-patterns to reject.

## Verification

The result should improve consistency across components and surfaces, not just one example view.

## Output contract

```yaml
DESIGN_SYSTEM_WORKFLOW_RESULT:
  direction_name: <2-5 word direction>
  design_doc_sections:
    - style contract
    - theses
    - token roles
    - component vocabulary
    - responsive rules
  system_changes:
    - <token or component update>
  verification:
    - <evidence>
  follow_on_surfaces:
    - <remaining screen or component>
```

## Follow-up items

Typical next step: `/implement` or `/design-screen`