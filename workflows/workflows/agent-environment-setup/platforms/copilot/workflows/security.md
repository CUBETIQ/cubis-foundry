---
command: "/security"
description: "Run security-focused analysis and remediation planning with exploitability-first triage."
triggers: ["security", "vulnerability", "owasp", "auth", "hardening"]
---
# Security Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps exploitability triage and remediation evidence machine-readable.

## When to use
Use this when the task is primarily about security risk discovery, triage, or remediation.

## Routing
- Primary specialist: `@security-auditor`
- Exploitability validation: `@penetration-tester`
- Verification support: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `security-reviewer`, `secure-code-guardian`
- Supporting skills (optional): `semgrep`, `static-analysis`, `variant-analysis`

## Workflow steps
1. Map threat surface and high-risk paths.
2. Prioritize findings by exploitability and impact.
3. Propose concrete fixes with least regression risk.
4. Validate remediation and residual risk.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
SECURITY_WORKFLOW_RESULT:
  primary_agent: security-auditor
  supporting_agents: [penetration-tester?, test-engineer?]
  primary_skills: [security-reviewer, secure-code-guardian]
  supporting_skills: [semgrep?, static-analysis?, variant-analysis?]
  findings:
    - severity: <critical|high|medium|low>
      summary: <string>
  fix_plan:
    - owner: <agent-id>
      action: <string>
  verification_evidence: [<string>]
  residual_risk_notes: [<string>] | []
```
