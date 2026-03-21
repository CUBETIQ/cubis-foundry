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

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
