---
name: frontend-design
description: Frontend UI/UX design patterns covering component architecture, design systems, accessibility, responsive patterns, and design tokens for production-grade interfaces.
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Frontend Design

## Purpose

Provide systematic guidance for building production-grade frontend interfaces using proven UI/UX design patterns. Covers component architecture, design systems, accessibility compliance, responsive layout strategies, and design token systems. Ensures that frontend code is maintainable, accessible, performant, and visually consistent across an entire product surface.

## When to Use

- Designing or reviewing component architecture for a frontend application
- Building or extending a design system with tokens, primitives, and composites
- Implementing accessible forms, navigation, or interactive widgets
- Creating responsive layouts that adapt gracefully across viewport sizes
- Defining or auditing design token structures (color, spacing, typography)
- Reviewing animation and motion patterns for usability and performance
- Establishing frontend coding standards for a team or project

## Instructions

1. **Identify the component taxonomy before writing code** — Classify every UI element as a primitive (Button, Input), composite (SearchBar, Card), or layout (PageShell, Sidebar) so that responsibilities never bleed across layers and reuse is maximized.

2. **Define design tokens as the single source of truth** — Extract every raw color, spacing value, font size, and shadow into a token layer (CSS custom properties or a theme object) so that visual consistency is enforced by the system rather than by discipline. See `references/design-tokens.md`.

3. **Use semantic token aliases on top of raw values** — Map raw tokens (e.g., `--color-blue-500`) to semantic aliases (e.g., `--color-primary`, `--color-danger`) so that theme switching and brand updates require changes in one place only.

4. **Structure components with explicit prop contracts** — Every component must declare its props with types, defaults, and documentation so that consumers never have to read implementation code to understand the API surface.

5. **Separate presentational and behavioral concerns** — Keep visual rendering in stateless presentational components and state management in container components or hooks so that each can be tested and iterated independently. See `references/component-architecture.md`.

6. **Implement accessibility from the start, not as a retrofit** — Use semantic HTML, ARIA attributes, keyboard navigation, focus management, and screen reader testing as first-class development steps so that compliance is structural rather than cosmetic. See `references/accessibility.md`.

7. **Design for all interaction states** — Every interactive element must define idle, hover, focus, active, disabled, loading, error, and empty states so that the interface communicates status unambiguously at all times.

8. **Use container queries for component-level responsiveness** — Prefer `@container` over `@media` for component layouts so that components adapt to their container context rather than the viewport, enabling true reusability. See `references/responsive-patterns.md`.

9. **Apply fluid typography and spacing with clamp()** — Use `clamp(min, preferred, max)` for font sizes and spacing so that the interface scales smoothly without hard breakpoint jumps.

10. **Implement motion with purpose and restraint** — Use animation only to communicate state changes, guide attention, or provide feedback. Always respect `prefers-reduced-motion`. See `references/animation.md`.

11. **Enforce a consistent spacing scale** — Use a geometric or modular spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48, 64) so that spatial relationships are harmonious and predictable across the entire interface.

12. **Build forms with validation feedback loops** — Combine inline validation, field-level error messages, and summary feedback so that users can correct errors without re-reading the entire form.

13. **Use compound component patterns for complex widgets** — Express multi-part components (Tabs, Accordion, Dropdown) as compound components with shared context so that consumers have compositional flexibility without exposing internal state.

14. **Optimize rendering performance proactively** — Memoize expensive computations, virtualize long lists, lazy-load below-fold content, and avoid layout thrashing so that the interface remains responsive under real-world data volumes.

15. **Document component usage with live examples** — Provide at least one usage example per component variant in a Storybook or equivalent catalog so that the design system is self-documenting and always up to date.

16. **Test visual regressions alongside functional behavior** — Combine unit tests for logic, integration tests for composition, and visual regression snapshots for appearance so that refactors cannot silently break the user experience.

## Output Format

Deliver:

1. **Component code** — Production-ready source with typed props, semantic HTML, and design token usage
2. **Token definitions** — CSS custom properties or theme object with raw and semantic token layers
3. **Accessibility audit** — WCAG compliance notes: contrast ratios, keyboard flow, ARIA usage
4. **Responsive behavior** — Breakpoint strategy or container query usage with before/after viewport descriptions
5. **Usage example** — A concrete code snippet showing the component in a realistic context

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/component-architecture.md` | Task involves component hierarchy, composition patterns, or state management boundaries. |
| `references/design-tokens.md` | Task involves token definition, theme switching, or visual consistency enforcement. |
| `references/accessibility.md` | Task involves ARIA, keyboard navigation, screen readers, or WCAG compliance. |
| `references/responsive-patterns.md` | Task involves responsive layout, container queries, fluid grids, or adaptive design. |
| `references/animation.md` | Task involves transitions, micro-interactions, easing curves, or motion accessibility. |
