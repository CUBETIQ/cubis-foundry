# Workflow Prompt: /vercel

Drive Vercel implementation and operations via vercel-expert with deployment, runtime, security, and observability guardrails.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `nextjs`, `ci-cd-pipeline`, `performance-testing`, `react`, `frontend-design`, `javascript-best-practices`, `typescript-best-practices`.
- Local skill file hints if installed: `.github/skills/nextjs/SKILL.md`, `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/performance-testing/SKILL.md`, `.github/skills/react/SKILL.md`, `.github/skills/frontend-design/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
