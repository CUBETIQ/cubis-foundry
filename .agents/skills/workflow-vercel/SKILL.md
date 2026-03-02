---
name: workflow-vercel
description: 'Callable Codex wrapper for /vercel: Drive Vercel implementation and operations via vercel-expert with deployment, runtime, security, and observability guardrails.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'vercel'
  workflow-command: '/vercel'
---

# Workflow Wrapper: /vercel

Use this skill as a callable replacement for `/vercel` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Vercel Workflow

## When to use
Use this workflow when the primary concern is Vercel platform behavior, deployment safety, or Vercel-specific automation.

## Routing
- Primary specialist: `$agent-vercel-expert`
- Add `$agent-devops-engineer` for CI/CD and rollout policy design.
- Add `$agent-security-auditor` for WAF, auth, and network-hardening decisions.
- Add `$agent-test-engineer` or `$agent-qa-automation-engineer` for release quality gates.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `vercel-platform`, `vercel-runtime`
- Supporting skills (optional): `vercel-delivery`, `vercel-security`, `vercel-ai`, `vercel-storage`

## Workflow steps
1. Confirm environment targets, success criteria, and rollback constraints.
2. Design the smallest Vercel-specific change that solves the issue.
3. Implement and verify using focused checks with logs/traces evidence.
4. Summarize risk, residual gaps, and next operational actions.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Config/code changes and affected Vercel components
- Deployment and rollback notes
- Security and observability impact
- Verification evidence and follow-up items
