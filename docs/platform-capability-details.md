# Platform Capability Details

This document consolidates the detailed parity views. Full machine-readable detail lives in the generated parity JSON files.

## Pattern Support Matrix

Every pattern must be present for every supported platform. `degraded` is allowed; silent omission is not.

| Pattern | Codex | Claude | Copilot | Gemini | Antigravity |
| --- | --- | --- | --- | --- | --- |
| `instructions-file` | native | native | native | native | native |
| `instructions-hierarchy` | native | native | degraded | degraded | degraded |
| `instructions-override` | native | degraded | degraded | degraded | degraded |
| `config-layering` | native | native | degraded | degraded | degraded |
| `config-profiles` | native | degraded | degraded | degraded | degraded |
| `workflow-entrypoint` | native | native | native | native | native |
| `supporting-skill` | native | native | native | degraded | native |
| `skill-discovery` | native | native | degraded | degraded | native |
| `skill-frontmatter` | native | native | degraded | degraded | degraded |
| `skill-string-substitution` | native | degraded | degraded | degraded | degraded |
| `skill-forked-execution` | native | native | degraded | degraded | degraded |
| `agent-registration` | native | native | native | degraded | degraded |
| `specialist-agent` | native | native | native | degraded | degraded |
| `agent-preloaded-skill` | native | native | degraded | degraded | degraded |
| `multi-agent-orchestration` | native | native | degraded | degraded | degraded |
| `batch-agent-fanout` | native | degraded | degraded | degraded | degraded |
| `orchestration-chain` | native | native | degraded | native | native |
| `review-and-validation` | native | native | degraded | native | native |
| `research-escalation` | native | native | degraded | native | native |
| `memory-loading` | native | native | degraded | degraded | degraded |
| `project-vs-global-scope` | native | native | native | native | native |
| `hook-support` | degraded | native | degraded | degraded | degraded |
| `mcp-integration` | native | native | native | native | native |
| `agent-scoped-mcp` | native | native | degraded | degraded | degraded |
| `runtime-as-mcp-server` | native | degraded | degraded | degraded | degraded |
| `browser-verification` | native | native | native | native | native |
| `sandbox-policy` | native | native | degraded | degraded | degraded |
| `approval-policy` | native | native | degraded | degraded | degraded |
| `session-resume` | native | native | degraded | degraded | degraded |
| `session-fork` | native | native | degraded | degraded | degraded |
| `headless-exec` | native | native | degraded | degraded | degraded |
| `worktree-isolation` | native | native | degraded | degraded | degraded |
| `scheduled-task` | degraded | native | degraded | degraded | degraded |
| `upstream-capability-audit` | native | native | native | native | native |

## Degraded Projections

These entries are intentionally projected through Foundry's control plane rather than exact runtime-native UX.

