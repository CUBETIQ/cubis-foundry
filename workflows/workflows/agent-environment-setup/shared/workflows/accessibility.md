---
command: "/accessibility"
description: "Run a structured accessibility audit on web UI code with WCAG 2.2 AA compliance checks, ARIA validation, keyboard navigation testing, and screen reader verification."
triggers: ["accessibility", "a11y", "wcag", "aria", "screen reader", "keyboard navigation"]
---

# Accessibility Workflow

## When to use

Use this for accessibility audits, WCAG compliance review, or improving accessible user experience.

## Routing

- Primary specialist: `@frontend-specialist`
- Verification support: `@test-engineer`
- Review support: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the target components, pages, or routes to audit. Include any existing axe or Lighthouse results.

## Skill Routing

- Primary skills: `frontend-code-review`, `frontend-design`
- Supporting skills (optional): `i18n-localization`, `web-perf`, `react-expert`, `nextjs-developer`, `tailwind-patterns`, `playwright-e2e`, `typescript-pro`, `javascript-pro`
- Start with `frontend-code-review` for WCAG compliance checks. Add `frontend-design` for accessible design patterns. Add `i18n-localization` for RTL and locale-specific accessibility.

## Workflow steps

1. Inventory components and user flows to audit.
2. Run automated accessibility checks (axe, Lighthouse).
3. Manual keyboard navigation and focus management review.
4. ARIA validation — correct roles, states, and properties.
5. Screen reader compatibility assessment.
6. Prioritize findings and provide remediation guidance.

## Verification

- All critical WCAG 2.2 AA violations identified.
- Keyboard navigation works for all interactive elements.
- ARIA attributes are semantically correct.
- Color contrast meets minimum ratios.
- Focus management is logical and visible.

## Output Contract

```yaml
ACCESSIBILITY_WORKFLOW_RESULT:
  primary_agent: frontend-specialist
  supporting_agents: [test-engineer?, validator?]
  primary_skills: [frontend-code-review, frontend-design]
  supporting_skills: [i18n-localization?, web-perf?, playwright-e2e?]
  audit_scope: [<component-or-route>]
  findings:
    - severity: critical | high | medium | low
      wcag_criterion: <string>
      element: <string>
      description: <string>
      remediation: <string>
  automated_results:
    tool: <axe | lighthouse | other>
    violations: <number>
    passes: <number>
  follow_up_items: [<string>] | []
```
