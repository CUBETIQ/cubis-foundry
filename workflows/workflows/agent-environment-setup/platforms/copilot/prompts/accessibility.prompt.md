# Workflow Prompt: /accessibility

Run a structured accessibility audit on web UI code with WCAG 2.2 AA compliance checks, ARIA validation, keyboard navigation testing, and screen reader verification.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `code-review`, `frontend-design`, `performance-testing`, `react`, `nextjs`, `playwright-interactive`, `typescript-best-practices`, `javascript-best-practices`.
- Local skill file hints if installed: `.github/skills/code-review/SKILL.md`, `.github/skills/frontend-design/SKILL.md`, `.github/skills/performance-testing/SKILL.md`, `.github/skills/react/SKILL.md`, `.github/skills/nextjs/SKILL.md`, `.github/skills/playwright-interactive/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
