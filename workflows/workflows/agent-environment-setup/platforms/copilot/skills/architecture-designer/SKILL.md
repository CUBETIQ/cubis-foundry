---
name: architecture-designer
description: "Use when designing or reviewing system architecture, interface boundaries, tradeoffs, ADRs, scalability posture, and the smallest durable target shape for a product or platform."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Architecture Designer

## Purpose

Use when designing or reviewing system architecture, interface boundaries, tradeoffs, ADRs, scalability posture, and the smallest durable target shape for a product or platform.

## When to Use

- Designing a new system or reshaping an existing one.
- Making boundary, ownership, integration, or deployment tradeoffs explicit.
- Writing or reviewing architectural decisions and ADR-style reasoning.
- Deciding how much architecture is actually justified for the product stage.

## Instructions

1. Clarify product goals, constraints, and failure tolerance.
2. Identify the few architectural decisions that materially change risk or cost.
3. Compare viable shapes and document tradeoffs, not just the favorite option.
4. Choose the smallest architecture that safely supports the current target.
5. Hand off explicit boundaries, risks, and follow-up validation points.

### Baseline standards

- Start from product outcomes, not architecture fashion.
- Make ownership and interfaces explicit.
- Consider security, observability, and operations as part of the design.
- Prefer reversible decisions when uncertainty is high.
- Keep ADR-style reasoning concrete and testable.

### Constraints

- Avoid over-engineering for hypothetical future scale.
- Avoid treating diagrams as a substitute for boundary decisions.
- Avoid choosing technology before identifying the real constraints.
- Avoid hiding unresolved risk behind vague architectural language.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/system-tradeoff-checklist.md` | You need a sharper system-design checklist for boundaries, ADRs, integration shape, resilience, and rollout risk. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with architecture designer best practices in this project"
- "Review my architecture designer implementation for issues"
