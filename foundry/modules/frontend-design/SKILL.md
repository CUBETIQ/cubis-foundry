---
name: frontend-design
description: Compatibility wrapper for older broad frontend design requests.
  Prefer design as the router, then use web-ui-design or mobile-ui-design for
  the real execution path.
triggers:
  - frontend design
  - frontend ui design
  - legacy frontend design
domains:
  - frontend
  - design
whenToUse: When older docs or prompts explicitly name frontend-design.
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

# Frontend Design

## Purpose

Provide a compatibility wrapper for older broad `frontend-design` requests. Use it to translate that older phrasing into the current canonical design trio.

## Instructions

1. Start with `design` as the top-level router.
2. Use `web-ui-design` for browser-first surfaces such as dashboards, landing pages, and desktop-oriented screens.
3. Use `mobile-ui-design` for app-first, phone-sized, or Flutter-oriented surfaces.
4. Use `frontend-design-system` only when canonical design state or the `.stitch/DESIGN.md` mirror needs a refresh.

## Output Format

Return:

1. The canonical route selected
2. Why it replaces `frontend-design`
3. The next design artifact expected

## References

- `../design/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
- `../frontend-design-system/SKILL.md`
