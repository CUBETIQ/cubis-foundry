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

## Platform Notes

- Codex does not spawn isolated Foundry agents. Agent-style references route work to the right specialist posture inside the current session.
- Codex runs in a sandboxed environment — destructive operations are inherently limited.
