# Workflow Prompt: /create

Implement feature work with minimal blast radius and clear verification checkpoints.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/create.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`, `csharp-best-practices`, `kotlin-best-practices`, `rust-best-practices`, `php-best-practices`, `expo-app`, `swift-best-practices`, `api-design`, `nestjs`, `fastapi`, `drizzle-orm`, `database-design`, `mcp-server-builder`, `stitch`, `react`, `nextjs`, `frontend-design`, `performance-testing`, `skill-creator`, `stripe-integration`, `ci-cd-pipeline`.
- Local skill file hints if installed: `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`, `.github/skills/java-best-practices/SKILL.md`, `.github/skills/csharp-best-practices/SKILL.md`, `.github/skills/kotlin-best-practices/SKILL.md`, `.github/skills/rust-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
