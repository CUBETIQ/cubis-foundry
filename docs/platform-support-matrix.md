# Platform Support Matrix

> Generated from the current workflow bundle generators and rule templates.
> Regenerate with `npm run generate:platform-assets`.

## Platforms

| Platform | Rule File | Output Directory | Execution Model |
| --- | --- | --- | --- |
| **Antigravity** | `GEMINI.md` | `.agents/` + `.gemini/commands/` | Rules + open-standard skills + generated command routes |
| **Gemini CLI** | `GEMINI.md` | `.gemini/commands/` | Native TOML commands for workflows and specialist routes |
| **Claude Code** | `CLAUDE.md` | `.claude/` | Native agents plus workflow skills |
| **Codex** | `AGENTS.md` | `.codex/agents/` + `.agents/skills/` | Native subagents plus workflow skills |
| **GitHub Copilot** | `copilot-instructions.md` | `.github/` | Native agents, skills, and generated prompt files |

## Bundle Artifacts

| Artifact | Antigravity | Gemini CLI | Claude | Codex | Copilot |
| --- | --- | --- | --- | --- | --- |
| Agent files | none | none | 22 `.md` | 22 `.toml` | 22 `.md` with sanitized frontmatter |
| Workflow route files | none | none | none | none | none |
| Commands or prompts | 42 `.toml` | 42 `.toml` | none | none | 20 `.prompt.md` |
| Generated workflow skills | none | none | 20 skill dirs | 20 skill dirs | none |
| Canonical skill mirrors | 70 skill dirs | none | 70 skill dirs | 70 skill dirs | 70 skill dirs |
| Hook templates | none | none | 3 template files | none | none |
| Compatibility aliases | none | none | none | none | none |

## Notes

- Canonical authoring stays in `workflows/skills` and `workflows/workflows/agent-environment-setup/shared`.
- Platform outputs under `workflows/workflows/agent-environment-setup/platforms/*` are generated artifacts.
- Codex uses native `.codex/agents/*.toml` custom agents and `.agents/skills/<workflow-id>/SKILL.md` workflow skills.
- Claude uses native agents plus workflow skills; custom commands remain supported upstream but are no longer the generated default here.
- Antigravity and Gemini both route workflows through native command files. Antigravity additionally installs `.agents/rules` and open-standard skills under `.agents/skills`.
- Single-project installs are designed to coexist: shared skill surfaces are intentional, platform-owned files live in separate directories, and no platform writes another platform's native agent surface.
