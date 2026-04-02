# Foundation

## Core stance

- Start from tasks, not decoration.
- Pick a clear design direction before drawing layouts.
- Share product language and tokens across surfaces, not identical composition.
- Make hierarchy visible through spacing, scale, contrast, and alignment.
- Use density intentionally. Comfortable is not always better. Dense is not always better.
- Reward expert users with faster paths, visible context, and lower interaction cost.

## Intake questions

Answer these before proposing screens:

1. Who is the primary user and what are they trying to finish fast?
2. What is the hardest repeated task?
3. Which information must stay visible while the user works?
4. Which actions are frequent, destructive, or high-stakes?
5. Which surfaces matter right now: mobile, web, desktop, or multiple?
6. Does the product need browsing, creation, monitoring, communication, or analysis?
7. What level of polish and brand distinctiveness does the brief require?

## System layers

Build from the bottom up:

1. Raw tokens
2. Semantic tokens
3. Primitives
4. Composite patterns
5. Screens

## Composition rules

- Separate content, layout, and behavior concerns.
- Define explicit variants for size, emphasis, density, and state.
- Prefer a small number of strong patterns reused well.
- Keep component APIs explicit.
- Let the same component have platform-specific presentation when the interaction model changes.

## State model

Every important flow should define these states when relevant:

- default
- hover
- focus-visible
- active
- selected
- disabled
- empty
- loading
- refreshing
- success
- warning
- error
- destructive confirm
- offline
- syncing
- permission denied

## Cross-platform rules

- Share nouns, information model, and semantic tokens.
- Adapt verbs, layout, navigation, and density by surface.
- Use progressive disclosure on mobile.
- Use balanced information exposure on web.
- Use persistent context, shortcuts, and multi-pane structure on desktop.
- Keep brand continuity through type, color logic, icon language, and voice.
