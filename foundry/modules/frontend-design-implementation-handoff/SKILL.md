---
name: frontend-design-implementation-handoff
description: Compatibility wrapper for older design handoff requests. Prefer
  design plus web-ui-design or mobile-ui-design for current implementation-aware
  handoff.
triggers:
  - frontend design implementation handoff
  - design implementation handoff
domains:
  - frontend
  - design
whenToUse: When older docs or prompts explicitly name frontend-design-implementation-handoff.
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

# Frontend Design Implementation Handoff

This skill is now a compatibility wrapper. Use `design` to choose the right surface, then use `web-ui-design` or `mobile-ui-design` for the actual implementation-aware handoff.

## References

- `../design/SKILL.md`
- `../web-ui-design/SKILL.md`
- `../mobile-ui-design/SKILL.md`
