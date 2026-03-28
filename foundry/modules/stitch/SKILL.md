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
metadata:
  deprecated: true
  replaced_by: design
---

# Stitch

## Purpose

Provide a compatibility wrapper for explicit Stitch requests. Use it to translate older Stitch-oriented language into the current canonical frontend design workflow rather than reviving retired Stitch-only sub-skills.

## When to Use

- A prompt explicitly says `stitch`
- Older docs refer to Stitch-specific flow names
- The user wants generated-screen style design work but the repo should stay on current canonical modules

## Instructions

1. Treat `design` as the main routing surface for Stitch-like UI generation work.
2. Prefer `web-ui-design` for browser-style screen generation unless the request is explicitly mobile-first.
3. Prefer `mobile-ui-design` when the Stitch-like request is really about an app screen, mobile flow, or Flutter-oriented output.
4. Use `../design-system/SKILL.md` only when the canonical design state or `.stitch/DESIGN.md` mirror genuinely needs to be refreshed first.
5. Prefer the new design trio over fragmented `frontend-design*` names in all follow-up guidance.

## Output Format

Return:

1. The canonical route you chose
2. Why that route replaces the old Stitch phrasing
3. The next concrete design or implementation artifact expected

## References

- `../design/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
- `../design-system/SKILL.md`
