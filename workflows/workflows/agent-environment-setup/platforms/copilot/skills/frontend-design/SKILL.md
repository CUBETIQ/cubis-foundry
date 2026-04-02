---
name: frontend-design
description: Use when a task needs a public UI-design entrypoint that locks visual direction, captures a style contract, and routes into design-system, web, mobile, or desktop execution without generic AI aesthetics.
license: MIT
metadata:
  author: cubis-foundry
  version: "3.3"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---
# Frontend Design

## Purpose

Serve as the public umbrella entrypoint for UI design work. Use it to turn rough UI intent into a clear design direction, a stable style contract, and the correct downstream route rather than jumping straight into web, mobile, desktop, or Stitch output.

This surface is the front door, not the final execution surface. It decides whether the task needs critique, systemization, screen design, or implementation handoff, then routes into the owning modern skill stack.

## When to Use

- A user asks for frontend design, UI design, screen design, or visual direction without naming the exact downstream surface
- A product surface feels generic, inconsistent, or under-directed and needs a stronger point of view before implementation
- A design request spans system work plus one or more execution surfaces
- A Stitch prompt or design-generation request needs style discipline before generation
- A request needs a style contract, anti-pattern list, and implementation-aware design brief before code changes

## Core Contract

Lock these inputs before proposing visuals or components:

- surface type
- style family
- brand mood
- visual material
- density
- palette direction
- typography mood
- anti-patterns to reject

Then define three theses:

- visual thesis
- content or system thesis
- interaction thesis

If the user did not provide enough detail, state the assumptions explicitly before routing downstream.

## Instructions

1. Classify the request first: critique, systemization, screen execution, or implementation handoff.
2. Lock the style contract before proposing visuals, components, or prompts. Use `../design/references/visual-direction.md` and `../design/references/foundation.md` when the request is vague.
3. Define the visual thesis, content or system thesis, and interaction thesis before choosing layout or components.
4. Route system-level work to `../design-system/SKILL.md` when the task needs durable token language, component vocabulary, or canonical `docs/foundation/DESIGN.md`.
5. Route critique and execution diagnosis to `../design/SKILL.md` when the task needs audit-first reasoning, route selection, or anti-generic constraints that should survive downstream execution.
6. Route browser-first execution to `../web-ui-design/SKILL.md`, phone-first execution to `../mobile-ui-design/SKILL.md`, and desktop-first workspace execution to `../desktop-ui-design/SKILL.md`. Do not flatten those surfaces into one copied layout.
7. Keep system-before-screen sequencing strict. If the design language is missing or stale, refresh `docs/foundation/DESIGN.md` before producing a multi-screen brief or a Stitch generation plan.
8. Use Stitch only after the design state is resolved. When Stitch is involved, treat `docs/foundation/DESIGN.md` as canonical and any Stitch-facing mirror as derived remote context.
9. When the task reaches implementation, hand off concrete component, state, responsive, accessibility, and motion expectations instead of vague aesthetic prose.
10. Keep the legacy `frontend-design-*` helper stack out of the recommended path. Prefer the modern route through `frontend-design`, `design`, `design-system`, and the owning execution surface.

## Output Format

Deliver:

1. Direction name
2. Style contract
3. Visual, content/system, and interaction theses
4. Chosen downstream route
5. Non-negotiable anti-generic constraints
6. Next artifact to produce

## References

| File | Load when |
| --- | --- |
| `../design/references/visual-direction.md` | Need sharper direction naming, mood, motif, or anti-generic constraints. |
| `../design/references/design-tokens.md` | Need token language, semantic aliases, or system cues before downstream execution. |
| `../web-ui-design/references/component-architecture.md` | Need implementation-aware component and state boundaries. |
| `../web-ui-design/references/accessibility.md` | Need keyboard, semantic, or WCAG constraints as part of the handoff. |
| `../web-ui-design/references/responsive-patterns.md` | Need browser responsiveness or container-aware composition. |
| `../web-ui-design/references/animation.md` | Need purposeful motion and reduced-motion constraints. |
| `../design/SKILL.md` | Need audit-first diagnosis and route selection. |
| `../design-system/SKILL.md` | Need canonical `docs/foundation/DESIGN.md` and durable system rules. |
| `../web-ui-design/SKILL.md` | The owning execution surface is browser-first. |
| `../mobile-ui-design/SKILL.md` | The owning execution surface is phone-first. |
| `../desktop-ui-design/SKILL.md` | The owning execution surface is desktop-first. |
