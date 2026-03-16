# Workflow Prompt: /review

Run a strict review for bugs, regressions, accessibility issues, security risk, and code quality with prioritized findings.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/review.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `code-review`, `unit-testing`, `owasp-security-review`, `performance-testing`, `react`, `nextjs`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/code-review/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/owasp-security-review/SKILL.md`, `.github/skills/performance-testing/SKILL.md`, `.github/skills/react/SKILL.md`, `.github/skills/nextjs/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
