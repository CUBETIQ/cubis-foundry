---
name: design
description: Umbrella design skill for choosing the right visual or UX
  specialist path and keeping interface work coherent across screens and
  systems.
triggers:
  - design
  - frontend
  - umbrella design skill
  - uX specialist path
  - systems
  - right design sub-skill
  - framing a UI
domains:
  - design
  - frontend
whenToUse: When a task is primarily about visual hierarchy, interaction quality,
  or selecting the right downstream design skill.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Design

## Purpose

Provide the top-level routing skill for design work. Use it to decide whether the task needs critique, system work, screen design, or implementation handoff rather than jumping straight into an arbitrary visual change.

## When to Use

- Selecting the right design sub-skill
- Framing a UI or UX task before implementation
- Keeping multiple design improvements aligned under one direction

## Instructions

1. Start by identifying whether the problem is critique, creation, consistency, or implementation handoff.
2. Route to the narrowest design skill that matches the actual need.
3. Keep design output tied to user goals, not surface decoration alone.

## Anti-patterns

- Do not give generic style advice detached from product purpose.
- Do not skip hierarchy, readability, or affordance in favor of pure aesthetics.

## Output Format

Return the chosen design route, the reason for it, and the concrete design outcomes expected next.

## References

- `../design-audit/SKILL.md`
- `../frontend-design-system/SKILL.md`
- `../frontend-design-screen-brief/SKILL.md`
