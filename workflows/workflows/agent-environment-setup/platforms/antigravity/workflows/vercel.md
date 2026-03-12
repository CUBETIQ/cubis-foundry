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

- Primary specialist: `@vercel-expert`
- Infrastructure support: `@devops-engineer`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the Vercel project config, deployment target, and any specific Vercel feature requirements.

## Skill Routing

- Primary skills: `nextjs-developer`, `serverless-patterns`
- Supporting skills (optional): `web-perf`, `react-expert`, `tailwind-patterns`, `nodejs-best-practices`, `typescript-pro`, `javascript-pro`
- Start with `nextjs-developer` for Next.js on Vercel and `serverless-patterns` for runtime behavior. Add `web-perf` for performance optimization.

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
  supporting_agents: [devops-engineer?, test-engineer?]
  primary_skills: [nextjs-developer, serverless-patterns]
  supporting_skills: [web-perf?, react-expert?]
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
