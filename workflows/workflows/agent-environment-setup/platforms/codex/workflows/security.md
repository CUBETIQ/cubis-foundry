---
command: "/security"
description: "Run security-focused analysis and remediation planning with exploitability-first triage."
triggers: ["security", "vulnerability", "owasp", "auth", "hardening"]
---

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
- Supporting skills (optional): `vulnerability-scanner`, `static-analysis`, `api-designer`, `graphql-architect`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `rust-pro`
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
  supporting_skills: [vulnerability-scanner?, static-analysis?, api-designer?]
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
