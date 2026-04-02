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
2. `design`
3. `design-system` when canonical design state must be refreshed
4. `stitch-prompt-enhancement`
5. `stitch-design-orchestrator`
6. `stitch-implementation-handoff`
