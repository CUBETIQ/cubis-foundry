# Review Checklists

## Quick Component Review (5 min)

- [ ] Correct semantic HTML element
- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] Visible focus indicator
- [ ] Design tokens used (no hardcoded colors/spacing)
- [ ] Loading and error states handled
- [ ] TypeScript types (no `any`)

## PR Review (15 min)

Everything in Quick Review, plus:

- [ ] No accessibility regressions (heading hierarchy, ARIA)
- [ ] Images have alt text and dimensions
- [ ] New dependencies justified and tree-shakeable
- [ ] No unnecessary re-renders
- [ ] Responsive behavior works (mobile-first)
- [ ] Error boundaries at appropriate levels
- [ ] Tests cover key interactions

## Full Audit (30+ min)

Everything in PR Review, plus:

- [ ] Color contrast passes WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Screen reader experience tested
- [ ] Animation respects prefers-reduced-motion
- [ ] Layout shifts measured (CLS target < 0.1)
- [ ] Bundle size impact analyzed
- [ ] Forms: labels, validation, error association
- [ ] State management: correct level, cleanup, race conditions
- [ ] Component API: consistent with design system patterns
- [ ] Documentation: props, usage examples, a11y notes

## CSS/Styles Review

- [ ] Uses design tokens, not hardcoded values
- [ ] Mobile-first media queries
- [ ] No `!important` (except utility overrides)
- [ ] No overly specific selectors (max 2-3 levels)
- [ ] Dark mode tested
- [ ] Container queries used where component-level responsiveness needed
- [ ] Animations use transform/opacity only
- [ ] No layout-triggering properties in animations
