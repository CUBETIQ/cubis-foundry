# Workflow Prompt: /orchestrate

Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership, validation gates, and repeat-until-good iteration.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/orchestrate.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `system-design`, `api-design`, `database-design`, `deep-research`, `mcp-server-builder`, `tech-doc`, `prompt-engineering`, `skill-creator`.
- Local skill file hints if installed: `.github/skills/system-design/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/deep-research/SKILL.md`, `.github/skills/mcp-server-builder/SKILL.md`, `.github/skills/tech-doc/SKILL.md`, `.github/skills/prompt-engineering/SKILL.md`, `.github/skills/skill-creator/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
