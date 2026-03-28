---
name: design-audit
description: Compatibility wrapper for older design-audit skill requests.
  Prefer design in audit mode for current review and remediation routing.
triggers:
  - design audit
  - ui audit
  - visual audit
domains:
  - design
  - frontend
whenToUse: When older docs or prompts explicitly name design-audit as a skill.
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

# Design Audit

This skill is now a compatibility wrapper. Use `design` in audit mode for current diagnosis, findings, and remediation routing.

## References

- `../design/SKILL.md`
- `references/scoring-rubric.md`
- `../playwright-interactive/SKILL.md`
