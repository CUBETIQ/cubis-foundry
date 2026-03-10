# Shared Agent/Workflow Source

This directory is the canonical source for custom agents and workflows.

Canonical skills are authored separately under `workflows/skills/<id>`.
Platform skill folders under `platforms/*/skills` are generated mirrors, not source.
Active maintained skill mirrors are `platforms/copilot/skills` and `platforms/claude/skills`.
Any `platforms/cursor/skills` or `platforms/windsurf/skills` directories should be treated as legacy leftovers unless explicitly reintroduced.

- Edit `shared/agents/*.md` and `shared/workflows/*.md` only.
- Regenerate platform assets with:
  - `npm run generate:platform-assets`
- Validate generation parity with:
  - `node scripts/generate-platform-assets.mjs --check`

Generated targets:
- `platforms/codex/{agents,workflows}`
- `platforms/antigravity/{agents,workflows,commands}`
- `platforms/copilot/{agents,workflows,prompts}`
