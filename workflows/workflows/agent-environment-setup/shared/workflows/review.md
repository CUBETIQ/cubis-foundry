---
command: "/review"
description: "Run a strict review for bugs, regressions, and security issues with prioritized findings."
triggers: ["review", "audit", "pr", "quality", "security review"]
---
# Review Workflow

## When to use
Use this for pull request or branch quality review.

## Routing
- Code quality and legacy risk: `@code-archaeologist`
- Frontend quality: `@frontend-specialist`
- Security checks: `@security-auditor`
- Test adequacy: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `code-reviewer`, `security-reviewer`
- Supporting skills (optional): `semgrep`, `static-analysis`, `variant-analysis`

## Workflow steps
1. Inspect changed behavior and risk surface.
2. Identify defects by severity.
3. Validate tests and missing coverage.
4. Produce actionable remediation guidance.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Findings ordered by severity
- Affected files/areas
- Recommended fixes
- Residual risks after fixes
