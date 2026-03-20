---
name: review
description: "Comprehensive code review combining quality review and security audit."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "review"
  platform: "Claude Code"
  command: "/review"
compatibility: Claude Code
---
# Review Workflow
## When to use

Use for code review, pull request review, quality audits, or pre-merge verification.

## Agent Chain

`reviewer` -> `implementer` (if fixes needed)

## Routing

1. **Review**: `@reviewer` performs quality, pattern, maintainability, and security review.
2. **Fix (if needed)**: `@implementer` addresses any critical or high-severity findings.

## Skill Routing

- Primary skills: `code-review`, `owasp-security-review`
- Supporting skills (optional): `secret-management`, `pentest-skill`, `api-design`, `typescript-best-practices`

## Context notes

- Provide the files or diff to review, and any specific concerns or focus areas.
- Quality review and security review are combined in one pass.

## Workflow steps

1. Reviewer analyzes the code and records quality and security findings together.
2. If no critical/high issues: APPROVE.
3. If fixes are needed: implementer addresses the findings.
4. After fixes: re-review to verify resolutions.

## Verification

- All critical and high-severity findings addressed.
- Security audit complete with no unresolved vulnerabilities.
- Final review status is APPROVE.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: reviewer
  supporting_agents: [implementer]
  review_status: <approve|request_changes>
  critical_findings: <number>
  high_findings: <number>
  security_findings: <number>
  follow_up_items: [<string>] | []
```