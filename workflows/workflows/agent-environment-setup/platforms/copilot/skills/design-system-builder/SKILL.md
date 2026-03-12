---
name: design-system-builder
description: Build and maintain token-driven design systems with reusable components, semantic APIs, variant patterns, and theming support across frameworks.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---
# Design System Builder

## Purpose

Guide the creation and maintenance of design systems — the foundational layer of tokens, primitives, and components that ensure visual and behavioral consistency across an application.

## When to Use

- Creating a new design system or component library from scratch
- Adding components to an existing design system
- Reviewing component APIs for consistency and composability
- Setting up design tokens (color, spacing, typography, motion)
- Building theming support (light/dark, brand variants)
- Auditing an existing system for token coverage or API drift

## Instructions

### Step 1 — Audit the Current State

Before building anything, understand what exists:

1. Inventory existing components — list every reusable UI element
2. Catalog design tokens — identify hardcoded values that should be tokens
3. Check naming conventions — are components and tokens named consistently?
4. Identify gaps — what's missing vs. what the product actually needs?

**DO**: Start from real product needs, not hypothetical components.
**DON'T**: Build components speculatively — every component must have at least 2 real use cases.

### Step 2 — Define the Token Layer

Tokens are the single source of truth for all visual decisions.

#### Token Categories

```
├── color/
│   ├── primitive/     (blue-500, gray-100 — raw palette)
│   ├── semantic/      (text-primary, surface-elevated — meaning-based)
│   └── component/     (button-bg, card-border — component-specific)
├── spacing/           (space-1 through space-12, based on 4px or 8px grid)
├── typography/        (font-family, font-size scale, line-height, font-weight)
├── radius/            (radius-sm, radius-md, radius-lg, radius-full)
├── shadow/            (shadow-sm, shadow-md, shadow-lg — elevation levels)
├── motion/            (duration-fast, duration-normal, easing-default)
└── breakpoint/        (sm, md, lg, xl — responsive thresholds)
```

**Rules**:
- Primitive tokens hold raw values (never use directly in components)
- Semantic tokens reference primitives and encode meaning
- Component tokens reference semantic tokens for local overrides
- Never hardcode values in components — always reference tokens

### Step 3 — Design Component APIs

Every component should follow these API principles:

1. **Predictable** — props follow consistent patterns across components
2. **Composable** — small components combine into larger patterns
3. **Constrained** — expose only the variants the system supports
4. **Accessible** — ARIA, keyboard, and screen reader support built-in

#### Component Anatomy

```
ComponentName/
├── index.{ts,tsx}         (public API — exports only what consumers need)
├── ComponentName.{tsx}    (implementation)
├── ComponentName.test.{tsx} (unit + interaction tests)
├── ComponentName.stories.{tsx} (visual documentation)
├── variants.ts            (variant definitions — size, color, state)
└── tokens.ts              (component-level token overrides)
```

#### Variant Pattern

Use variants (not boolean flags) for visual options:

```
// DO: Constrained variants
<Button variant="primary" size="md" />
<Button variant="ghost" size="sm" />

// DON'T: Boolean flag explosion
<Button primary large outlined rounded />
```

### Step 4 — Build Theming Support

Themes override semantic tokens without changing component logic.

**Light/Dark**:
- Swap surface lightness, reduce chroma in dark mode
- Test contrast ratios in both themes
- Never use `color-scheme: dark` alone — define explicit token overrides

**Brand Variants**:
- Override only the accent/brand color tokens
- Keep neutral palette, spacing, and typography consistent across brands

**Implementation**:
- CSS: Use CSS custom properties scoped to `[data-theme]` or `:root`
- JS frameworks: Use context/provider pattern for runtime theming
- Ensure tokens cascade correctly (component < semantic < primitive)

### Step 5 — Document and Enforce

Every component needs:

1. **API docs** — props table with types, defaults, and descriptions
2. **Usage examples** — at least one "do" and one "don't"
3. **Visual examples** — rendered variants (Storybook or equivalent)
4. **Accessibility notes** — keyboard behavior, ARIA attributes, screen reader output

**Enforcement**:
- Lint rules preventing hardcoded values (e.g., no raw hex colors)
- Visual regression tests for all component variants
- Bundle size tracking per component
- Prop type validation / TypeScript strict mode

### Step 6 — Keep the System Small

**Rules for growth**:
- A component must have ≥ 2 real use cases before extraction
- Prefer composition over new components — combine existing primitives first
- Regularly audit for unused or redundant components
- Remove components that lost their second use case

## Output Format

When creating or reviewing design system work, structure responses as:

1. **Token audit** — what's hardcoded vs. tokenized
2. **Component API** — props, variants, composition points
3. **Theme compatibility** — does it work in light/dark/brand contexts?
4. **Code** — implementation with token references, accessibility, tests
5. **Migration notes** — how to adopt without breaking existing usage

## References

- [references/token-architecture.md](references/token-architecture.md) — token naming, layering, and CSS custom property patterns
- [references/component-api-checklist.md](references/component-api-checklist.md) — API review checklist for new components
- [references/theming-patterns.md](references/theming-patterns.md) — light/dark and brand theming implementation

## Examples

**User**: "Create a Button component for our design system"

**Response approach**: Define variants (primary, secondary, ghost, danger), sizes (sm, md, lg), states (default, hover, active, disabled, loading). Use tokens for all visual properties. Include ARIA attributes, keyboard handling, and loading state. Show usage examples with composition (Button + Icon, ButtonGroup).

**User**: "Audit our design system tokens"

**Response approach**: Scan codebase for hardcoded values. Categorize them (color, spacing, typography, shadow, radius). Propose token names following the naming convention. Show before/after migration for each category.
