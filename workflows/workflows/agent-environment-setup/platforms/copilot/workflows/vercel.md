---
command: "/vercel"
description: "Drive Vercel implementation and operations via vercel-expert with deployment, runtime, security, and observability guardrails."
triggers: ["vercel", "deployment", "preview", "edge", "functions", "domains", "vercel cli"]
---
# Vercel Workflow

Use this workflow when the primary concern is Vercel platform behavior, deployment safety, or Vercel-specific automation.

## Routing
- Primary specialist: `@vercel-expert`
- Add `@devops-engineer` for CI/CD and rollout policy design.
- Add `@security-auditor` for WAF, auth, and network-hardening decisions.
- Add `@test-engineer` or `@qa-automation-engineer` for release quality gates.

## Steps
1. Confirm environment targets, success criteria, and rollback constraints.
2. Design the smallest Vercel-specific change that solves the issue.
3. Implement and verify using focused checks with logs/traces evidence.
4. Summarize risk, residual gaps, and next operational actions.

## Output Contract
- Config/code changes and affected Vercel components
- Deployment and rollback notes
- Security and observability impact
- Verification evidence and follow-up items
