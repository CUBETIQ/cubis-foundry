# Workflow Prompt: /vercel

Drive Vercel implementation and operations via vercel-expert with deployment, runtime, security, and observability guardrails.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/vercel.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `nextjs`, `ci-cd-pipeline`, `performance-testing`, `react`, `frontend-design`, `javascript-best-practices`, `typescript-best-practices`.
- Local skill file hints if installed: `.github/skills/nextjs/SKILL.md`, `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/performance-testing/SKILL.md`, `.github/skills/react/SKILL.md`, `.github/skills/frontend-design/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
