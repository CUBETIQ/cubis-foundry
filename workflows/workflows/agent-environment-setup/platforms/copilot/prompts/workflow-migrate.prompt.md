# Workflow Prompt: /migrate

Plan and execute technology migrations, framework upgrades, and dependency updates with rollback safety, incremental verification, and zero-downtime transition.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/migrate.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `system-design`, `code-review`, `unit-testing`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/system-design/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
