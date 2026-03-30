# Workflow Prompt: /design-screen

Turn a product goal into a concrete screen direction, then implement or hand off the resulting UI specification.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `design`, `web-ui-design`, `mobile-ui-design`, `desktop-ui-design`, `design-system`.
- Local skill file hints if installed: `.github/skills/design/SKILL.md`, `.github/skills/web-ui-design/SKILL.md`, `.github/skills/mobile-ui-design/SKILL.md`, `.github/skills/desktop-ui-design/SKILL.md`, `.github/skills/design-system/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
