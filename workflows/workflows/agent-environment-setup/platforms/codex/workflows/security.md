---
command: "/security"
description: "Run security-focused analysis and remediation planning with exploitability-first triage."
triggers: ["security", "vulnerability", "owasp", "auth", "hardening"]
---

# Security Workflow

## When to use

Use this for security audits, vulnerability assessments, threat modeling, or security-focused code review.

## Routing

- Primary specialist: `the security-auditor posture`
- Offensive assessment: `the penetration-tester posture`
- Domain support: `the backend-specialist posture`, `the frontend-specialist posture`
- Verification support: `the validator posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the security scope, threat model, compliance requirements, and relevant code paths.

## Skill Routing

- Primary skills: `owasp-security-review`, `owasp-security-review`
- Supporting skills (optional): `owasp-security-review`, `code-review`, `api-design`, `api-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `rust-best-practices`
- Start with `owasp-security-review` for OWASP methodology and threat modeling. Add `owasp-security-review` for authentication/authorization review. Add `owasp-security-review` for dependency scanning and CVE triage.

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
  primary_skills: [owasp-security-review, owasp-security-review]
  supporting_skills: [owasp-security-review?, code-review?, api-design?]
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

> **Codex note:** Prefer native Codex delegation when the host exposes it. Otherwise follow AGENTS.md specialist postures inline while keeping the same routing and verification contract.
