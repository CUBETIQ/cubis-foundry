---
command: "/review"
description: "Run a strict review for bugs, regressions, and security issues with prioritized findings."
triggers: ["review", "audit", "pr", "quality", "security review"]
---
# Review Workflow

Use this for pull request or branch quality review.

## Routing
- Code quality and legacy risk: `@code-archaeologist`
- Frontend quality: `@frontend-specialist`
- Security checks: `@security-auditor`
- Test adequacy: `@test-engineer`

## Steps
1. Inspect changed behavior and risk surface.
2. Identify defects by severity.
3. Validate tests and missing coverage.
4. Produce actionable remediation guidance.

## Output Contract
- Findings ordered by severity
- Affected files/areas
- Recommended fixes
- Residual risks after fixes
