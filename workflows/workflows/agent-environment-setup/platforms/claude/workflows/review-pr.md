---
command: "/review-pr"
description: "Structured pull request review covering correctness, security, performance, accessibility, and test adequacy with actionable verdicts."
triggers: ["review-pr", "review pr", "pr review", "pull request review", "code review pr"]
---

# Review PR Workflow

## Purpose

Execute a structured pull request review that covers all quality dimensions and produces an actionable verdict. Unlike `/review` (general code audit), this workflow is specifically scoped to a PR diff with merge-readiness as the outcome.

## When to use

Use this when reviewing a pull request before merge. The PR diff, description, and linked issue context should be available.

## Routing

- Primary reviewer: `@backend-specialist` (backend changes) or `@frontend-specialist` (frontend changes)
- Security review: `@security-auditor`
- Test adequacy: `@test-engineer`
- Final validation: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the PR diff, PR description, linked issue or ticket, and any CI results.

## Skill Routing

- Primary skills: `frontend-code-review`, `static-analysis`
- Supporting skills (optional): `testing-patterns`, `security-engineer`, `web-perf`, `accessibility`, `react-expert`, `nextjs-developer`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`
- Start with `frontend-code-review` for UI changes or `static-analysis` for backend changes. Add `testing-patterns` to evaluate test coverage of the diff. Add `security-engineer` for auth or input handling changes. Add `web-perf` for performance-sensitive paths.

## Steps

1. **Context** — Read PR description, linked issue, and overall intent. Understand what changed and why. Reviewer identifies scope boundaries.
2. **Correctness** — Review each changed file for logic bugs, edge cases, off-by-one errors, null handling, race conditions, and regressions. Flag anything that breaks existing contracts.
3. **Security** — Check input validation, authentication gating, authorization checks, secrets handling, SQL injection, XSS, and dependency changes. `@security-auditor` assists.
4. **Performance** — Identify unnecessary re-renders, N+1 queries, unbounded loops, large bundle additions, and missing pagination or caching. Flag items with measurable impact.
5. **Accessibility** — Verify WCAG compliance on UI changes: semantic HTML, ARIA attributes, keyboard navigation, color contrast, and screen reader compatibility.
6. **Test adequacy** — Evaluate whether tests cover the changed behavior, new edge cases, and regression scenarios. `@test-engineer` assists. Flag untested critical paths.
7. **Style and conventions** — Check naming, file organization, import ordering, and consistency with existing codebase patterns.
8. **Verdict** — Summarize findings, assign severity to each, and produce a merge recommendation: approve, request changes, or reject.

## Verification

- Every finding includes file location, severity, description, and suggested fix.
- Findings prioritized: blocking > important > suggestion > nit.
- Positive observations included alongside issues.
- Verdict is one of: approve, request_changes, reject.
- No blocking findings remain for an approve verdict.

## Agents Involved

- @backend-specialist — backend correctness and performance review
- @frontend-specialist — frontend correctness, accessibility, and UX review
- @security-auditor — security-focused review of the diff
- @test-engineer — test adequacy assessment
- @validator — final verdict and quality gate

## Output

```yaml
REVIEW_PR_WORKFLOW_RESULT:
  primary_agent: <backend-specialist | frontend-specialist>
  supporting_agents: [security-auditor?, test-engineer?, validator]
  primary_skills: [frontend-code-review?, static-analysis?]
  supporting_skills: [testing-patterns?, security-engineer?, web-perf?, accessibility?]
  pr_context:
    title: <string>
    files_changed: <number>
    lines_added: <number>
    lines_removed: <number>
  findings:
    - severity: blocking | important | suggestion | nit
      category: correctness | security | performance | accessibility | test-adequacy | style
      location: <file:line>
      description: <string>
      suggestion: <string>
  test_adequacy:
    coverage_of_diff: sufficient | insufficient
    missing_coverage: [<string>] | []
  positive_observations: [<string>] | []
  verdict: approve | request_changes | reject
  blocking_items: [<string>] | []
  follow_up_items: [<string>] | []
```
