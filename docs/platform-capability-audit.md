# Platform Capability Audit

This document records the current evidence basis for each supported platform. It separates official vendor support from local CLI observations and inferred compatibility targets.

## Antigravity

- Source type: `inferred-compatibility`
- Audited at: `2026-04-04`
- Version or date: `2026-04-04`
- Summary: Compatibility target derived from Foundry's Antigravity adapter shape and Gemini-family routing model.

| Evidence Kind | Scope | Stability | Source | Notes |
| --- | --- | --- | --- | --- |
| inferred | mixed | inferred | workflows/workflows/agent-environment-setup/platforms/antigravity | No public vendor spec was verified in this audit; Foundry treats Antigravity as an inferred compatibility target only. |

## Claude

- Source type: `official-doc`
- Audited at: `2026-04-04`
- Version or date: `2026-04-04`
- Summary: Anthropic Claude Code docs confirm native settings, hooks, project commands, and subagents.

| Evidence Kind | Scope | Stability | Source | Notes |
| --- | --- | --- | --- | --- |
| official-doc | repo | stable | https://docs.anthropic.com/en/docs/claude-code/settings | Settings docs describe project/user settings, CLAUDE.md, hooks, and .claude/agents/*.md subagents. |
| official-doc | repo | stable | https://docs.anthropic.com/en/docs/claude-code/tutorials | Tutorial docs describe project-specific slash commands under .claude/commands. |

## Codex

- Source type: `mixed`
- Audited at: `2026-04-04`
- Version or date: `codex-cli 0.118.0 / 2026-04-04`
- Summary: OpenAI Codex docs confirm AGENTS.md, skills, subagents, and hooks; local CLI confirms the current feature-gating state.

| Evidence Kind | Scope | Stability | Source | Notes |
| --- | --- | --- | --- | --- |
| official-doc | repo | stable | https://developers.openai.com/codex/skills | Codex docs describe repository skills under .agents/skills and related AGENTS.md guidance. |
| official-doc | repo | experimental | https://developers.openai.com/codex/hooks | Codex docs describe project hook events including UserPromptSubmit and Stop. |
| local-cli | cli | experimental | codex-cli 0.118.0 | Local feature inspection still exposes codex_hooks as under development, so Foundry keeps hook emission gated. |

## Copilot

- Source type: `official-doc`
- Audited at: `2026-04-04`
- Version or date: `2026-04-04`
- Summary: GitHub Docs confirm repository instructions, AGENTS.md, prompt files, skills, custom agents, hooks, and coding-agent surfaces, with feature availability varying by surface.

| Evidence Kind | Scope | Stability | Source | Notes |
| --- | --- | --- | --- | --- |
| official-doc | mixed | stable | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions?tool=vscode | GitHub documents repository custom instructions, AGENTS.md agent instructions, and companion instruction files. |
| official-doc | cli | stable | https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills | Copilot CLI docs describe skills and project skill locations. |
| official-doc | cli | stable | https://docs.github.com/copilot/how-tos/copilot-cli/use-copilot-cli-agents/invoke-custom-agents | Copilot CLI docs describe custom agents as a first-class surface. |
| official-doc | ide | preview | https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/prompting/response-customization | Prompt files are documented as preview and limited to supported IDE surfaces. |

## Gemini

- Source type: `official-doc`
- Audited at: `2026-04-04`
- Version or date: `2026-04-04`
- Summary: Gemini CLI docs confirm GEMINI.md, commands, settings, hooks, MCP, skills, and experimental remote subagents.

| Evidence Kind | Scope | Stability | Source | Notes |
| --- | --- | --- | --- | --- |
| official-doc | repo | stable | https://geminicli.com/docs/cli/custom-commands/ | Gemini CLI docs describe project and global .gemini/commands command files. |
| official-doc | repo | stable | https://geminicli.com/docs/ | Gemini docs list GEMINI.md project context, agent skills, settings, and MCP as supported features. |
| official-doc | mixed | experimental | https://geminicli.com/docs/core/remote-agents/ | Gemini docs describe remote subagents as an experimental feature that must be explicitly enabled. |
