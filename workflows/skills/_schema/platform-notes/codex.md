## Codex Platform Notes

- Specialists are internal reasoning postures, not spawned subagent processes.
- Reference the repo-root AGENTS instructions for posture definitions and switching contracts.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
