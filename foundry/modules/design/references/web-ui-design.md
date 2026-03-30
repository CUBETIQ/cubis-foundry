# Web UI Design

## Table of contents
1. Core stance
2. Web surface types
3. Navigation and layout
4. Responsive behavior
5. Forms, data, and content
6. Web checklist

## Core stance

Web UI must balance flexibility, performance, semantics, and wide device variability. Design for keyboard and pointer by default, but make touch support graceful. Use content hierarchy and layout rhythm to make scanning fast.

## Web surface types

Identify the surface before designing:

- Marketing or landing surface
- Product app or dashboard
- Admin console
- Documentation or knowledge base
- Marketplace or catalog

Each surface has different density, navigation, and content needs. Do not apply landing-page patterns to data-heavy product screens.

## Navigation and layout

- Use header navigation for broad top-level movement.
- Use side rails or sidebars for task-heavy product areas.
- Use breadcrumbs when hierarchy matters.
- Constrain line length for reading surfaces.
- Use max content widths or modular grids to avoid overly stretched layouts.
- Prefer container-based layout decisions for reusable modules.

## Responsive behavior

- Start from content breakpoints, not device marketing names.
- Use container queries or component-level layout rules when modules move across contexts.
- Collapse secondary actions before collapsing primary information.
- Transform tables intentionally on small screens. Use horizontal scroll, pinned keys, summaries, or alternate views instead of crushing columns.
- Keep navigation clear as width shrinks. Hidden nav is expensive.

## Forms, data, and content

- Use semantic structure and meaningful labels.
- Keep form grouping obvious.
- Align numeric data for scanning.
- Use filters, saved views, and sort order deliberately.
- Design empty states that teach the next step.
- Keep hover as a bonus, never the only path.

## Web checklist

- Does the layout stay readable from narrow to wide widths?
- Is there a clear semantic hierarchy?
- Are tables and filters usable on smaller breakpoints?
- Can every important interaction be completed with keyboard and focus-visible cues?
- Is the design using max widths or extra panels instead of uncontrolled full-width stretch?
- Are marketing and application patterns kept distinct?
