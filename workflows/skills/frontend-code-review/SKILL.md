---
name: frontend-code-review
description: Review frontend code for accessibility, performance, state management, rendering efficiency, and design system compliance.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Frontend Code Review

## Purpose

Perform structured code reviews of frontend code, evaluating accessibility, performance, state management, rendering cost, and design system compliance. Produces actionable findings ranked by severity.

## When to Use

- Reviewing a pull request that touches frontend components, styles, or layout
- Auditing an existing page or component for quality issues
- Checking that new code follows team conventions and standards
- Pre-launch review of a feature or page
- When asked to "review", "audit", or "check" frontend code

## Instructions

### Step 1 — Scope the Review

Identify what's being reviewed:

- **Single component**: focus on API, accessibility, and rendering
- **Page/feature**: focus on layout, loading states, and user flow
- **Styles/CSS**: focus on token usage, responsiveness, and specificity
- **Full audit**: run all checks below

### Step 2 — Accessibility Review

Check each item. Mark as pass (✓), fail (✗), or not-applicable (—):

| Check | Details |
|-------|---------|
| Semantic HTML | Correct elements (button, nav, main — not div for everything) |
| Heading hierarchy | h1 → h2 → h3, no skipped levels |
| Keyboard navigation | All interactive elements reachable via Tab, operable via Enter/Space |
| Focus management | Visible focus indicator, focus trapped in modals, restored after close |
| ARIA attributes | Used only when native semantics insufficient, correct roles/states |
| Color contrast | Text ≥ 4.5:1 (normal), ≥ 3:1 (large), UI components ≥ 3:1 |
| Alt text | Images have meaningful alt (or empty alt for decorative) |
| Form labels | Every input has visible label or aria-label, errors linked via aria-describedby |
| Motion | Animations respect prefers-reduced-motion |

### Step 3 — Performance Review

| Check | Details |
|-------|---------|
| Bundle impact | New dependencies justified? Tree-shakeable? Could use native API instead? |
| Render cost | Unnecessary re-renders? Missing memoization on expensive computations? |
| Layout shifts | Images/embeds have dimensions? Dynamic content reserves space? |
| Loading strategy | Lazy-loaded below fold? Code-split at route level? |
| Animation cost | Compositor-only properties (transform, opacity)? No layout-triggering animations? |
| Asset optimization | Images in modern format (WebP/AVIF)? Fonts preloaded? CSS critical path? |

### Step 4 — State Management Review

| Check | Details |
|-------|---------|
| State location | State lives at the right level? Not lifted too high or duplicated? |
| Derived state | Computed from source state, not stored separately? |
| Side effects | Cleanup on unmount? Race conditions handled? Abort controllers used? |
| Loading/error states | All async operations handle loading, success, and error? |
| Form state | Controlled vs uncontrolled appropriate? Validation on blur/submit? |

### Step 5 — Design System Compliance

| Check | Details |
|-------|---------|
| Token usage | Colors, spacing, typography, radius, shadows use design tokens? |
| Component usage | Using system components vs. custom implementations? |
| Naming conventions | Class names, component names follow team patterns? |
| Responsive behavior | Mobile-first? Breakpoints consistent with system? |
| Consistency | Visual style matches existing pages/components? |

### Step 6 — Code Quality

| Check | Details |
|-------|---------|
| TypeScript | Proper types (no `any`), discriminated unions for variants? |
| Component structure | Single responsibility? Reasonable size (< 200 lines)? |
| Error boundaries | Errors caught at appropriate levels? Fallback UI provided? |
| Testing | Key interactions tested? Visual regression coverage? |
| Documentation | Complex logic commented? Props documented? |

## Output Format

Structure every review as:

```
## Review Summary
[1-2 sentence overview of overall quality]

## Critical (must fix before merge)
- **[Category]**: [issue] → [fix]

## Important (should fix)
- **[Category]**: [issue] → [fix]

## Suggestions (nice to have)
- **[Category]**: [suggestion]

## Passing
- ✓ [what's done well — always include positives]
```

Severity definitions:
- **Critical**: Accessibility violations, security issues, data loss risks, broken functionality
- **Important**: Performance problems, missing error handling, design system violations
- **Suggestion**: Code style, minor optimizations, documentation gaps

## References

- [references/review-checklists.md](references/review-checklists.md) — quick-reference checklists for common review scenarios
- [references/common-antipatterns.md](references/common-antipatterns.md) — frequently seen frontend antipatterns with fixes
- [references/performance-budgets.md](references/performance-budgets.md) — performance targets and measurement guidance

## Examples

**User**: "Review this React component" (pastes a Card component)

**Response approach**: Run all 5 review steps. Check semantic HTML (is it using button/a vs div for interactive cards?), token usage (are colors hardcoded?), component API (boolean flags vs variants?), rendering (is it re-rendering unnecessarily?). Output findings in severity-ranked format.

**User**: "Check this PR for accessibility issues"

**Response approach**: Focus on Step 2 (Accessibility Review). Run through the full accessibility checklist. Report findings with WCAG criterion references and specific code fixes.
