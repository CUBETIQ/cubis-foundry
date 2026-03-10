---
name: react-expert
description: "Use for framework-agnostic React architecture with React 19 patterns, state design, component boundaries, and rendering-performance decisions."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# React Expert

## Purpose

Use for framework-agnostic React architecture with React 19 patterns, state design, component boundaries, and rendering-performance decisions.

## When to Use

- Designing reusable component and state boundaries.
- Refactoring React code for predictable rendering and side-effect control.
- Choosing local, shared, server, or async UI state placement.
- Reviewing hooks, forms, transitions, and accessibility-sensitive UI flows.

## Instructions

1. Define component ownership and server/client boundaries first.
2. Place state at the lowest level that preserves correctness.
3. Keep effects explicit, idempotent, and cleanup-safe.
4. Profile rerender behavior before reaching for memoization.
5. Validate accessible interaction states and error/loading behavior.

### Baseline standards

- Prefer pure render logic and explicit mutation boundaries.
- Derive state instead of duplicating it.
- Use transitions and suspense intentionally for UX, not fashion.
- Keep form and async flows predictable.
- Pair implementation with focused component or interaction tests.

### Constraints

- Avoid blanket memoization with no evidence.
- Avoid effect-driven derived-state loops.
- Avoid hidden shared mutable module state.
- Avoid client-only patterns when server rendering would simplify the surface.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/rendering-state-checklist.md` | The task needs a deeper playbook for state placement, effect discipline, rendering cost, and interaction-level verification. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with react expert best practices in this project"
- "Review my react expert implementation for issues"
