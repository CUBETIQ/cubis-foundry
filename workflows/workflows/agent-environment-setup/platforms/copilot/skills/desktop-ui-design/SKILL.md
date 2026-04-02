---
name: desktop-ui-design
description: Design desktop-first interfaces with multi-pane structure,
  keyboard-first productivity, high-information-density clarity, and
  implementation-aware handoff for desktop-grade app surfaces.
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---
# Desktop UI Design

## Purpose

Provide the desktop-first execution surface for design work. Use it when the task needs a concrete desktop workspace, dense operational surface, or expert-oriented app shell that should not be flattened into a mobile or generic web layout.

Desktop UI should reward expertise. It should expose more context, faster actions, and more comparison power than the same product would on mobile or narrow web surfaces.

## Instructions

1. Start from the canonical direction chosen in `../design/SKILL.md`, then restate the desktop job to be done before proposing structure.
2. Use `../design/references/foundation.md` to define the persistent context, information model, and task cadence before composing the screen.
3. Use `../design/references/responsive-adaptive-systems.md` when the same product spans mobile, web, and desktop so the desktop surface gains real context and speed instead of just larger cards.
4. Prefer desktop-native structures. Use `../design/references/desktop-app-ui-design.md` when pane models, inspector layouts, dense data behavior, or expert throughput need a sharper desktop-specific frame.
5. Design for pointer and keyboard first. Make shortcuts, multi-select, drag/drop, inline edit, and dense-but-readable data presentation explicit when relevant.
6. Specify desktop state behavior clearly: empty, loading, background sync, error, destructive confirmation, multi-selection state, and panel persistence. Use `../design/references/polish-accessibility-motion.md` when density, focus behavior, motion, or interaction polish needs a final pass.
7. End with a desktop-ready handoff using `../design/references/output-template.md`: workspace structure, pane rules, productivity affordances, state model, and implementation notes.

## Desktop Direction Rules

- desktop is not a blown-up mobile app
- persistent context should be introduced when it reduces navigation cost
- dense views must be aligned and legible, not cluttered
- keyboard, batch actions, and comparison views should be considered by default
- use panes, inspectors, and tables where they improve throughput

## Anti-patterns

- Do not route or critique the task from this surface; those belong in `../design/SKILL.md`.
- Do not stack every region into mobile-style cards on desktop.
- Do not hide frequent expert actions behind too many drawers, hovers, or menus.
- Do not use oversized whitespace that reduces scan speed on dense work surfaces.
- Do not treat desktop as responsive web only when the task clearly benefits from adaptive multi-pane structure.

## Output Format

Return:

1. Desktop job and visual thesis
2. Workspace structure and pane model
3. Navigation, shortcuts, and productivity rules
4. States, density, and comparison behavior
5. Implementation-ready handoff notes

## References

- `../design/SKILL.md`
- `../design/references/desktop-app-ui-design.md`
- `../design/references/foundation.md`
- `../design/references/responsive-adaptive-systems.md`
- `../design/references/output-template.md`
- `../design/references/polish-accessibility-motion.md`
- `../design/references/visual-direction.md`
- `../design/references/design-tokens.md`
