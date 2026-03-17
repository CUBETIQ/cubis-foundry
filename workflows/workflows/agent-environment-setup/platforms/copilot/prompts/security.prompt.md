# Workflow Prompt: /security

Run security-focused analysis and remediation planning with exploitability-first triage.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `owasp-security-review`, `code-review`, `api-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `rust-best-practices`.
- Local skill file hints if installed: `.github/skills/owasp-security-review/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`, `.github/skills/rust-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Security Workflow

## When to use

Use this for security audits, vulnerability assessments, threat modeling, or security-focused code review.

## Routing

- Primary specialist: `@security-auditor`
- Offensive assessment: `@penetration-tester`
- Domain support: `@backend-specialist`, `@frontend-specialist`
- Verification support: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the security scope, threat model, compliance requirements, and relevant code paths.

## Skill Routing

- Primary skills: `security-engineer`, `auth-architect`
- Supporting skills (optional): `vulnerability-scanner`, `static-analysis`, `api-design`, `graphql-architect`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `rust-pro`
- Start with `security-engineer` for OWASP methodology and threat modeling. Add `auth-architect` for authentication/authorization review. Add `vulnerability-scanner` for dependency scanning and CVE triage.

## Workflow steps

1. Define security scope and threat model.
2. Map attack surface and identify input vectors.
3. Assess code against OWASP Top 10 and relevant standards.
4. Triage findings by exploitability (reachability × controllability × impact).
5. Produce remediation plan with prioritized fixes.
6. Verify remediations do not introduce new vulnerabilities.

## Verification

- All critical and high findings have remediation plans.
- Remediation code reviewed for correctness.
- No new vulnerabilities introduced by fixes.
- Compliance requirements addressed if applicable.

## Output Contract

```yaml
SECURITY_WORKFLOW_RESULT:
  primary_agent: security-auditor
  supporting_agents: [penetration-tester?, backend-specialist?, frontend-specialist?, validator?]
  primary_skills: [security-engineer, auth-architect]
  supporting_skills: [vulnerability-scanner?, static-analysis?, api-design?]
  threat_model:
    assets: [<string>]
    threats: [<string>]
    attack_surface: [<string>]
  findings:
    - severity: critical | high | medium | low
      category: <owasp-category>
      exploitability: <string>
      remediation: <string>
  compliance_notes: [<string>] | []
  remaining_risks: [<string>] | []
  follow_up_items: [<string>] | []
```
