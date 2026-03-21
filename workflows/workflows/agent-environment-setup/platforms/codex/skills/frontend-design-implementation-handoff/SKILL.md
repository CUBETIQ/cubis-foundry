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

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
