# Visual Direction

## Start With a Point of View

Before choosing components or utilities, define the interface's intended character:

- Audience: power users, executives, consumers, internal operators, creators
- Mood: calm, technical, editorial, playful, luxurious, urgent, trustworthy
- Density: compact and information-rich, or spacious and presentational
- Dominant motif: crisp grid, soft cards, sharp typography, strong contrast, layered depth, restrained motion

Write this down in one short paragraph before implementation. If the direction is not explicit, the UI usually collapses into generic defaults.

## Avoid Generic Defaults

A polished interface is not just "clean." It should make a few deliberate choices:

- Typography should have hierarchy and personality, not just a default sans stack everywhere.
- Color should create emphasis and mood, not just satisfy token completeness.
- Spacing should create rhythm, with clear contrast between tight, normal, and spacious zones.
- Shape should be intentional: radii, borders, and shadows should feel like one system.
- Motion should reinforce hierarchy and feedback, not exist as decoration.

If every section uses the same card, the same radius, the same muted palette, and the same spacing, the design system is coherent but forgettable.

## Build a Distinctive System

Use the design system to encode visual identity:

- Pick one primary typography move.
  Examples: oversized headlines, narrow technical labels, editorial serif accents, compact operational tables.
- Pick one compositional move.
  Examples: asymmetrical hero layouts, stacked panels, dense dashboards with strong dividers, large whitespace bands.
- Pick one emphasis move.
  Examples: saturated accent color, crisp monochrome contrast, warm surface tinting, dramatic border treatment.

Repeat those moves consistently so the product feels designed rather than assembled.

## Match Expression to the Surface

Not every UI needs the same level of visual energy.

- Marketing pages can be bolder with typography, composition, and motion.
- Product dashboards should prioritize hierarchy, scannability, and state clarity.
- Internal tools can be visually restrained, but still need rhythm, contrast, and polish.
- Design systems should support both expressive and quiet surfaces without becoming visually noisy.

The goal is not maximal flair. The goal is a deliberate fit between the interface and the job it needs to do.

## Practical Checks

Before shipping, verify:

- The interface can be described in a few visual adjectives, and the result matches them.
- Headings, body text, labels, and controls have meaningful contrast in scale and weight.
- Surfaces, borders, and shadows form a recognizable visual language.
- Important actions and states stand out immediately without relying only on color.
- The design still feels intentional on mobile, not just compressed from desktop.

If those checks fail, improve the direction before adding more components.
