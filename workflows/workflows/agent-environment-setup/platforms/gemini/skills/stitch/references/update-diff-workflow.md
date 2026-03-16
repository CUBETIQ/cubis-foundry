# Stitch Update and Diff Workflow

## Recommended sequence

1. Fetch the latest Stitch artifact for the target screen.
2. Identify the current local implementation files before editing anything.
3. Compare structure, copy, spacing, tokens, states, assets, and responsive behavior.
4. Patch only the deltas that come from Stitch.
5. Re-check accessibility and regression risk after the patch.

## Minimal-diff rules

- Keep existing data flow, component ownership, and test seams unless Stitch requires a structural change.
- Avoid replacing an entire screen when a smaller patch will preserve local stability.
- Preserve local fixes that are unrelated to the new Stitch diff.

## Report drift explicitly

If you keep a local deviation from Stitch, document:

- what differs
- why the local version stays different
- whether the difference is architectural, product-driven, or temporary
