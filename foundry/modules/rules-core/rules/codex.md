> This file extends [common.md](./common.md) with Codex specific guidance.

## Codex-Specific Rules

- Project shared rules into `AGENTS.md`.
- Keep native specialist definitions in `.codex/agents/*.toml` and workflow/skill surfaces in `.agents/skills/`.
- Prefer native Codex agents for specialist routing when available; otherwise fall back to direct execution.
