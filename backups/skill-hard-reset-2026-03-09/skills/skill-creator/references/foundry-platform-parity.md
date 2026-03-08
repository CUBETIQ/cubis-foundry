# Foundry Platform Parity

Use this reference when a skill has to work cleanly across generated platform bundles.

## Canonical Authoring Rule

- Author the real skill only under `workflows/skills/<id>`.
- Generated mirrors are derived artifacts, not the source of truth.
- If a mirror looks wrong, fix the canonical skill or the generator, then regenerate.

## Packaging Rules

- Keep `SKILL.md` as the only top-level markdown entry file.
- Place sidecars under `references/`, `steering/`, or `templates/`.
- Do not keep `POWER.md` in canonical skills or mirrored bundles.
- Keep links relative to the skill root so the same content survives mirror relocation.

## Platform Notes

### Codex

- Full canonical skill content is mirrored into `.agents/skills`.
- Compatibility wrappers may exist for workflows and agents, but skills remain normal packages.

### Claude

- Claude mirrors keep the same skill root plus frontmatter that stays explicit and bounded.
- Keep the canonical root procedural; do not hard-wire one-off tool bindings into canonical content unless they are truly universal.
- Prefer "what to do" in canonical content and leave "how this surface binds tools" to the generator and platform adapter.

### Antigravity

- Skills are mirrored into `.agent/skills`.
- Route-first rule text still expects the same `SKILL.md` plus selective sidecar loading.
- Treat Antigravity as event- and workspace-aware; background or reactive behavior belongs in workflows/rules, not inflated skill prose.

### Copilot

- Copilot-facing skills must keep only supported frontmatter keys after sanitization.
- The canonical skill may keep richer `metadata`, but the generated mirror should rely on Foundry's sanitization rather than hand-authored Copilot-only fields.
- Workspace MCP should stay in `.vscode/mcp.json`.

### Cursor and Windsurf

- These mirrors follow the same filtered bundle rules as Copilot.
- Duplicate top-level markdown files and stale sidecars will show up here too if the canonical package is sloppy.

## Metadata Guidance

- Required everywhere: `name`, `description`
- Allowed canonical extensions: `license`, `allowed-tools`, `metadata`, `compatibility`
- Keep the trigger boundary in `description` sharp enough that route-first loading can direct-load the skill when intent is obvious.

## Routing Guidance

- Do not create platform-specific aliases just to shadow a built-in skill.
- If a built-in name collides with a Foundry skill, prefer a distinct canonical ID and route authoring intent to it explicitly.
- If a skill rename changes runtime hints, update shared workflows, shared agents, route resolution, tests, and generated catalogs in the same change.
