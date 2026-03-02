````markdown
---
inclusion: manual
name: "mcp-catalog"
description: "MCP category pointer. Use this to discover MCP vault skills on demand with file tools instead of preloading everything."
metadata:
  pointer: true
  vault_index: ".mcp-vault/index.json"
  load_strategy: "progressive-disclosure"
---

# MCP Catalog Pointer

Use this skill to locate and load MCP guidance only when needed.

## Workflow

1. Open `../.mcp-vault/index.json` (relative to this skill directory).
2. Pick the category and skill id that matches the task.
3. Open `../.mcp-vault/skills/<skill-id>/SKILL.md`.
4. Load only the specific `references/` files needed for the current task.

## Notes

- Do not preload the entire vault.
- Keep selection to one primary MCP skill unless the task is cross-domain.
````
