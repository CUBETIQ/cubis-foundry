---
command: "/security-pass"
description: "Full security audit with threat modeling, vulnerability triage, and verified remediation across the target scope."
triggers: ["security-pass", "security pass", "security audit", "security scan", "harden"]
---

# Security Pass Workflow

## Purpose

Execute a complete security audit cycle: model threats, scan for vulnerabilities, triage by exploitability, remediate critical findings, and verify fixes. Unlike `/security` (assessment and planning), this workflow carries through to applied remediations with verification evidence.

## When to use

Use this when code needs a full security pass including both finding vulnerabilities and shipping fixes, such as before a release, after a major feature lands, or as part of compliance preparation.

## Routing

- Primary specialist: `@security-auditor`
- Offensive assessment: `@penetration-tester`
- Implementation support: `@backend-specialist`, `@frontend-specialist`
- Verification: `@validator`, `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the audit scope, threat model (if existing), compliance requirements, dependency manifests, and code paths under review.

## Skill Routing

- Primary skills: `security-engineer`, `auth-architect`
- Supporting skills (optional): `vulnerability-scanner`, `static-analysis`, `api-designer`, `graphql-architect`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `rust-pro`, `testing-patterns`
- Start with `security-engineer` for OWASP methodology and threat surface mapping. Add `auth-architect` for authentication and authorization paths. Add `vulnerability-scanner` for dependency and CVE analysis. Add `static-analysis` for automated code scanning.

## Steps

1. **Scope definition** — Define audit boundaries, compliance targets, and excluded areas. `@security-auditor` owns.
2. **Threat model** — Map assets, trust boundaries, data flows, and threat actors. Identify top attack vectors. `@security-auditor` owns.
3. **Attack surface scan** — Analyze input vectors, authentication flows, authorization checks, data handling, and dependency vulnerabilities. `@penetration-tester` owns.
4. **Triage** — Score findings by exploitability (reachability x controllability x impact). Classify as critical, high, medium, or low. `@security-auditor` owns.
5. **Remediate** — Fix critical and high findings. Apply defense-in-depth for medium findings where cost is low. `@backend-specialist` / `@frontend-specialist` own.
6. **Verify fixes** — Confirm each remediation resolves the finding without introducing new vulnerabilities. Add security regression tests. `@test-engineer` and `@validator` own.
7. **Report** — Produce audit summary with findings, remediations, accepted risks, and compliance status.

## Verification

- All critical and high findings remediated or have documented risk acceptance.
- Remediation code reviewed for correctness and no new attack surface.
- Security regression tests added for each critical fix.
- Dependency vulnerabilities addressed or documented with timeline.
- Compliance requirements mapped to evidence.

## Agents Involved

- @security-auditor — threat modeling, triage, and audit reporting
- @penetration-tester — attack surface analysis and exploitation testing
- @backend-specialist — server-side remediation
- @frontend-specialist — client-side remediation
- @test-engineer — security regression test creation
- @validator — remediation verification

## Output

```yaml
SECURITY_PASS_WORKFLOW_RESULT:
  primary_agent: security-auditor
  supporting_agents: [penetration-tester, backend-specialist?, frontend-specialist?, test-engineer, validator]
  primary_skills: [security-engineer, auth-architect]
  supporting_skills: [vulnerability-scanner?, static-analysis?, api-designer?]
  scope:
    boundaries: [<string>]
    compliance_targets: [<string>] | []
  threat_model:
    assets: [<string>]
    trust_boundaries: [<string>]
    top_attack_vectors: [<string>]
  findings:
    - id: <finding-id>
      severity: critical | high | medium | low
      category: <owasp-category>
      exploitability: <reachability x controllability x impact>
      status: remediated | accepted_risk | deferred
      remediation: <string>
  remediations_applied:
    changed_artifacts: [<path-or-artifact>]
    regression_tests: [<test-file-path>]
  accepted_risks: [<string>] | []
  compliance_evidence: [<string>] | []
  follow_up_items: [<string>] | []
```
