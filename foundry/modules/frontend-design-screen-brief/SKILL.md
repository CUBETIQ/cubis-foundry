---
name: frontend-design-screen-brief
description: Compatibility wrapper for older screen-brief requests. Prefer
  design first, then route into web-ui-design or mobile-ui-design for the
  actual screen work.
triggers:
  - frontend design screen brief
  - screen brief
domains:
  - frontend
  - design
whenToUse: When older docs or prompts explicitly name frontend-design-screen-brief.
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

# Frontend Design Screen Brief

This skill is now a compatibility wrapper. Use `design` to choose the surface, then use `web-ui-design` or `mobile-ui-design` to produce the real screen brief and handoff.

## References

- `../design/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
