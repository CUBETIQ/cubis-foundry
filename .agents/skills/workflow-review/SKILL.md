---
name: workflow-review
description: 'Callable Codex wrapper for /review: Run a strict review for bugs, regressions, and security issues with prioritized findings.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'review'
  workflow-command: '/review'
---

# Workflow Wrapper: /review

Use this skill as a callable replacement for `/review` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Review Workflow

## When to use
Use this for pull request or branch quality review.

## Routing
- Code quality and legacy risk: `$agent-code-archaeologist`
- Frontend quality: `$agent-frontend-specialist`
- Security checks: `$agent-security-auditor`
- Test adequacy: `$agent-test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `code-reviewer`, `security-reviewer`
- Supporting skills (optional): `semgrep`, `static-analysis`, `variant-analysis`

## Workflow steps
1. Inspect changed behavior and risk surface.
2. Identify defects by severity.
3. Validate tests and missing coverage.
4. Produce actionable remediation guidance.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Findings ordered by severity
- Affected files/areas
- Recommended fixes
- Residual risks after fixes
