# Claude — Platform Overrides

## Platform Paths

- Workflows: `.claude/workflows`
- Agents: `.claude/agents`
- Skills: `.claude/skills`
- Rules file: `CLAUDE.md`

## Platform-Specific Routing

1. **Explicit workflow, slash command, or subagent** — highest priority route.
2. Standard workflow/agent routing from shared steering.

## Platform Notes

- Claude supports **subagent delegation** via `Task` tool for parallel specialist work.
- Scoped rules can be placed in `.claude/rules/*.md` with frontmatter-based path matching.
- Global rules live in `~/.claude/CLAUDE.md` and apply to all projects.
- Claude natively supports `bash`, `read`, `write`, `edit`, `multiedit`, `grep`, `glob` tools.
- Use subagents for genuinely parallel workstreams; do not delegate when sequential execution suffices.
