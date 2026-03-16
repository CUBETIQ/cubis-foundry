# Claude — Platform Overrides

## Platform Paths

- Workflows: `.claude/workflows`
- Agents: `.claude/agents`
- Skills: `.claude/skills`
- Hook templates: `.claude/hooks`
- Rules file: `CLAUDE.md`
- Scoped rules: `.claude/rules/*.md` (with `paths:` frontmatter)

## Platform-Specific Routing

1. **Explicit workflow, slash command, or subagent** — highest priority route.
2. Standard workflow/agent routing from shared steering.

## Subagent Delegation

- Claude delegates via the `Task` tool — each task spawns an independent agent context.
- Set `maxTurns` in agent frontmatter to cap iteration depth (default: 25).
- Use `background: true` for parallel workstreams with no shared mutable state.
- Key agents have `memory: project` for cross-session learning (orchestrator, debugger, test-engineer, researcher, project-planner, code-archaeologist).

## Platform Notes

- Claude natively supports `bash`, `read`, `write`, `edit`, `multiedit`, `grep`, `glob` tools.
- Scoped rules in `.claude/rules/*.md` use `paths:` frontmatter for targeted file-pattern matching.
- Global rules live in `~/.claude/CLAUDE.md` and apply to all projects.
- Skills with `context: fork` spawn as isolated subagents for research-heavy or exploratory tasks.
- Optional hook templates in `.claude/hooks/` can reinforce explicit-route honoring and research escalation at `UserPromptSubmit`.
- Use `$ARGUMENTS` in skill content for dynamic parameterization from user queries.
