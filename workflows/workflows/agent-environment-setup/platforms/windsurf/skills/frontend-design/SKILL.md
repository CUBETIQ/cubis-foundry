---
name: "frontend-design"
description: "Use for web UI design decisions: layout, hierarchy, typography, color, motion, and interaction clarity. This skill teaches decision-making, not a fixed visual style."
license: MIT
metadata:
  version: "3.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "design"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "modern web product UI"
  tags: ["design", "ui", "ux", "layout", "typography", "color", "motion"]
---

# Frontend Design

## When to use

- Choosing layout, hierarchy, typography, and spacing direction for web UI.
- Designing component states, interaction patterns, and visual emphasis.
- Reviewing whether an interface is generic, noisy, or unclear before implementation.
- Translating product intent into concrete UI structure and styling direction.

## When not to use

- Framework-only implementation questions with settled design direction.
- Pure accessibility or testing work with no visual or interaction decision.
- Database, API, or backend architecture tasks.

## Core workflow

1. Clarify audience, task priority, density, and brand constraints.
2. Decide information hierarchy before styling details.
3. Choose one visual direction and make it consistent across layout, type, and color.
4. Design states explicitly: loading, empty, error, hover, focus, success.
5. Check that the result is understandable, intentional, and not template-looking.

## Baseline standards

- Prioritize hierarchy and clarity over decoration.
- Use typography and spacing as structure, not filler.
- Make CTAs and critical state changes visually obvious.
- Prefer a deliberate visual direction over “safe SaaS default” choices.
- Keep motion purposeful and accessibility-compatible.

## Avoid

- Generic dashboard or landing-page patterns with no product reason.
- Flat visual hierarchy where everything competes equally.
- Decorative effects that obscure content or interaction.
- Choosing colors, fonts, and motion independently with no shared direction.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/hierarchy-and-state-checklist.md` | You need a stronger UI decision checklist for hierarchy, type, color, motion, and state design before implementation. |
