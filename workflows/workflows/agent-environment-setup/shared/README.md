# Shared Specialist-Route Source

This directory is the canonical source for shared specialist routes and workflows.

Canonical skills are authored separately under `foundry/modules/<id>`.
Platform skill folders under `platforms/*/skills` are generated mirrors, not source.
Active maintained skill mirrors are `platforms/antigravity/skills`, `platforms/codex/skills`, `platforms/copilot/skills`, `platforms/claude/skills`, and `platforms/gemini/skills`.
Any `platforms/cursor/skills` or `platforms/windsurf/skills` directories should be treated as legacy leftovers unless explicitly reintroduced.

- Edit `shared/agents/*.md` and `shared/workflows/*.md` only.
- Edit canonical skill packages under `foundry/modules/<id>` only.
- Regenerate every generated target with:
  - `npm run generate:all`
- Validate mirror parity and CI coverage with:
  - `npm run test:ci`
- Fast parity-only checks are available with:
  - `npm run check:generated-assets`

Generated targets:

- `platforms/codex/{agents,generated-skills,rules}`
- `platforms/antigravity/{commands,rules,skills}`
- `platforms/copilot/{agents,hooks,prompts,rules,skills}`
- `platforms/claude/{agents,generated-skills,hooks,skills}`
- `platforms/gemini/{commands,hooks,rules,skills}`