| Platform | Pattern | Projection Surface | Behavior Notes |
| --- | --- | --- | --- |
| Codex | `hook-support` | generated workflow skills | Codex parity uses generated steering and skill/routing contracts instead of a first-class hook system. |
| Codex | `scheduled-task` | generated workflow skills | Recurring work is projected into external automation or future Foundry automation, not native in-session scheduling. |
| Claude | `instructions-override` | CLAUDE.md | Personal overrides are projected through local settings and user-scoped rules rather than a dedicated override file. |
| Claude | `config-profiles` | <workspace>/.claude/settings.json | Named profiles are projected into documented safety presets instead of a native profile table. |
| Claude | `skill-string-substitution` | .claude/skills/<id>/SKILL.md | Argument binding is available but not modeled as a Codex-style substitution contract everywhere. |
| Claude | `batch-agent-fanout` | .claude/agents/*.md | Batch fanout is handled through orchestrator-managed delegation rather than a native CSV batch primitive. |
| Claude | `runtime-as-mcp-server` | .mcp.json and Claude settings | Claude parity uses Foundry or external servers for MCP serving; the runtime is primarily an MCP client. |
| Copilot | `instructions-hierarchy` | AGENTS.md + .github/copilot-instructions.md | GitHub Copilot projects instructions-hierarchy in degraded form via AGENTS.md + .github/copilot-instructions.md and explicit Foundry control-plane guidance. |
| Copilot | `instructions-override` | AGENTS.md + .github/copilot-instructions.md | GitHub Copilot projects instructions-override in degraded form via AGENTS.md + .github/copilot-instructions.md and explicit Foundry control-plane guidance. |
| Copilot | `config-layering` | <workspace>/.vscode/mcp.json | GitHub Copilot projects config-layering in degraded form via <workspace>/.vscode/mcp.json and explicit Foundry control-plane guidance. |
| Copilot | `config-profiles` | <workspace>/.vscode/mcp.json | GitHub Copilot projects config-profiles in degraded form via <workspace>/.vscode/mcp.json and explicit Foundry control-plane guidance. |
| Copilot | `skill-discovery` | .github/skills/<id>/SKILL.md | GitHub Copilot projects skill-discovery in degraded form via .github/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Copilot | `skill-frontmatter` | .github/skills/<id>/SKILL.md | GitHub Copilot projects skill-frontmatter in degraded form via .github/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Copilot | `skill-string-substitution` | .github/skills/<id>/SKILL.md | GitHub Copilot projects skill-string-substitution in degraded form via .github/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Copilot | `skill-forked-execution` | .github/skills/<id>/SKILL.md | GitHub Copilot projects skill-forked-execution in degraded form via .github/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Copilot | `agent-preloaded-skill` | .github/agents/*.md | GitHub Copilot projects agent-preloaded-skill in degraded form via .github/agents/*.md and explicit Foundry control-plane guidance. |
| Copilot | `multi-agent-orchestration` | .github/agents/*.md | GitHub Copilot projects multi-agent-orchestration in degraded form via .github/agents/*.md and explicit Foundry control-plane guidance. |
| Copilot | `batch-agent-fanout` | .github/agents/*.md | GitHub Copilot projects batch-agent-fanout in degraded form via .github/agents/*.md and explicit Foundry control-plane guidance. |
| Copilot | `orchestration-chain` | .github/prompts/*.prompt.md | GitHub Copilot projects orchestration-chain in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `review-and-validation` | .github/prompts/*.prompt.md | GitHub Copilot projects review-and-validation in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `research-escalation` | .github/prompts/*.prompt.md | GitHub Copilot projects research-escalation in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `memory-loading` | AGENTS.md + .github/copilot-instructions.md | GitHub Copilot projects memory-loading in degraded form via AGENTS.md + .github/copilot-instructions.md and explicit Foundry control-plane guidance. |
| Copilot | `hook-support` | .github/prompts/*.prompt.md | GitHub Copilot projects hook-support in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `agent-scoped-mcp` | .vscode/mcp.json or user mcp-config.json | GitHub Copilot projects agent-scoped-mcp in degraded form via .vscode/mcp.json or user mcp-config.json and explicit Foundry control-plane guidance. |
| Copilot | `runtime-as-mcp-server` | .vscode/mcp.json or user mcp-config.json | GitHub Copilot projects runtime-as-mcp-server in degraded form via .vscode/mcp.json or user mcp-config.json and explicit Foundry control-plane guidance. |
| Copilot | `sandbox-policy` | degraded preset guidance | GitHub Copilot projects sandbox-policy in degraded form via degraded preset guidance and explicit Foundry control-plane guidance. |
| Copilot | `approval-policy` | degraded preset guidance | GitHub Copilot projects approval-policy in degraded form via degraded preset guidance and explicit Foundry control-plane guidance. |
| Copilot | `session-resume` | degraded | GitHub Copilot projects session-resume in degraded form via degraded and explicit Foundry control-plane guidance. |
| Copilot | `session-fork` | degraded | GitHub Copilot projects session-fork in degraded form via degraded and explicit Foundry control-plane guidance. |
| Copilot | `headless-exec` | degraded | GitHub Copilot projects headless-exec in degraded form via degraded and explicit Foundry control-plane guidance. |
| Copilot | `worktree-isolation` | .github/prompts/*.prompt.md | GitHub Copilot projects worktree-isolation in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `scheduled-task` | .github/prompts/*.prompt.md | GitHub Copilot projects scheduled-task in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Gemini | `instructions-hierarchy` | .gemini/GEMINI.md | Gemini CLI projects instructions-hierarchy in degraded form via .gemini/GEMINI.md and explicit Foundry control-plane guidance. |
| Gemini | `instructions-override` | .gemini/GEMINI.md | Gemini CLI projects instructions-override in degraded form via .gemini/GEMINI.md and explicit Foundry control-plane guidance. |
| Gemini | `config-layering` | <workspace>/.gemini/settings.json | Gemini CLI projects config-layering in degraded form via <workspace>/.gemini/settings.json and explicit Foundry control-plane guidance. |
| Gemini | `config-profiles` | <workspace>/.gemini/settings.json | Gemini CLI projects config-profiles in degraded form via <workspace>/.gemini/settings.json and explicit Foundry control-plane guidance. |
| Gemini | `supporting-skill` | degraded via shared skill installs | Gemini CLI projects supporting-skill in degraded form via degraded via shared skill installs and explicit Foundry control-plane guidance. |
| Gemini | `skill-discovery` | degraded via shared skill installs | Gemini CLI projects skill-discovery in degraded form via degraded via shared skill installs and explicit Foundry control-plane guidance. |
| Gemini | `skill-frontmatter` | degraded via shared skill installs | Gemini CLI projects skill-frontmatter in degraded form via degraded via shared skill installs and explicit Foundry control-plane guidance. |
| Gemini | `skill-string-substitution` | degraded via shared skill installs | Gemini CLI projects skill-string-substitution in degraded form via degraded via shared skill installs and explicit Foundry control-plane guidance. |
| Gemini | `skill-forked-execution` | degraded via shared skill installs | Gemini CLI projects skill-forked-execution in degraded form via degraded via shared skill installs and explicit Foundry control-plane guidance. |
| Gemini | `agent-registration` | degraded via generated command routes | Gemini CLI projects agent-registration in degraded form via degraded via generated command routes and explicit Foundry control-plane guidance. |
| Gemini | `specialist-agent` | degraded via generated command routes | Gemini CLI projects specialist-agent in degraded form via degraded via generated command routes and explicit Foundry control-plane guidance. |
| Gemini | `agent-preloaded-skill` | degraded via generated command routes | Gemini CLI projects agent-preloaded-skill in degraded form via degraded via generated command routes and explicit Foundry control-plane guidance. |
| Gemini | `multi-agent-orchestration` | degraded via generated command routes | Gemini CLI projects multi-agent-orchestration in degraded form via degraded via generated command routes and explicit Foundry control-plane guidance. |
| Gemini | `batch-agent-fanout` | degraded via generated command routes | Gemini CLI projects batch-agent-fanout in degraded form via degraded via generated command routes and explicit Foundry control-plane guidance. |
| Gemini | `memory-loading` | .gemini/GEMINI.md | Gemini CLI projects memory-loading in degraded form via .gemini/GEMINI.md and explicit Foundry control-plane guidance. |
| Gemini | `hook-support` | .gemini/commands/*.toml | Gemini CLI projects hook-support in degraded form via .gemini/commands/*.toml and explicit Foundry control-plane guidance. |
| Gemini | `agent-scoped-mcp` | .gemini/settings.json mcpServers | Gemini CLI projects agent-scoped-mcp in degraded form via .gemini/settings.json mcpServers and explicit Foundry control-plane guidance. |
| Gemini | `runtime-as-mcp-server` | .gemini/settings.json mcpServers | Gemini CLI projects runtime-as-mcp-server in degraded form via .gemini/settings.json mcpServers and explicit Foundry control-plane guidance. |
| Gemini | `sandbox-policy` | degraded preset guidance | Gemini CLI projects sandbox-policy in degraded form via degraded preset guidance and explicit Foundry control-plane guidance. |
| Gemini | `approval-policy` | degraded preset guidance | Gemini CLI projects approval-policy in degraded form via degraded preset guidance and explicit Foundry control-plane guidance. |
| Gemini | `session-resume` | degraded | Gemini CLI projects session-resume in degraded form via degraded and explicit Foundry control-plane guidance. |
| Gemini | `session-fork` | degraded | Gemini CLI projects session-fork in degraded form via degraded and explicit Foundry control-plane guidance. |
| Gemini | `headless-exec` | degraded | Gemini CLI projects headless-exec in degraded form via degraded and explicit Foundry control-plane guidance. |
| Gemini | `worktree-isolation` | .gemini/commands/*.toml | Gemini CLI projects worktree-isolation in degraded form via .gemini/commands/*.toml and explicit Foundry control-plane guidance. |
| Gemini | `scheduled-task` | .gemini/commands/*.toml | Gemini CLI projects scheduled-task in degraded form via .gemini/commands/*.toml and explicit Foundry control-plane guidance. |
| Antigravity | `instructions-hierarchy` | .agents/rules/GEMINI.md | Antigravity projects instructions-hierarchy in degraded form via .agents/rules/GEMINI.md and explicit Foundry control-plane guidance. |
| Antigravity | `instructions-override` | .agents/rules/GEMINI.md | Antigravity projects instructions-override in degraded form via .agents/rules/GEMINI.md and explicit Foundry control-plane guidance. |
| Antigravity | `config-layering` | <workspace>/.gemini/settings.json | Antigravity projects config-layering in degraded form via <workspace>/.gemini/settings.json and explicit Foundry control-plane guidance. |
| Antigravity | `config-profiles` | <workspace>/.gemini/settings.json | Antigravity projects config-profiles in degraded form via <workspace>/.gemini/settings.json and explicit Foundry control-plane guidance. |
| Antigravity | `skill-frontmatter` | .agents/skills/<id>/SKILL.md | Antigravity projects skill-frontmatter in degraded form via .agents/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Antigravity | `skill-string-substitution` | .agents/skills/<id>/SKILL.md | Antigravity projects skill-string-substitution in degraded form via .agents/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Antigravity | `skill-forked-execution` | .agents/skills/<id>/SKILL.md | Antigravity projects skill-forked-execution in degraded form via .agents/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Antigravity | `agent-registration` | degraded via generated specialist commands | Antigravity projects agent-registration in degraded form via degraded via generated specialist commands and explicit Foundry control-plane guidance. |
| Antigravity | `specialist-agent` | degraded via generated specialist commands | Antigravity projects specialist-agent in degraded form via degraded via generated specialist commands and explicit Foundry control-plane guidance. |
| Antigravity | `agent-preloaded-skill` | degraded via generated specialist commands | Antigravity projects agent-preloaded-skill in degraded form via degraded via generated specialist commands and explicit Foundry control-plane guidance. |
| Antigravity | `multi-agent-orchestration` | degraded via generated specialist commands | Antigravity projects multi-agent-orchestration in degraded form via degraded via generated specialist commands and explicit Foundry control-plane guidance. |
| Antigravity | `batch-agent-fanout` | degraded via generated specialist commands | Antigravity projects batch-agent-fanout in degraded form via degraded via generated specialist commands and explicit Foundry control-plane guidance. |
| Antigravity | `memory-loading` | .agents/rules/GEMINI.md | Antigravity projects memory-loading in degraded form via .agents/rules/GEMINI.md and explicit Foundry control-plane guidance. |
| Antigravity | `hook-support` | .gemini/commands/*.toml | Antigravity projects hook-support in degraded form via .gemini/commands/*.toml and explicit Foundry control-plane guidance. |
| Antigravity | `agent-scoped-mcp` | Foundry gateway + runtime MCP settings | Antigravity projects agent-scoped-mcp in degraded form via Foundry gateway + runtime MCP settings and explicit Foundry control-plane guidance. |
| Antigravity | `runtime-as-mcp-server` | Foundry gateway + runtime MCP settings | Antigravity projects runtime-as-mcp-server in degraded form via Foundry gateway + runtime MCP settings and explicit Foundry control-plane guidance. |
| Antigravity | `sandbox-policy` | degraded preset guidance | Antigravity projects sandbox-policy in degraded form via degraded preset guidance and explicit Foundry control-plane guidance. |
| Antigravity | `approval-policy` | degraded preset guidance | Antigravity projects approval-policy in degraded form via degraded preset guidance and explicit Foundry control-plane guidance. |
| Antigravity | `session-resume` | degraded | Antigravity projects session-resume in degraded form via degraded and explicit Foundry control-plane guidance. |
| Antigravity | `session-fork` | degraded | Antigravity projects session-fork in degraded form via degraded and explicit Foundry control-plane guidance. |
| Antigravity | `headless-exec` | degraded | Antigravity projects headless-exec in degraded form via degraded and explicit Foundry control-plane guidance. |
| Antigravity | `worktree-isolation` | .gemini/commands/*.toml | Antigravity projects worktree-isolation in degraded form via .gemini/commands/*.toml and explicit Foundry control-plane guidance. |
| Antigravity | `scheduled-task` | .gemini/commands/*.toml | Antigravity projects scheduled-task in degraded form via .gemini/commands/*.toml and explicit Foundry control-plane guidance. |

## Safety Modes

| Platform | Review | Development | Unattended | Trusted | Warnings |
| --- | --- | --- | --- | --- | --- |
| Codex | read-only + untrusted | workspace-write + on-request | read-only + never | workspace-write or danger-full-access + never | Do not pair danger-full-access with never outside a real containment boundary. |
| Claude | plan mode or restrictive permissions | accept-edits style settings and project hooks | degraded; depends on runtime mode and environment | bypass-style modes only in contained environments | Treat bypass or dangerous permissions as trusted-mode only. |
| Copilot | degraded preset guidance | degraded preset guidance | degraded or external automation | degraded and environment-dependent | Copilot parity relies on generated prompts and environment policy more than native approval controls. |
| Gemini | degraded preset guidance | degraded preset guidance | degraded or external automation | degraded and environment-dependent | Gemini parity uses generated commands and Foundry policy to emulate profile-like safety defaults. |
| Antigravity | degraded preset guidance | degraded preset guidance | degraded or external automation | degraded and environment-dependent | Antigravity parity depends on generated command routes more than native profile or agent controls. |

## Instruction, Config, and Profiles

| Platform | Root Instruction | Hierarchy | Personal Override | User Config | Project Config | Profiles | Invocation Overrides |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | AGENTS.md | native ancestor-loading | AGENTS.override.md | ~/.codex/config.toml | <workspace>/.codex/config.toml | native | CLI flags, -c key=value |
| Claude | CLAUDE.md | native ancestor-loading with lazy descendant loading | .claude/settings.local.json and user/global rules | ~/.claude/settings.json | <workspace>/.claude/settings.json | degraded via settings presets and runtime modes | CLI flags, .claude/settings.local.json |
| Copilot | AGENTS.md + .github/copilot-instructions.md | degraded through generated rule surfaces | global user instruction file | ~/.copilot/mcp-config.json | <workspace>/.vscode/mcp.json | degraded via Foundry presets | VS Code settings, runtime UI controls |
| Gemini | .gemini/GEMINI.md | degraded through generated command/rule surfaces | global or local runtime settings | ~/.gemini/settings.json | <workspace>/.gemini/settings.json | degraded via Foundry presets | runtime settings, Foundry install flags |
| Antigravity | .agents/rules/GEMINI.md | degraded through generated rule/command surfaces | global runtime rules and local install choices | ~/.gemini/settings.json | <workspace>/.gemini/settings.json | degraded via Foundry presets | runtime settings, Foundry install flags |

## Session and Execution

| Platform | Resume | Fork | Headless | Machine-Readable Output | Worktree Isolation |
| --- | --- | --- | --- | --- | --- |
| Codex | native | native | native | native | native or external git worktree |
| Claude | native | native or session-branch equivalent | native via print/headless surfaces | degraded | native or runtime-supported |
| Copilot | degraded | degraded | degraded | degraded | external |
| Gemini | degraded | degraded | degraded | degraded | external |
| Antigravity | degraded | degraded | degraded | degraded | external |

## Orchestration Subtypes

| Subtype | Codex | Claude | Copilot | Gemini | Antigravity | Canonical Projection |
| --- | --- | --- | --- | --- | --- | --- |
| `command -> agent -> skill` | native | native | degraded | native | native | Workflow entrypoint resolves intent, hands off to a specialist agent, loads supporting skills, and validates the outcome. |
| `skill -> skill` | native | native | degraded | native | native | Composable skill pipeline with a typed handoff contract between sequential skills. |
| `orchestrator -> specialists -> validator` | native | native | degraded | native | native | Control-plane orchestration pattern where an orchestrator delegates to specialists and accepts only validated outputs. |

## MCP and Browser

| Platform | MCP Client Surface | Scoped MCP | Runtime as MCP Server | Browser Verification |
| --- | --- | --- | --- | --- |
| Codex | [mcp_servers.*] in .codex/config.toml | native agent-scoped MCP | native via codex mcp-server | native when browser MCP is configured |
| Claude | .mcp.json and Claude settings | native agent-scoped MCP | degraded via Foundry gateway or external MCP server | native when browser MCP is configured |
| Copilot | .vscode/mcp.json or user mcp-config.json | degraded | degraded via Foundry gateway | native when Playwright/browser MCP is configured |
| Gemini | .gemini/settings.json mcpServers | degraded | degraded via Foundry gateway | native when MCP/browser tooling is configured |
| Antigravity | Foundry gateway + runtime MCP settings | degraded | degraded via Foundry gateway | native when Playwright/browser MCP is configured |

## Blocked Patterns

No blocked patterns. Every audited pattern is mapped as `native` or `degraded` for every supported platform.
