---
name: "architecture-designer"
description: "Use when designing or reviewing system architecture, interface boundaries, tradeoffs, ADRs, scalability posture, and the smallest durable target shape for a product or platform."
license: MIT
metadata:
  version: "3.0.0"
  domain: "architecture"
  role: "specialist"
  stack: "system-design"
  category: "core-operating"
  layer: "core-operating"
  canonical: true
  maturity: "stable"
  baseline: "pragmatic modern system design"
  tags: ["architecture", "system-design", "adrs", "boundaries", "tradeoffs", "scalability"]
---

# Architecture Designer

## When to use

- Designing a new system or reshaping an existing one.
- Making boundary, ownership, integration, or deployment tradeoffs explicit.
- Writing or reviewing architectural decisions and ADR-style reasoning.
- Deciding how much architecture is actually justified for the product stage.

## When not to use

- Small code changes where architecture is already settled.
- Framework-specific implementation work with no boundary decision.
- Pure infrastructure tuning or database optimization with no system-shape change.

## Core workflow

1. Clarify product goals, constraints, and failure tolerance.
2. Identify the few architectural decisions that materially change risk or cost.
3. Compare viable shapes and document tradeoffs, not just the favorite option.
4. Choose the smallest architecture that safely supports the current target.
5. Hand off explicit boundaries, risks, and follow-up validation points.

## Baseline standards

- Start from product outcomes, not architecture fashion.
- Make ownership and interfaces explicit.
- Consider security, observability, and operations as part of the design.
- Prefer reversible decisions when uncertainty is high.
- Keep ADR-style reasoning concrete and testable.

## Avoid

- Over-engineering for hypothetical future scale.
- Treating diagrams as a substitute for boundary decisions.
- Choosing technology before identifying the real constraints.
- Hiding unresolved risk behind vague architectural language.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/system-tradeoff-checklist.md` | You need a sharper system-design checklist for boundaries, ADRs, integration shape, resilience, and rollout risk. |
