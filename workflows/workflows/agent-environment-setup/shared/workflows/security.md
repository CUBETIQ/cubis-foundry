---
command: "/security"
description: "Run security-focused analysis and remediation planning with exploitability-first triage."
triggers: ["security", "vulnerability", "owasp", "auth", "hardening"]
---
# Security Workflow

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
- Findings by severity
- Fix plan with owners
- Verification evidence
- Residual risk notes
