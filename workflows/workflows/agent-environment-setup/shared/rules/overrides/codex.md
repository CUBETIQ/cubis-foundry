# Codex — Platform Overrides

## Platform Paths

- Workflows: `.agents/workflows`
- Agents: `.agents/agents`
- Skills: `.agents/skills`
- Rules file: `AGENTS.md`

## Platform-Specific Routing

1. **Explicit `/workflow` or `@agent`** — highest priority route.
2. Compatibility aliases (`$workflow-*`, `$agent-*`) may be accepted as hints but are never the primary route surface.
3. Standard workflow/agent routing from shared steering.

## Sandbox Constraints

- Codex runs in an isolated sandbox — no persistent external network access by default.
- All specialist references are **postures within the current session** — Codex does not spawn isolated subagents.
- `@specialist` means: adopt that specialist's domain, reasoning style, and scope constraints internally.
- Prefer local file inspection over external fetches. Default to repo-grounded reasoning.
- Foundry MCP tools (`skill_get`, `skill_search`, `skill_validate`, `route_resolve`) are available when the MCP server is connected. After `route_resolve`, load the returned `primarySkillHint` or `primarySkills[0]` via `skill_validate` → `skill_get` before executing non-trivial tasks.

## Platform Notes

- Codex supports three autonomy levels: `suggest` (propose only), `auto-edit` (edit with confirmation), `full-auto` (autonomous execution).
- Codex operates in a sandboxed environment — destructive operations are inherently limited.
- Orchestration in Codex is sequential (no parallel subagent spawning) — adopt specialist postures one at a time.
- Keep workflow instructions self-contained since network access for external docs may be restricted.
