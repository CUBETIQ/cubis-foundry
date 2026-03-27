---
name: stitch
description: Use when older docs or prompts explicitly ask for Stitch and the
  request needs to be routed into the canonical frontend design flow without
  relying on retired Stitch-specific sub-skills.
triggers:
  - stitch
  - compatibility wrapper
  - frontend design
  - screen brief
  - design system
domains:
  - design
  - frontend
whenToUse: When a task explicitly names Stitch but the repo should stay on the canonical frontend design path.
priority: secondary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Stitch

## Purpose

Provide a compatibility wrapper for explicit Stitch requests. Use it to translate older Stitch-oriented language into the current canonical frontend design workflow rather than reviving retired Stitch-only sub-skills.

## When to Use

- A prompt explicitly says `stitch`
- Older docs refer to Stitch-specific flow names
- The user wants generated-screen style design work but the repo should stay on current canonical modules

## Instructions

1. Treat `frontend-design` as the main execution surface for Stitch-like UI generation work.
2. Use `frontend-design-system` when the canonical design state or `.stitch/DESIGN.md` mirror needs to be refreshed first.
3. Use `frontend-design-screen-brief` when the next step is generating or editing a concrete screen brief.
4. Use `frontend-design-implementation-handoff` when a Stitch-style artifact must be translated into repo-native UI work.
5. Prefer canonical frontend modules over retired Stitch sub-skill names in all follow-up guidance.

## Output Format

Return:

1. The canonical route you chose
2. Why that route replaces the old Stitch phrasing
3. The next concrete design or implementation artifact expected

## References

- `../frontend-design/SKILL.md`
- `../frontend-design-system/SKILL.md`
- `../frontend-design-screen-brief/SKILL.md`
- `../frontend-design-implementation-handoff/SKILL.md`
