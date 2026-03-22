---
name: frontend-design-mobile-patterns
description: Adapt the design engine to mobile and Flutter surfaces using Foundry's normalized mobile-pattern dataset and implementation-first constraints.
---
# Frontend Design Mobile Patterns

## Purpose

Translate the design engine into mobile-specific decisions that survive real Flutter implementation instead of staying as web-first UI ideas.

## When to Use

- Designing Flutter screens, flows, or navigation
- Adapting a Stitch-inspired concept into a mobile-native screen brief
- Reviewing whether a design will survive small screens and thumb-driven interaction

## Instructions

1. **Load `workflows/design-datasets/mobile-patterns.json` first** — Use it to shape navigation placement, card rhythm, CTA placement, and progress visibility.
2. **Design for thumb reach and scroll rhythm** — Primary actions should stay reachable and section breaks should remain scannable on smaller screens.
3. **Prefer Flutter-feasible patterns** — Avoid browser-specific assumptions like hover-led navigation or overly dense freeform layouts that do not translate well to Flutter widgets.
4. **Write implementation cues, not Figma prose** — Specify scaffold usage, navigation model, card rhythm, token usage, and expected widget states.
5. **Feed the result into `frontend-design-implementation-handoff` and `flutter-mobile-qa`** — Mobile design is not complete until implementation and QA can consume the same brief.

## Output Format

Deliver:

1. Mobile-specific layout notes
2. Navigation and CTA placement rules
3. Widget/state expectations
4. Flutter feasibility notes

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
