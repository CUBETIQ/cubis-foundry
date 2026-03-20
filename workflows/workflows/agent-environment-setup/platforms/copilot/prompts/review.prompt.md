# Workflow Prompt: /review

Comprehensive code review combining quality review and security audit.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `code-review`, `owasp-security-review`, `secret-management`, `pentest-skill`, `api-design`, `typescript-best-practices`.
- Local skill file hints if installed: `.github/skills/code-review/SKILL.md`, `.github/skills/owasp-security-review/SKILL.md`, `.github/skills/secret-management/SKILL.md`, `.github/skills/pentest-skill/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
