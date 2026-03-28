---
name: frontend-design-style-selector
description: Compatibility wrapper for older style-selection requests. Prefer
  design for current visual-direction selection and routing.
triggers:
  - frontend design style selector
  - style selector
domains:
  - frontend
  - design
whenToUse: When older docs or prompts explicitly name frontend-design-style-selector.
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

# Frontend Design Style Selector

This skill is now a compatibility wrapper. Use `design` to choose the visual direction, then continue in `web-ui-design` or `mobile-ui-design`.

## References

- `../design/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
