# Component API Checklist

Review every new component against this checklist before merging.

## API Design

- [ ] Props are typed with TypeScript (no `any`)
- [ ] Variant props use union types, not booleans (`variant="primary"` not `primary={true}`)
- [ ] Default values are sensible — component works with zero props
- [ ] Prop names are consistent with existing components (e.g., `size` not `sz`)
- [ ] Destructured props spread remaining attributes to root element (`...rest`)
- [ ] Component accepts `className` / `style` for escape-hatch customization
- [ ] Ref forwarding is implemented (`forwardRef` or equivalent)

## Token Usage

- [ ] All colors reference semantic tokens (no hardcoded hex/rgb/hsl)
- [ ] All spacing uses spacing scale tokens
- [ ] Typography uses type scale tokens
- [ ] Border radius uses radius tokens
- [ ] Shadows use shadow scale tokens
- [ ] Transitions use motion tokens (duration + easing)

## Accessibility

- [ ] Semantic HTML element used (button, input, nav — not div)
- [ ] ARIA attributes added where native semantics insufficient
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape, Arrows)
- [ ] Focus indicator is visible and follows system focus style
- [ ] Screen reader announces component purpose and state changes
- [ ] Color is not the only indicator of state (icons, text, patterns)
- [ ] Touch target ≥ 44×44px on mobile

## Theming

- [ ] Works correctly in light mode
- [ ] Works correctly in dark mode
- [ ] Contrast ratios pass WCAG AA in both themes
- [ ] Component tokens can be overridden via CSS custom properties

## Composition

- [ ] Component can be used standalone
- [ ] Component composes with sibling components (e.g., Button inside ButtonGroup)
- [ ] Slot pattern or children used for flexible content (not excessive string props)
- [ ] No circular dependencies with other components

## Testing

- [ ] Unit test covers all variants and states
- [ ] Interaction test covers keyboard and click behavior
- [ ] Visual regression test captures all variant screenshots
- [ ] Accessibility test (axe or equivalent) passes
- [ ] Edge cases tested (empty content, long text, RTL)

## Documentation

- [ ] Props table with types, defaults, descriptions
- [ ] At least one "do" example
- [ ] At least one "don't" example
- [ ] Accessibility notes (keyboard, ARIA, screen reader)
- [ ] Migration notes (if replacing an existing component)
