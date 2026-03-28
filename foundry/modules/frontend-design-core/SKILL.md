---
name: frontend-design-core
description: Compatibility wrapper for older design-engine routing requests.
  Prefer design for current routing, critique, and canonical design-state
  setup.
triggers:
  - frontend design core
  - design engine core
domains:
  - frontend
  - design
whenToUse: When older docs or prompts explicitly name frontend-design-core.
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

# Frontend Design Core

This skill is now a compatibility wrapper. Use `design` for current routing, audit-first diagnosis, and canonical design-state setup.

## References

- `../design/SKILL.md`
- `../frontend-design-system/SKILL.md`
