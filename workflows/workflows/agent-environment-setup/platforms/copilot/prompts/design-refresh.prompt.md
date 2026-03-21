# Workflow Prompt: /design-refresh

Refresh design state and implementation surfaces after product direction, design tokens, or major UI structure changes.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `frontend-design`, `frontend-design-core`, `frontend-design-system`, `frontend-design-style-selector`, `frontend-design-screen-brief`, `stitch-design-system`, `tech-doc`.
- Local skill file hints if installed: `.github/skills/frontend-design/SKILL.md`, `.github/skills/frontend-design-core/SKILL.md`, `.github/skills/frontend-design-system/SKILL.md`, `.github/skills/frontend-design-style-selector/SKILL.md`, `.github/skills/frontend-design-screen-brief/SKILL.md`, `.github/skills/stitch-design-system/SKILL.md`, `.github/skills/tech-doc/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Design Refresh Workflow

## When to use

Use when the product direction changed and the design system, overlays, or Stitch mirror need a coordinated refresh.

## Agent Chain

`explorer` -> `planner` -> `implementer` -> `reviewer`

## Routing

1. **Explore**: `@explorer` finds the current design docs, overlays, and implementation surfaces touched by the direction change.
2. **Plan**: `@planner` decides what must be refreshed and what can stay stable.
3. **Implement**: `@implementer` updates canonical design state, overlays, and compatibility mirrors.
4. **Review**: `@reviewer` checks that the refreshed design state is coherent and ready for downstream implementation.

## Skill Routing

- Primary skills: `frontend-design`, `frontend-design-core`, `frontend-design-system`
- Supporting skills (optional): `frontend-design-style-selector`, `frontend-design-screen-brief`, `stitch-design-system`, `tech-doc`

## Context notes

- Provide what changed in product direction or UI structure and which downstream surfaces are now stale.
- This route refreshes design state; it should not silently skip dependent overlays or the Stitch mirror.

## Workflow steps

1. Explorer finds the current design docs, overlays, and implementation surfaces touched by the direction change.
2. Planner decides what must be refreshed and what can stay stable.
3. Implementer updates canonical design state, overlays, and compatibility mirrors.
4. Reviewer checks that the refreshed design state is coherent and ready for downstream implementation.

## Verification

- Canonical design state and overlays are updated together.
- Downstream design consumers are told what changed.
- Stitch compatibility artifacts are refreshed only from canonical state.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner, reviewer]
  refreshed_artifacts: [<path>]
  stitch_mirror_updated: <true|false>
  follow_up_items: [<string>] | []
```
