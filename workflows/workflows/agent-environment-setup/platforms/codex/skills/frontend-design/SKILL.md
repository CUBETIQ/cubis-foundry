---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with strong visual direction. Use for design systems, components, pages, dashboards, landing pages, accessibility, and polished UI work that should avoid generic AI aesthetics.
---
# Frontend Design

## Purpose

Provide systematic guidance for building distinctive, production-grade frontend interfaces with real visual intent. Covers component architecture, design systems, accessibility compliance, responsive layout strategies, design token systems, and the aesthetic decisions that make an interface feel deliberate instead of generic. Ensures that frontend code is maintainable, accessible, performant, and visually cohesive across an entire product surface.

## When to Use

- Designing or reviewing component architecture for a frontend application
- Building or extending a design system with tokens, primitives, and composites
- Designing a landing page, dashboard, marketing surface, or application shell that needs a clear visual point of view
- Implementing accessible forms, navigation, or interactive widgets
- Creating responsive layouts that adapt gracefully across viewport sizes
- Defining or auditing design token structures (color, spacing, typography)
- Reviewing animation and motion patterns for usability and performance
- Establishing frontend coding standards for a team or project
- Beautifying an existing UI that feels flat, generic, or inconsistent

## Instructions

1. **Commit to a visual direction before writing code** — Define the product mood, audience, density, typography voice, palette character, and motion style before choosing components so that the interface has a coherent point of view instead of defaulting to generic SaaS patterns. See `references/visual-direction.md`.

2. **Identify the component taxonomy before writing code** — Classify every UI element as a primitive (Button, Input), composite (SearchBar, Card), or layout (PageShell, Sidebar) so that responsibilities never bleed across layers and reuse is maximized.

3. **Define design tokens as the single source of truth** — Extract every raw color, spacing value, font size, shadow, radius, and motion duration into a token layer (CSS custom properties or a theme object) so that visual consistency is enforced by the system rather than by discipline. See `references/design-tokens.md`.

4. **Use semantic token aliases on top of raw values** — Map raw tokens (e.g., `--color-blue-500`) to semantic aliases (e.g., `--color-primary`, `--color-danger`) so that theme switching and brand updates require changes in one place only.

5. **Make the system visually opinionated, not merely tidy** — Pick one or two strong motifs for typography, shape, contrast, or composition and repeat them intentionally so that the design system communicates identity rather than just consistency. See `references/visual-direction.md`.

6. **Structure components with explicit prop contracts** — Every component must declare its props with types, defaults, and documentation so that consumers never have to read implementation code to understand the API surface.

7. **Separate presentational and behavioral concerns** — Keep visual rendering in stateless presentational components and state management in container components or hooks so that each can be tested and iterated independently. See `references/component-architecture.md`.

8. **Implement accessibility from the start, not as a retrofit** — Use semantic HTML, ARIA attributes, keyboard navigation, focus management, and screen reader testing as first-class development steps so that compliance is structural rather than cosmetic. See `references/accessibility.md`.

9. **Design for all interaction states** — Every interactive element must define idle, hover, focus, active, disabled, loading, error, success, and empty states so that the interface communicates status unambiguously at all times.

10. **Use container queries for component-level responsiveness** — Prefer `@container` over `@media` for component layouts so that components adapt to their container context rather than the viewport, enabling true reusability. See `references/responsive-patterns.md`.

11. **Apply fluid typography and spacing with clamp()** — Use `clamp(min, preferred, max)` for font sizes and spacing so that the interface scales smoothly without hard breakpoint jumps.

12. **Implement motion with purpose and restraint** — Use animation only to communicate state changes, guide attention, or provide feedback. Always respect `prefers-reduced-motion`, and prefer a few memorable transitions over many decorative ones. See `references/animation.md`.

13. **Enforce a consistent spacing scale** — Use a geometric or modular spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48, 64) so that spatial relationships are harmonious and predictable across the entire interface.

14. **Build forms with validation feedback loops** — Combine inline validation, field-level error messages, and summary feedback so that users can correct errors without re-reading the entire form.

15. **Use compound component patterns for complex widgets** — Express multi-part components (Tabs, Accordion, Dropdown) as compound components with shared context so that consumers have compositional flexibility without exposing internal state.

16. **Optimize rendering performance proactively** — Memoize expensive computations, virtualize long lists, lazy-load below-fold content, and avoid layout thrashing so that the interface remains responsive under real-world data volumes.

17. **Document component usage with live examples** — Provide at least one usage example per component variant in a Storybook or equivalent catalog so that the design system is self-documenting and always up to date.

18. **Test visual regressions alongside functional behavior** — Combine unit tests for logic, integration tests for composition, and visual regression snapshots for appearance so that refactors cannot silently break the user experience.

## Output Format

Deliver:

1. **Visual direction summary** — The chosen aesthetic direction, intended tone, and the design motifs that should repeat across the surface
2. **Component code** — Production-ready source with typed props, semantic HTML, and design token usage
3. **Token definitions** — CSS custom properties or theme object with raw and semantic token layers
4. **Accessibility audit** — WCAG compliance notes: contrast ratios, keyboard flow, ARIA usage
5. **Responsive behavior** — Breakpoint strategy or container query usage with before/after viewport descriptions
6. **Usage example** — A concrete code snippet showing the component in a realistic context

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/component-architecture.md` | Task involves component hierarchy, composition patterns, or state management boundaries. |
| `references/design-tokens.md` | Task involves token definition, theme switching, or visual consistency enforcement. |
| `references/visual-direction.md` | Task involves making the UI feel more distinctive, choosing typography/color/motion direction, or fixing generic aesthetics. |
| `references/accessibility.md` | Task involves ARIA, keyboard navigation, screen readers, or WCAG compliance. |
| `references/responsive-patterns.md` | Task involves responsive layout, container queries, fluid grids, or adaptive design. |
| `references/animation.md` | Task involves transitions, micro-interactions, easing curves, or motion accessibility. |

## Codex Platform Notes

- Specialists are internal reasoning postures, not spawned subagent processes.
- Reference the repo-root AGENTS instructions for posture definitions and switching contracts.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
