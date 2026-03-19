---
command: "/review"
description: "Comprehensive code review combining quality review and security audit. Runs reviewers in parallel for thorough analysis."
triggers: ["review", "pr", "audit", "quality", "check"]
---

# Review Workflow

## When to use

Use for code review, pull request review, quality audits, or pre-merge verification.

## Agent Chain

`reviewer` + `security-reviewer` (parallel) → `implementer` (if fixes needed)

## Routing

1. **Review (parallel)**:
   - `@reviewer` performs quality, pattern, and maintainability review.
   - `@security-reviewer` performs OWASP security audit.
2. **Fix (if needed)**: `@implementer` addresses any critical or high-severity findings.

## Skill Routing

- Primary skills: `code-review`, `owasp-security-review`
- Supporting skills (optional): `secret-management`, `pentest-skill`, `api-design`, `typescript-best-practices`

## Context notes

- Provide the files or diff to review, and any specific concerns or focus areas.
- Quality reviewer and security reviewer run in parallel for comprehensive coverage.

## Workflow steps

1. Reviewer and security-reviewer analyze the code in parallel.
2. Findings are merged and de-duplicated.
3. If no critical/high issues: APPROVE.
4. If fixes are needed: implementer addresses the findings.
5. After fixes: re-review to verify resolutions.

## Verification

- All critical and high-severity findings addressed.
- Security audit complete with no unresolved vulnerabilities.
- Final review status is APPROVE.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: reviewer
  supporting_agents: [security-reviewer, implementer?]
  review_status: <approve|request_changes>
  critical_findings: <number>
  high_findings: <number>
  security_findings: <number>
  follow_up_items: [<string>] | []
```
