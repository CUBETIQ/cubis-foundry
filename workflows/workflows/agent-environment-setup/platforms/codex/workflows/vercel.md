---
command: "/vercel"
description: "Drive Vercel implementation and operations via vercel-expert with deployment, runtime, security, and observability guardrails."
triggers: ["vercel", "deployment", "preview", "edge", "functions", "domains", "vercel cli"]
---
# Vercel Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps Vercel platform changes and rollout notes machine-readable.

## When to use
Use this workflow when the primary concern is Vercel platform behavior, deployment safety, or Vercel-specific automation.

## Routing
- Primary specialist: `@vercel-expert`
- Add `@devops-engineer` for CI/CD and rollout policy design.
- Add `@security-auditor` for WAF, auth, and network-hardening decisions.
- Add `@test-engineer` or `@qa-automation-engineer` for release quality gates.

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
```yaml
VERCEL_WORKFLOW_RESULT:
  primary_agent: vercel-expert
  supporting_agents: [devops-engineer?, security-auditor?, test-engineer?, qa-automation-engineer?]
  primary_skills: [vercel-platform, vercel-runtime]
  supporting_skills: [vercel-delivery?, vercel-security?, vercel-ai?, vercel-storage?]
  affected_components: [<string>]
  deployment_notes: [<string>]
  rollback_notes: [<string>]
  security_and_observability_impact: [<string>]
  verification_evidence: [<string>]
  follow_up_items: [<string>] | []
```
