# Stitch Tool Selection

## Minimal tool routing

- `list_projects`
  Use before `create_project` when the current product area may already have a Stitch project. Reuse that project unless the user explicitly wants a separate concept track.
- `generate_screen_from_text`
  Use for a new screen or page when no existing Stitch screen should be preserved.
- `list_screens`
  Use before planning follow-up changes and after timeouts so you can reuse or recover the current screen set.
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
2. Reuse an existing project before creating a new one when the work belongs to the same app or feature line.
3. Once a screen exists, default to `edit_screens` instead of full regeneration.
4. Default to `GEMINI_3_1_PRO` for complex new screens, multi-screen work, or design-system-heavy generation.
5. Use `GEMINI_3_FLASH` only for explicitly speed-first drafts or narrow edits where lower reasoning quality is acceptable.
6. Do not call `generate_variants` unless the user actually wants alternatives.
7. Do not call `create_design_system` or `apply_design_system` for a one-off screen unless design-system work is part of the task.
