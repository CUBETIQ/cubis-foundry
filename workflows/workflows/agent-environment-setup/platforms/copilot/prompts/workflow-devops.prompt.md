# Workflow Prompt: /devops

Plan and execute deployment, CI/CD, incident response, and operational safety changes with rollback controls.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/devops.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `ci-cd-pipeline`, `kubernetes-deploy`, `observability`, `git-workflow`, `systematic-debugging`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/ci-cd-pipeline/SKILL.md`, `.github/skills/kubernetes-deploy/SKILL.md`, `.github/skills/observability/SKILL.md`, `.github/skills/git-workflow/SKILL.md`, `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
