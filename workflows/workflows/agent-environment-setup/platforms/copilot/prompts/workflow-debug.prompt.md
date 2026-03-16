# Workflow Prompt: /debug

Isolate root cause quickly, apply the smallest safe remediation, and leave behind regression evidence.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/debug.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `ENGINEERING_RULES.md` first and `TECH.md` next when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `systematic-debugging`, `observability`, `unit-testing`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`, `csharp-best-practices`, `kotlin-best-practices`, `rust-best-practices`, `integration-testing`, `playwright-interactive`, `skill-creator`.
- Local skill file hints if installed: `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/observability/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`, `.github/skills/java-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
