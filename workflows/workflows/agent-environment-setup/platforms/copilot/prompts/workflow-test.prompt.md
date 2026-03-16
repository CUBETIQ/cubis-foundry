# Workflow Prompt: /test

Design and execute verification strategy aligned to user risk, release confidence, and regression evidence.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/test.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `unit-testing`, `integration-testing`, `playwright-interactive`, `observability`, `systematic-debugging`, `code-review`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`.
- Local skill file hints if installed: `.github/skills/unit-testing/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/playwright-interactive/SKILL.md`, `.github/skills/observability/SKILL.md`, `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
