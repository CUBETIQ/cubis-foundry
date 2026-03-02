---
name: workflow-security
description: 'Callable Codex wrapper for /security: Run security-focused analysis and remediation planning with exploitability-first triage.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'security'
  workflow-command: '/security'
---

# Workflow Wrapper: /security

Use this skill as a callable replacement for `/security` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Security Workflow

## When to use
Use this when the task is primarily about security risk discovery, triage, or remediation.

## Routing
- Primary specialist: `$agent-security-auditor`
- Exploitability validation: `$agent-penetration-tester`
- Verification support: `$agent-test-engineer`

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
