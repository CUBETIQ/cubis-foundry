# Stitch Tool Selection

## Minimal tool routing

- `generate_screen_from_text`
  Use for a new screen or page when no existing Stitch screen should be preserved.
- `edit_screens`
  Use for targeted changes to an existing screen. Prefer this once a screen already exists.
- `generate_variants`
  Use when the user explicitly wants a few alternatives before choosing one direction.
- `create_design_system`
  Use when the task is to establish a new Stitch design system, not just a screen.
- `apply_design_system`
  Use when a known design system should be applied to an existing project or screen set.
- `get_screen`
  Use after the final generation/edit pass to fetch the authoritative artifact for implementation handoff.

## Selection rules

1. Prefer the smallest tool that solves the task.
2. Once a screen exists, default to `edit_screens` instead of full regeneration.
3. Do not call `generate_variants` unless the user actually wants alternatives.
4. Do not call `create_design_system` or `apply_design_system` for a one-off screen unless design-system work is part of the task.
