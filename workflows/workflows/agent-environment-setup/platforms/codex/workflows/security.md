---
command: "/security"
description: "Run security-focused analysis and remediation planning with exploitability-first triage."
triggers: ["security", "vulnerability", "owasp", "auth", "hardening"]
---
# Security Workflow

Use this when the task is primarily about security risk discovery, triage, or remediation.

## Routing
- Primary specialist: `@security-auditor`
- Exploitability validation: `@penetration-tester`
- Verification support: `@test-engineer`

## Steps
1. Map threat surface and high-risk paths.
2. Prioritize findings by exploitability and impact.
3. Propose concrete fixes with least regression risk.
4. Validate remediation and residual risk.

## Output Contract
- Findings by severity
- Fix plan with owners
- Verification evidence
- Residual risk notes
