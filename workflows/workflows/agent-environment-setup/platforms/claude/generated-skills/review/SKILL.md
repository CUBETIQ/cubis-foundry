---
name: review
description: "Run a strict review for bugs, regressions, accessibility issues, security risk, and code quality with prioritized findings."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "review"
  platform: "Claude Code"
  command: "/review"
compatibility: Claude Code
---
# review Workflow
# Review Workflow

## When to use

Use this for code review, PR review, or quality audit of existing code changes.

## Routing

- Primary specialist: `@frontend-specialist` (for frontend code) or `@backend-specialist` (for backend code)
- Security review: `@security-auditor`
- Quality validation: `@validator`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the PR diff, changed files, or specific code paths to review.

## Skill Routing

- Primary skills: `frontend-code-review`, `static-analysis`, `testing-patterns`
- Supporting skills (optional): `security-engineer`, `vulnerability-scanner`, `web-perf`, `react-expert`, `nextjs-developer`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `frontend-code-review` for UI code or `static-analysis` for backend code. Add `testing-patterns` when evaluating test quality. Add `security-engineer` for security-sensitive changes.

## Workflow steps

1. Understand the intent and scope of the changes.
2. Review for correctness — logic bugs, edge cases, and regressions.
3. Review for security — input validation, auth, secrets exposure.
4. Review for accessibility — WCAG compliance, keyboard navigation, screen readers.
5. Review for performance — unnecessary re-renders, N+1 queries, bundle impact.
6. Prioritize findings by severity and provide actionable feedback.

## Verification

- Each finding has severity, location, and suggested fix.
- Findings prioritized: critical > high > medium > low.
- Positive observations noted alongside issues.
- Reviewed against codebase conventions.

## Output Contract

```yaml
REVIEW_WORKFLOW_RESULT:
  primary_agent: <frontend-specialist | backend-specialist>
  supporting_agents: [security-auditor?, validator?, test-engineer?]
  primary_skills: [frontend-code-review?, static-analysis?, testing-patterns?]
  supporting_skills: [security-engineer?, vulnerability-scanner?, web-perf?]
  findings:
    - severity: critical | high | medium | low
      category: correctness | security | accessibility | performance | style
      location: <file:line>
      description: <string>
      suggestion: <string>
  overall_assessment: approve | request_changes | reject
  positive_observations: [<string>] | []
  follow_up_items: [<string>] | []
```