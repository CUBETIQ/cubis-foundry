---
name: mcp-core
description: Core guidance for representing MCP servers, manifests, and runtime
  integration points in Foundry.
triggers:
  - mcp core
  - infrastructure
  - manifests
  - manifest generation
  - runtime wiring
domains:
  - infrastructure
whenToUse: When the task involves MCP server registration, manifest generation,
  or projecting MCP configuration into runtime surfaces.
priority: secondary
compatibility:
  - codex
  - claude
  - copilot
  - gemini
  - antigravity
---

# MCP Core

## Purpose

Define how Foundry should treat MCP integrations as first-class runtime assets. This skill keeps server manifests, projection targets, and environment-specific wiring aligned across platforms.

## When to Use

- Adding a new MCP server to Foundry
- Updating manifest generation or runtime wiring
- Auditing whether projected MCP configuration still matches the canonical source

## Instructions

1. Treat the canonical manifest as the source of truth and derive runtime-specific config from it.
2. Keep platform-specific differences explicit instead of hiding them behind hand-written config drift.
3. Verify both generated artifacts and the consumer runtime expectations.

## Anti-patterns

- Do not edit generated MCP config by hand and pretend it is canonical.
- Do not assume every runtime supports the same MCP surface.

## Output Format

Return the canonical source touched, projected surfaces affected, and the verification used to confirm wiring.

## References

- `../mcp-server-builder/SKILL.md`
