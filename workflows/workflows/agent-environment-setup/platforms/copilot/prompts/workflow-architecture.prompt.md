# Workflow Prompt: /architecture

Refresh the project backbone docs in PRODUCT.md, ARCHITECTURE.md, ENGINEERING_RULES.md, TECH.md, ROADMAP.md, and ADR scaffolds with explicit structure, design-system, testing, and flow guidance.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/architecture.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `architecture-doc`, `system-design`, `tech-doc`, `frontend-design`, `api-design`, `database-design`, `sadd`, `deep-research`.
- Local skill file hints if installed: `.github/skills/architecture-doc/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/tech-doc/SKILL.md`, `.github/skills/frontend-design/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/sadd/SKILL.md`, `.github/skills/deep-research/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
