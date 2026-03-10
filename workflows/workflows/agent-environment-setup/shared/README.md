# Shared Agent/Workflow Source

This directory is the canonical source for custom agents and workflows.

Canonical skills are authored separately under `workflows/skills/<id>`.
Platform skill folders under `platforms/*/skills` are generated mirrors, not source.
Active maintained skill mirrors are `platforms/copilot/skills` and `platforms/claude/skills`.
Any `platforms/cursor/skills` or `platforms/windsurf/skills` directories should be treated as legacy leftovers unless explicitly reintroduced.

- Edit `shared/agents/*.md` and `shared/workflows/*.md` only.
- Edit canonical skill packages under `workflows/skills/<id>` only.
- Regenerate every generated target with:
  - `npm run generate:all`
- Validate mirror parity and CI coverage with:
  - `npm run test:ci`
- Fast parity-only checks are available with:
  - `npm run check:generated-assets`

Generated targets:

- `platforms/codex/{agents,workflows}`
- `platforms/antigravity/{agents,workflows,commands}`
- `platforms/copilot/{agents,workflows,prompts}`
- `platforms/copilot/skills`
- `platforms/claude/{agents,workflows,skills}`
