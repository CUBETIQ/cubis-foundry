# Stitch Implementation Patterns

## Web stacks

- Translate layout intent first: shell, sections, cards, navigation, and hierarchy.
- Reuse the repo's token layer, typography scale, spacing system, and component primitives.
- Prefer existing app-shell conventions, routing boundaries, and data-loading patterns over literal generated structure.
- Preserve semantic HTML and keyboard/focus behavior.

## Mobile stacks

- Preserve layout rhythm, states, and information hierarchy rather than copying web-specific markup.
- Map Stitch components into platform-native primitives such as React Native components, Flutter widgets, or SwiftUI views.
- Respect platform navigation, safe areas, typography scaling, and gesture behavior.

## Design system mapping

- Convert raw visual values into the project's design tokens.
- Reuse shared primitives before introducing new component variants.
- If a missing primitive blocks fidelity, add the smallest reusable abstraction instead of a screen-local workaround.
