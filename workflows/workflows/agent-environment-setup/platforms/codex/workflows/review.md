---
command: "/review"
description: "Run a strict review for bugs, regressions, accessibility issues, security risk, and code quality with prioritized findings."
triggers: ["review", "audit", "pr", "quality", "security review"]
---

# Review Workflow

## When to use

Use this for code review, PR review, or quality audit of existing code changes.

## Routing

- Primary specialist: `the frontend-specialist posture` (for frontend code) or `the backend-specialist posture` (for backend code)
- Security review: `the security-auditor posture`
- Quality validation: `the validator posture`
- Verification support: `the test-engineer posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the PR diff, changed files, or specific code paths to review.

## Skill Routing

- Primary skills: `code-review`, `code-review`, `unit-testing`
- Supporting skills (optional): `owasp-security-review`, `owasp-security-review`, `performance-testing`, `react`, `nextjs`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`
- Start with `code-review` for UI code or `code-review` for backend code. Add `unit-testing` when evaluating test quality. Add `owasp-security-review` for security-sensitive changes.

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
  primary_skills: [code-review?, code-review?, unit-testing?]
  supporting_skills: [owasp-security-review?, owasp-security-review?, performance-testing?]
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

> **Codex note:** This workflow runs inside a network-restricted sandbox. Specialists are reasoning postures defined in AGENTS.md, not spawned processes.
