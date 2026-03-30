# Workflow Prompt: /design-system

Define or refine reusable design tokens, components, and rules so the interface system becomes more coherent and scalable.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `design`, `web-ui-design`, `mobile-ui-design`, `desktop-ui-design`.
- Local skill file hints if installed: `.github/skills/design/SKILL.md`, `.github/skills/web-ui-design/SKILL.md`, `.github/skills/mobile-ui-design/SKILL.md`, `.github/skills/desktop-ui-design/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Design System Workflow

## What this workflow does

Guides systematic UI work around tokens, components, states, interaction patterns, and cross-surface visual direction rather than isolated screen polish.

## When to use

Use this when a request affects multiple screens or requires consistent system-level design decisions.

## Agent chain

`implementer`

## Step details

1. Audit the current design system surface and canonical direction.
2. Define the reusable tokens, primitives, or component changes needed for the main target surface.
3. Apply and verify the system-level update in code or documentation.

## Skill routing

- `design` for direction and visual judgment
- `web-ui-design` for browser-first system structure and component vocabulary
- `mobile-ui-design` when the system change must survive app-first surfaces too
- `desktop-ui-design` when the system change must support multi-pane, keyboard-first, or desktop-grade productivity surfaces

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
