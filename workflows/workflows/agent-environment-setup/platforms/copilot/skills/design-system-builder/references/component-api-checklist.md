# Component API Checklist

Load this when system-level component work needs more structure.

## Reusability test

- Confirm the component belongs in the system, not only one screen.
- Keep product-specific behaviors out of shared primitives.

## API design

- Expose semantic props instead of raw style knobs by default.
- Keep states, variants, and accessibility behavior explicit.
- Use tokens instead of hardcoded visual values.

## Documentation and maintenance

- Document intended use, anti-use, and composition rules.
- Keep theming hooks and extensibility deliberate.
- Re-check whether the system stays smaller and clearer after the addition.
