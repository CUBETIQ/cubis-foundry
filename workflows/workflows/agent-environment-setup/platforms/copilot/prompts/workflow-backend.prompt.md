# Workflow Prompt: /backend

Drive backend architecture, API operations, and Postman-oriented execution with API, data, and reliability focus.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/backend.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `api-design`, `javascript-best-practices`, `owasp-security-review`, `database-design`, `nestjs`, `fastapi`, `microservices-design`, `drizzle-orm`, `stripe-integration`, `ci-cd-pipeline`, `frontend-design`, `typescript-best-practices`, `python-best-practices`, `golang-best-practices`.
- Local skill file hints if installed: `.github/skills/api-design/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/owasp-security-review/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/nestjs/SKILL.md`, `.github/skills/fastapi/SKILL.md`, `.github/skills/microservices-design/SKILL.md`, `.github/skills/drizzle-orm/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
