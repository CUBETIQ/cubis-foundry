# Codex — Platform Overrides

## Platform Paths

- Workflow skills: `.agents/skills/<workflow-id>/SKILL.md`
- Skills: `.agents/skills/<skill-id>/SKILL.md`
- Native subagents: `.codex/agents/*.toml`
- Rules file: `AGENTS.md`
- Hook support: experimental only; Foundry does not emit Codex hook files by default

## Platform-Specific Routing

1. **Explicit `/workflow` or `@agent`** — highest priority route.
2. `/workflow` resolves to a native workflow skill in `.agents/skills/<workflow-id>/SKILL.md`.
3. `@agent` resolves to a native Codex subagent in `.codex/agents/*.toml`.
4. Standard workflow/agent routing from shared steering.

## Sandbox Constraints

- Codex runs in an isolated sandbox — no persistent external network access by default.
- Prefer native Codex delegation when the host exposes it cleanly. If native delegation is unavailable, treat specialist references as in-session postures.
- `@specialist` means: use the platform's native delegation surface when available, otherwise adopt that specialist's domain, reasoning style, and scope constraints inline.
- Prefer local file inspection over external fetches. Default to repo-grounded reasoning.
- Foundry MCP tools (`skill_get`, `skill_search`, `skill_validate`, `route_resolve`) are available when the MCP server is connected. After `route_resolve`, load the returned `primarySkillHint` or `primarySkills[0]` via `skill_validate` → `skill_get` before executing non-trivial tasks.

## Platform Notes

- Codex supports three autonomy levels: `suggest` (propose only), `auto-edit` (edit with confirmation), `full-auto` (autonomous execution).
- Codex operates in a sandboxed environment — destructive operations are inherently limited.
- Orchestration in Codex is native-subagent-first: delegate through `.codex/agents/*.toml` when the task benefits from a specialist handoff.
- Codex hook support is tracked as experimental because the project hook config/schema is not yet a verified Foundry install surface.
- Keep workflow instructions self-contained since network access for external docs may be restricted.
