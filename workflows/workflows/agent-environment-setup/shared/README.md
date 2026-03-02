# Shared Agent/Workflow Source

This directory is the canonical source for custom agents and workflows.

- Edit `shared/agents/*.md` and `shared/workflows/*.md` only.
- Regenerate platform assets with:
  - `npm run generate:platform-assets`
- Validate generation parity with:
  - `node scripts/generate-platform-assets.mjs --check`

Generated targets:
- `platforms/codex/{agents,workflows}`
- `platforms/antigravity/{agents,workflows,commands}`
- `platforms/copilot/{agents,workflows,prompts}`
