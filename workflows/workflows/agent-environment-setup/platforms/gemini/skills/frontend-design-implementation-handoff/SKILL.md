---
name: frontend-design-implementation-handoff
description: Translate design-engine output into repo-native implementation work, preferring real components, Flutter widgets, and existing tokens over pasted generated markup.
---
# Frontend Design Implementation Handoff

## Purpose

Convert the design-engine result into implementation work that matches the repo's real stack and components instead of copying raw generated artifacts.

## When to Use

- After Stitch returns a screen artifact
- After a design screen brief is approved for implementation
- When moving from design state into Flutter, React, or another real UI stack

## Instructions

1. **Prefer existing components and tokens first** — Reuse the repo's real primitives before creating new visual fragments.
2. **Translate semantics, not markup** — A generated artifact is a seed. Rebuild it in the target stack using the same hierarchy and state model.
3. **For Flutter, map into widgets and theme tokens** — Use theme extensions, shared cards, section headers, and navigation widgets instead of porting web structure literally.
4. **Preserve the brief's anti-slop constraints** — Distinctive typography, component rhythm, and motion rules should survive the handoff.
5. **Leave QA hooks behind** — Ensure semantics labels, stable copy, and navigable flows are good enough for `flutter-mobile-qa` or frontend tests.

## Output Format

Deliver:

1. Implementation plan
2. Components/widgets to create or reuse
3. Token/theme mapping
4. QA-readiness notes

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
