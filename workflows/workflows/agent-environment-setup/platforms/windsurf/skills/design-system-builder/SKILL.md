---
name: "design-system-builder"
displayName: "Design System Builder"
description: "Use when creating or reviewing reusable UI components, token-driven styling, variant APIs, theming hooks, and component documentation for a design system."
license: MIT
metadata:
  version: "3.0.0"
  domain: "frontend"
  role: "specialist"
  stack: "design-system"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "token-driven component systems"
  tags: ["design-system", "components", "tokens", "theming", "variants", "ui"]
---

# Design System Builder

## When to use

- Designing reusable component APIs and variant systems.
- Standardizing token usage, theming hooks, and component composition.
- Reviewing whether a component belongs in the system or app layer.
- Writing design-system-facing implementation guidance and examples.

## When not to use

- One-off product UI with no reusable-system concern.
- Pure visual direction work before component boundaries are known.
- Framework/runtime debugging unrelated to component API design.

## Core workflow

1. Confirm whether the component is truly reusable across screens or products.
2. Define semantic props, states, variants, and token usage before styling details.
3. Keep the base primitive simple and compose complexity around it deliberately.
4. Make theming, accessibility, and docs part of the contract.
5. Verify the component system stays smaller and clearer after the addition.

## Baseline standards

- Use semantic APIs instead of exposing raw style knobs by default.
- Prefer token-driven styling over hardcoded values.
- Make state, variant, and accessibility behavior explicit.
- Keep component boundaries composable rather than magical.
- Document intended usage and anti-usage clearly.

## Avoid

- Dumping product-specific behavior into system primitives.
- Hardcoded spacing, colors, and radii in shared components.
- Prop surfaces that only mirror implementation internals.
- Adding variants before the use cases are distinct and durable.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/component-api-checklist.md` | You need deeper guidance for token-driven component APIs, variants, theming, docs, and system-vs-product boundaries. |
