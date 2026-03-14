## Antigravity Platform Notes

- Use Agent Manager for parallel agent coordination and task delegation.
- Skill and agent files are stored under `.agent/skills/` and `.agent/agents/` respectively.
- TOML command files in `.agent/commands/` provide slash-command entry points for workflows.
- Replace direct `@agent-name` delegation with Agent Manager dispatch calls.
- Reference files are loaded relative to the skill directory under `.agent/skills/<skill-id>/`.
