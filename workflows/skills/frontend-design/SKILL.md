---
name: frontend-design
description: "Use for web UI design decisions: layout, hierarchy, typography, color, motion, and interaction clarity. This skill teaches decision-making, not a fixed visual style."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Frontend Design

## Purpose

Use for web UI design decisions: layout, hierarchy, typography, color, motion, and interaction clarity. This skill teaches decision-making, not a fixed visual style.

## When to Use

- Choosing layout, hierarchy, typography, and spacing direction for web UI.
- Designing component states, interaction patterns, and visual emphasis.
- Reviewing whether an interface is generic, noisy, or unclear before implementation.
- Translating product intent into concrete UI structure and styling direction.

## Instructions

1. Clarify audience, task priority, density, and brand constraints.
2. Decide information hierarchy before styling details.
3. Choose one visual direction and make it consistent across layout, type, and color.
4. Design states explicitly: loading, empty, error, hover, focus, success.
5. Check that the result is understandable, intentional, and not template-looking.

### Baseline standards

- Prioritize hierarchy and clarity over decoration.
- Use typography and spacing as structure, not filler.
- Make CTAs and critical state changes visually obvious.
- Prefer a deliberate visual direction over “safe SaaS default” choices.
- Keep motion purposeful and accessibility-compatible.

### Constraints

- Avoid generic dashboard or landing-page patterns with no product reason.
- Avoid flat visual hierarchy where everything competes equally.
- Avoid decorative effects that obscure content or interaction.
- Avoid choosing colors, fonts, and motion independently with no shared direction.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/hierarchy-and-state-checklist.md` | You need a stronger UI decision checklist for hierarchy, type, color, motion, and state design before implementation. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with frontend design best practices in this project"
- "Review my frontend design implementation for issues"
