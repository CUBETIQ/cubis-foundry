## Copilot Platform Notes

- Skill files are stored under `.github/prompts/` (prompt files) and `.github/instructions/` (instruction files).
- Copilot does not support subagent spawning — all skill guidance executes within the current conversation context.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context`, `agent`, and `allowed-tools` are not supported; guidance is advisory only.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
