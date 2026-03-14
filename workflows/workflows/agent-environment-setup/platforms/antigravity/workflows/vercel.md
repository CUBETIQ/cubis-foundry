---
command: "/vercel"
description: "Drive Vercel implementation and operations via vercel-expert with deployment, runtime, security, and observability guardrails."
triggers:
  [
    "vercel",
    "deployment",
    "preview",
    "edge",
    "functions",
    "domains",
    "vercel cli",
  ]
---

# Vercel Workflow

## When to use

Use this for Vercel-specific deployment, configuration, runtime optimization, or platform operations.

## Routing

- Primary specialist: `.agent/agents/vercel-expert`
- Infrastructure support: `.agent/agents/ci-cd-pipeline`
- Verification support: `.agent/agents/test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the Vercel project config, deployment target, and any specific Vercel feature requirements.

## Skill Routing

- Primary skills: `nextjs`, `ci-cd-pipeline`
- Supporting skills (optional): `performance-testing`, `react`, `frontend-design`, `javascript-best-practices`, `typescript-best-practices`, `javascript-best-practices`
- Start with `nextjs` for Next.js on Vercel and `ci-cd-pipeline` for runtime behavior. Add `performance-testing` for performance optimization.

## Workflow steps

1. Assess deployment requirements and runtime selection (Edge vs Serverless vs Static).
2. Configure project settings and environment variables.
3. Set up deployment pipeline with preview deployments.
4. Verify deployment health and performance.
5. Configure monitoring and alerting.

## Verification

- Deployment successful with no build errors.
- Runtime selection appropriate for each route.
- Environment variables correctly configured per environment.
- Preview deployments working for PRs.
- Performance metrics within acceptable ranges.

## Output Contract

```yaml
VERCEL_WORKFLOW_RESULT:
  primary_agent: vercel-expert
  supporting_agents: [ci-cd-pipeline?, test-engineer?]
  primary_skills: [nextjs, ci-cd-pipeline]
  supporting_skills: [performance-testing?, react?]
  deployment:
    project: <string>
    runtime: <edge | serverless | static>
    environment: <development | preview | production>
    status: success | failure
  configuration:
    env_vars: [<string>]
    domains: [<string>]
    caching: <string>
  monitoring: <string>
  follow_up_items: [<string>] | []
```

> **Antigravity note:** Use Agent Manager for parallel agent coordination. Workflow files are stored under `.agent/workflows/`.
