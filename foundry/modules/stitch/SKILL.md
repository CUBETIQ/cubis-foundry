---
name: stitch
description: Compatibility wrapper for explicit `stitch` requests.
license: MIT
metadata:
  author: cubis-foundry
  version: "2.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# Stitch

Compatibility alias. Route `stitch` requests into the current design-first Stitch sequence:

1. `frontend-design`
2. `stitch-prompt-enhancement`
3. `stitch-design-system` when design state must be refreshed
4. `stitch-design-orchestrator`
5. `stitch-implementation-handoff`
