# Shared Specialist-Route Source

This directory is the canonical source for shared specialist routes and workflows.

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

- `platforms/codex/{agents,generated-skills,rules}`
- `platforms/antigravity/{commands,rules,skills}`
- `platforms/copilot/{agents,hooks,prompts,rules,skills}`
- `platforms/claude/{agents,generated-skills,hooks,skills}`
- `platforms/gemini/{commands,hooks,rules,skills}`
