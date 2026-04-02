# Stitch Prompt Structure

Use this order:

1. One-sentence purpose and mood
2. Platform and viewport priority
3. Design-system cues
4. Page or screen structure
5. Exact requested delta if this is an edit

## Recommended shape

```markdown
[One-line purpose and visual direction]

Platform: [web/mobile], [desktop-first/mobile-first]
Theme: [light/dark], [2-4 style adjectives]
Design system:
- [semantic color role] -> [description]
- [typography or spacing rule]
- [shape or motion rule]

Structure:
1. [Section or component]
2. [Section or component]
3. [Section or component]

Edit scope:
- [one change]
- [optional second change]
```

## Avoid

- full repo dumps
- whole documentation files
- contradictory style instructions
- five unrelated changes in one edit prompt
