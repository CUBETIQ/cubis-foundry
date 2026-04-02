# Polish, Accessibility, and Motion

## Table of contents
1. Anti-patterns
2. Visual polish checklist
3. Accessibility checklist
4. Motion rules
5. Performance rules

## Anti-patterns

Watch for these common weak patterns:

- every section placed inside a floating card
- unclear hierarchy hidden behind decorative gradients
- giant border radii with no structural reason
- center-aligned enterprise dashboards
- tiny muted labels on complex surfaces
- too many competing accent colors
- motion used to look expensive instead of helping comprehension

## Visual polish checklist

- Use 1 dominant visual idea, not 5 minor ones.
- Make headings, body, secondary text, and metadata visibly distinct.
- Keep alignment strict.
- Reuse spacing values instead of improvising them.
- Use borders, fills, and shadows intentionally. Not all at once.
- Keep icon style consistent.
- Let destructive, warning, and success colors be rare and meaningful.
- Tighten empty states so they teach the next action.
- Remove decorative components that do not carry meaning.

## Accessibility checklist

- Design for keyboard, screen reader structure, and focus-visible cues.
- Use semantic labels and headings.
- Keep contrast strong enough for text, controls, and state indicators.
- Do not rely on color alone for meaning.
- Respect reduced motion preferences.
- Make error messages specific and actionable.
- Ensure hit targets and spacing support touch where relevant.
- Keep zoom and text scaling from breaking the layout.

## Motion rules

- Motion should explain change, reinforce causality, or preserve context.
- Use the least motion that still clarifies the transition.
- Prefer opacity and transform-based transitions.
- Keep feedback fast for high-frequency actions.
- Use stronger motion only for onboarding, delight, or major state change.
- Avoid motion on every hover or every page region.

## Performance rules

- Prefer simple transitions over layout-heavy animation.
- Avoid long chains of animated elements.
- Load meaningful structure first, not only blank skeletons.
- Keep the interface usable before every enhancement is ready.
- Design states that fail gracefully under slow networks or heavy data.
