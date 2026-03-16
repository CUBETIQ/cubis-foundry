# Workflow Prompt: /spec

Create or refresh a Git-tracked spec pack for non-trivial work, including acceptance criteria, traceability, architecture impact, and next-route handoff.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/spec.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `ENGINEERING_RULES.md` first and `TECH.md` next when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `spec-driven-delivery`, `sadd`, `system-design`, `architecture-doc`, `deep-research`, `api-design`, `database-design`, `tech-doc`.
- Local skill file hints if installed: `.github/skills/spec-driven-delivery/SKILL.md`, `.github/skills/sadd/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/architecture-doc/SKILL.md`, `.github/skills/deep-research/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/tech-doc/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
