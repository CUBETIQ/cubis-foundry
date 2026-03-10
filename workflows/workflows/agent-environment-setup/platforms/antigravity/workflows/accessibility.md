---
command: "/accessibility"
description: "Run a structured accessibility audit on web UI code with WCAG 2.2 AA compliance checks, ARIA validation, keyboard navigation testing, and screen reader verification."
triggers:
  [
    "accessibility",
    "a11y",
    "wcag",
    "aria",
    "screen reader",
    "keyboard navigation",
  ]
---

# Accessibility Audit Workflow

# Run this when UI code needs accessibility verification or when building new interactive components.

## When to use

Use this when building or reviewing web UI — forms, modals, navigation, data tables, or any interactive component that users operate with keyboard, screen reader, or assistive technology.

## Routing

- Primary auditor: `@frontend-specialist`
- Detailed ARIA patterns: `@frontend-specialist` with `accessibility` skill
- Security context (auth flows): `@security-auditor`
- Automated testing: `@test-engineer` with `playwright-e2e` skill

## Workflow steps

### Phase 1: Automated scan

1. Run axe-core or similar automated checker against the target pages/components.
2. Collect all violations grouped by severity (critical, serious, moderate, minor).
3. Document which WCAG success criteria are violated.

### Phase 2: Keyboard audit

4. Tab through every interactive element — verify logical focus order.
5. Verify all actions are reachable without a mouse.
6. Check visible focus indicators on every focusable element.
7. Test Escape key dismisses overlays (modals, dropdowns, tooltips).
8. Verify no keyboard traps exist.

### Phase 3: Screen reader check

9. Navigate with VoiceOver (macOS) or NVDA (Windows).
10. Verify all images have meaningful alt text (or empty alt for decorative).
11. Check form labels are programmatically associated with inputs.
12. Verify dynamic content changes are announced via aria-live regions.
13. Check landmark roles are present and meaningful (main, nav, aside, etc.).

### Phase 4: Visual and cognitive

14. Check color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text and UI components).
15. Verify content is readable at 200% zoom.
16. Check motion and animation respect prefers-reduced-motion.
17. Verify error messages are clear, specific, and associated with inputs.

### Phase 5: Fix and verify

18. Prioritize fixes: critical > serious > moderate > minor.
19. Fix issues with correct ARIA patterns (not ARIA overuse).
20. Re-run automated scan after fixes to confirm resolution.
21. Manual retest of keyboard and screen reader for fixed components.

## Context notes

- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach screenshots, component names, or URLs when context is incomplete.
- Focus on WCAG 2.2 AA as the baseline. Escalate to AAA only when explicitly requested.
- Prioritize fixes that affect the most users first (keyboard > screen reader > color contrast > cognitive).

## Skill Routing

- Primary skills: `accessibility`
- Supporting skills (optional): `react-expert`, `nextjs-developer`, `design-system-builder`, `tailwind-patterns`
- Load `accessibility` for WCAG criteria reference and ARIA pattern guidance.

## Verification

- axe-core scan passes with zero critical or serious violations.
- All interactive elements are keyboard-accessible.
- Screen reader announces all content in logical order.
- Color contrast meets WCAG AA thresholds.

## Output Contract

```yaml
A11Y_AUDIT_RESULT:
  primary_agent: frontend-specialist
  supporting_agents: [test-engineer?]
  primary_skills: [accessibility]
  pages_audited: [<string>]
  violations:
    critical: <number>
    serious: <number>
    moderate: <number>
    minor: <number>
  wcag_criteria_failed: [<string>]
  keyboard_issues: [<string>] | []
  screen_reader_issues: [<string>] | []
  fixes_applied: [<string>]
  remaining_issues: [<string>] | []
  verdict: PASS | FAIL | PASS_WITH_WARNINGS
```
