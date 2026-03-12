# /audit

Run technical quality checks on a page or component.

## What It Does

Performs a systematic audit checking accessibility, performance, and responsive behavior. Produces actionable findings with severity and specific fix recommendations.

## Checklist

### Accessibility

- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- [ ] All images have meaningful alt text
- [ ] Interactive elements are keyboard-navigable
- [ ] Focus indicators are visible
- [ ] ARIA attributes are correct and present where needed
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Form inputs have associated labels

### Performance

- [ ] Images are appropriately sized and use modern formats (WebP/AVIF)
- [ ] Fonts are preloaded and use `font-display: swap`
- [ ] No render-blocking resources in the critical path
- [ ] Animations use transform/opacity only (GPU-friendly)
- [ ] No layout shifts from unsized images or dynamic content

### Responsive

- [ ] Content readable at 320px without horizontal scroll
- [ ] Touch targets ≥ 44px on mobile
- [ ] No text smaller than 16px on mobile
- [ ] Navigation accessible at all breakpoints
- [ ] Images scale correctly with preserved aspect ratios

## Output Format

```
🔴 CRITICAL — [Issue] at [location]
   Fix: [specific recommendation]

🟡 WARNING — [Issue] at [location]
   Fix: [specific recommendation]

🟢 PASS — [What was checked and passed]
```

## Usage

- `/audit` — audit the entire page
- `/audit header` — audit only the header section
- `/audit forms` — audit form accessibility specifically
