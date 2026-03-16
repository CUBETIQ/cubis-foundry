# Platform Support Matrix

> Generated from the current workflow bundle generators and rule templates.
> Regenerate with `npm run generate:platform-assets`.

## Platforms

| Platform | Rule File | Output Directory | Execution Model |
| --- | --- | --- | --- |
| **Antigravity** | `GEMINI.md` (`trigger: always_on`) | `.agent/` | Parallel agent-manager workflow with Gemini-family commands |
| **Gemini CLI** | `GEMINI.md` | `.gemini/` | Inline postures plus TOML commands, no standalone agent files |
| **Claude Code** | `CLAUDE.md` | `.claude/` | Workflow and agent markdown with Claude-native rules |
| **Codex** | `AGENTS.md` | `.agents/` | In-session postures plus compatibility wrapper skills |
| **GitHub Copilot** | `copilot-instructions.md` | `.github/` | Workflow markdown, agent markdown, and generated prompt files |

## Bundle Artifacts

| Artifact | Antigravity | Gemini CLI | Claude | Codex | Copilot |
| --- | --- | --- | --- | --- | --- |
| Agent files | 22 `.md` | none | 22 `.md` | 22 `.md` | 22 `.md` with sanitized frontmatter |
| Workflow files | 18 `.md` | 18 `.md` | 18 `.md` | 18 `.md` | 18 `.md` |
| Commands or prompts | 18 `.toml` | 18 `.toml` | none | none | 18 `.prompt.md` |
| Skill mirrors | 68 skill dirs | 68 skill dirs | 68 skill dirs | 68 skill dirs | 68 skill dirs |
| Compatibility aliases | none | none | none | `$agent-*`, `$workflow-*` | none |

## Notes

- Canonical authoring stays in `workflows/skills` and `workflows/workflows/agent-environment-setup/shared`.
- Platform outputs under `workflows/workflows/agent-environment-setup/platforms/*` are generated artifacts.
- Codex installs workflow markdown plus compatibility wrapper skills at runtime; the generated platform bundle still includes agent adapter files.
- Gemini CLI is a first-class install target, but specialist personas are embedded into workflows and `GEMINI.md` guidance rather than shipped as standalone agent files.
- Antigravity remains separate from Gemini CLI because its project layout and agent execution model differ.
