# Foundry Skill Checklist

Use this checklist before finishing a skill creation or maintenance task.

## Canonical Package

- Skill folder name is lowercase hyphen-case and under 64 characters.
- `SKILL.md` exists and has `name` plus `description`.
- `description` states both when to use the skill and when not to use it.
- No `POWER.md` exists in the skill directory.
- No extra top-level markdown files exist besides `SKILL.md`.

## Sidecars

- Every referenced markdown file exists.
- Referenced markdown files are non-empty.
- Links are relative from the skill root.
- `SKILL.md` tells the agent when to load each sidecar instead of listing files without context.

## Scripts

- Only keep scripts that actually remove repetition or improve reliability.
- Scripts should prefer standard-library dependencies when possible.
- Script usage is described briefly in `SKILL.md`.

## Routing and Generation

- If the skill changes route behavior, update shared workflow or agent guidance too.
- Do not edit platform mirrors directly unless the task is fixing the generator itself.
- Regenerate mirrors and rule assets after canonical changes.

## Validation

Run the smallest relevant validation set:

- `python workflows/skills/<id>/scripts/quick_validate.py workflows/skills/<id>`
- `npm run test:attributes`
- `npm run generate:platform-assets`
- `npm run sync:skill-mirrors`

If the task changes MCP or runtime routing:

- `npm --prefix mcp test`
- `npm --prefix mcp run build`
- `node scripts/mcp-http-smoke.mjs <mcp-url>` when a live endpoint is available
