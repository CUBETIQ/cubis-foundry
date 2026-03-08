# Universal Skill Schema

Use this reference when creating or rebuilding a canonical Foundry skill from scratch.

## Required root sections

Every new canonical skill should have these sections in `SKILL.md`:

1. `IDENTITY`
2. `BOUNDARIES`
3. `When to Use`
4. `When Not to Use`
5. `STANDARD OPERATING PROCEDURE (SOP)`

## What goes where

- `IDENTITY`: define the specialist posture and the artifact it owns.
- `BOUNDARIES`: list hard constraints and "do not" rules.
- `When to Use`: trigger boundaries with concrete examples.
- `When Not to Use`: non-goals that prevent overlap with nearby skills.
- `SOP`: numbered execution algorithm; keep it short and procedural.

## Progressive disclosure

- Keep root `SKILL.md` compact.
- Move platform notes, large examples, templates, and detailed checklists into `references/`, `templates/`, or `assets/`.
- Link every sidecar from `SKILL.md` with explicit "load when" guidance.

## Canonical metadata

Prefer these metadata keys when relevant:

- `category`
- `layer`
- `canonical`
- `maturity`
- `aliases`
- `deprecated`
- `replaced_by`
- `tags`

## Rewrite rule

When using external skills as benchmarks:

- keep the trigger pattern
- keep the structural lesson
- rewrite the actual guidance for Foundry
- remove repo- or vendor-specific assumptions that do not survive cross-platform generation
