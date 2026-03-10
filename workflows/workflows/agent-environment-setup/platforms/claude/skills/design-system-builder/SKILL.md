---
name: design-system-builder
description: "Use when creating or reviewing reusable UI components, token-driven styling, variant APIs, theming hooks, and component documentation for a design system."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Design System Builder

## Purpose

Use when creating or reviewing reusable UI components, token-driven styling, variant APIs, theming hooks, and component documentation for a design system.

## When to Use

- Designing reusable component APIs and variant systems.
- Standardizing token usage, theming hooks, and component composition.
- Reviewing whether a component belongs in the system or app layer.
- Writing design-system-facing implementation guidance and examples.

## Instructions

1. Confirm whether the component is truly reusable across screens or products.
2. Define semantic props, states, variants, and token usage before styling details.
3. Keep the base primitive simple and compose complexity around it deliberately.
4. Make theming, accessibility, and docs part of the contract.
5. Verify the component system stays smaller and clearer after the addition.

### Baseline standards

- Use semantic APIs instead of exposing raw style knobs by default.
- Prefer token-driven styling over hardcoded values.
- Make state, variant, and accessibility behavior explicit.
- Keep component boundaries composable rather than magical.
- Document intended usage and anti-usage clearly.

### Constraints

- Avoid dumping product-specific behavior into system primitives.
- Avoid hardcoded spacing, colors, and radii in shared components.
- Avoid prop surfaces that only mirror implementation internals.
- Avoid adding variants before the use cases are distinct and durable.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/component-api-checklist.md` | You need deeper guidance for token-driven component APIs, variants, theming, docs, and system-vs-product boundaries. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with design system builder best practices in this project"
- "Review my design system builder implementation for issues"
