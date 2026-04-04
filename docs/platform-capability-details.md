# Platform Capability Details

This document consolidates the detailed parity views. Full machine-readable detail lives in the generated parity JSON files.

## Foundry Harness Parity Spec (Verified 2026-04-04)

This section is the strict decision table for the ECC-inspired runtime layers: packaging, harness, loop control, hook profiles, and security posture. When this section conflicts with older broad pattern tables below, this section wins for Foundry product and adapter decisions.

Support levels:

- `native`: vendor-documented first-class surface exists
- `degraded`: supported through a nearby native surface or explicit Foundry projection
- `unsupported`: no documented safe native surface
- `do-not-ship`: Foundry must not claim or generate the behavior for that platform

### Vendor-Native Support

| Capability | Claude | Codex | Copilot | Gemini | Antigravity |
| --- | --- | --- | --- | --- | --- |
| `packaging-model` | `native` via `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/*`, `.claude/settings.json` | `native` via `AGENTS.md`, `.codex/agents/*.toml`, `.agents/skills/*`, `.codex/config.toml` | `native` via `AGENTS.md`, `.github/copilot-instructions.md`, `.github/agents/*.agent.md`, `.github/skills/*`, `.github/hooks/*.json`, `.vscode/mcp.json` | `native` via `.gemini/GEMINI.md`, `.gemini/commands/**/*.toml`, `.gemini/agents/*.md`, `.gemini/skills/*`, `.gemini/settings.json` | `degraded` and `inferred` via `.agents/rules/GEMINI.md`, `.gemini/commands/*.toml`, `.agents/skills/*` |
| `harness-model` | `native` | `native`; instructions, skills, subagents, MCP, and documented hook events exist, though hook enablement remains feature-gated in current local CLI builds | `native`, but split across GitHub, IDE, and CLI surfaces | `native` | `degraded` and `inferred` |
| `loop-model` | `native` via subagents plus hooks | `native` via subagents plus documented hook continuation events | `degraded` because hooks and autonomy exist, but there is not one shared repo-local loop primitive across all Copilot surfaces | `native` via commands, hooks, skills, and experimental subagents | `degraded` and `inferred`; current projection is command-driven |
| `hook-profile-idea` | `native`; named profiles are a Foundry layer mapped onto native hooks | `native`; the hook surface is documented, but profile naming remains a Foundry abstraction and current local installs remain feature-gated | `native`; hook surface exists, but profile naming remains a Foundry abstraction | `native`; hook surface exists, but profile naming remains a Foundry abstraction | `unsupported`; do not treat as vendor-native until a public spec exists |
| `security-posture` | `native`; rules, hooks, MCP, and permission controls all exist | `native`; rules, config, MCP, and approval controls exist, but hook-based enforcement is weaker | `native`; rules, hooks, MCP, and runtime policy surfaces exist | `native`; rules, hooks, policy settings, and MCP exist | `degraded` and `inferred`; rules and command guidance are available, but hard enforcement is not verified |

### Foundry Ship Rules

| Capability | Claude | Codex | Copilot | Gemini | Antigravity |
| --- | --- | --- | --- | --- | --- |
| `packaging-model` | ship `native` | ship `native` | ship `native` | ship `native` | ship as a compatibility target only and label it `inferred` |
| `harness-model` | ship full harness parity | ship full packaging and subagent parity, but keep hook emission gated until Foundry verifies the local project install flow end to end | ship full harness parity only on surfaces where the capability is actually available | ship full harness parity | ship limited harness parity only |
| `loop-model` | ship hook-backed native loop flow | ship native loop semantics where rules, subagents, and approvals apply, but keep hook-backed continuation gated until local install verification is complete | ship bounded degraded loop flow unless the selected Copilot surface supports the needed primitives | ship command-plus-hook loop flow | ship command-only loop flow; do not claim hook-backed parity |
| `hook-profile-idea` | ship `native` | ship documented hook support behind a Foundry gate until the project install flow is locally verified | ship `native` only when the adapter emits real hook artifacts | ship `native` only when the adapter emits real hook artifacts | `do-not-ship` |
| `security-posture` | ship hard enforcement plus rule guidance | ship hard policy guidance without hook assumptions | ship hard enforcement where hooks exist and policy guidance elsewhere | ship hard enforcement plus policy guidance | ship policy guidance only and label enforcement limits clearly |

### Current Foundry Adapter Status

- Claude is the current reference implementation for full harness parity. Native hook artifacts exist under `workflows/workflows/agent-environment-setup/platforms/claude/hooks/`.
- Codex should be treated as a full packaging and security target. OpenAI's Codex docs now describe project hook events, including `UserPromptSubmit` and `Stop`, and local CLI inspection still shows hook enablement as gated. Foundry should document hooks as real but keep emission behind a gate until project install verification is complete.
- Gemini and Copilot both have vendor-native hook surfaces, and Foundry now emits baseline hook artifacts for both. Gemini receives route/research plus shell-security templates; Copilot receives repo-native security guard hooks, while prompt-routing guidance remains in instructions and prompts.
- Antigravity currently remains a Gemini-family compatibility target. Foundry projects loop support through `workflows/workflows/agent-environment-setup/platforms/antigravity/commands/loop.toml` and rules through `workflows/workflows/agent-environment-setup/platforms/antigravity/rules/GEMINI.md`.
- Security posture should be treated as universal Foundry policy, but hard enforcement strength depends on the platform's native hook or policy surfaces.

### Source Notes

- Claude: official memory, hooks, and sub-agent docs support native harness and loop behavior.
- Codex: official `AGENTS.md`, skills, subagents, and hooks docs support native packaging and harness layers. Local CLI inspection on 2026-04-04 still shows hook enablement as gated, so Foundry should separate vendor support from local install readiness.
- Gemini: official `GEMINI.md`, skills, commands, hooks, MCP, and experimental remote subagent docs support a native harness model with clearly scoped stability.
- Copilot: official repository instructions, custom agents, hooks, agent skills, MCP, and CLI autonomy docs support a native but fragmented harness model.
- Antigravity is an inference from Foundry's local adapter shape and Gemini-family positioning, not a verified public vendor spec.


## Canonical Installed Surfaces

This section is the authoritative Foundry install contract for each platform. It distinguishes vendor support from what Foundry actually ships and the exact path/format of the installed surface.

### Codex

- Hook support flag: `gated`
- Workflow surface kind: `generated-skill`
- Specialist route renderer: `subagent`

| Surface | Vendor Support | Foundry Status | Scope | Stability | Evidence | Project Path | Global Path | Format | Native/Projected | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rules` | native | `native` | repo | stable | official-doc | AGENTS.md | ~/.codex/AGENTS.md | Markdown | native | Primary repository instruction surface. Foundry does not ship a separate project workflow directory for Codex. |
| `skills` | native | `native` | repo | stable | official-doc | .agents/skills/<skill-id>/SKILL.md | ~/.agents/skills/<skill-id>/SKILL.md | Markdown | native | Shared skill vault used for direct skill installs. |
| `workflows` | native via workflow skills | `native` | repo | stable | official-doc, foundry-projection | .agents/skills/<workflow-id>/SKILL.md | ~/.agents/skills/<workflow-id>/SKILL.md | Markdown | projected workflow skill | Foundry installs workflows as generated workflow skills. `.codex/workflows` is not a shipped install surface. |
| `customAgents` | unsupported | `do-not-ship` | mixed | unsupported | official-doc | n/a | n/a | n/a | do-not-ship | Use native Codex subagents instead. |
| `subagents` | native | `native` | repo | stable | official-doc | .codex/agents/*.toml | ~/.codex/agents/*.toml | TOML | native subagent | This is the only native specialist file surface Foundry ships for Codex. |
| `hooks` | native documented hook surface | `gated` | repo | experimental | official-doc, local-cli | .codex/hooks/*.json + .codex/config.toml | ~/.codex/config.toml | JSON + command hook declarations | native hook config | Codex docs describe repo hook events, including UserPromptSubmit and Stop, but Foundry still gates hook emission until the local feature flag and install flow are verified together. |

### Claude Code

- Hook support flag: `native`
- Workflow surface kind: `generated-skill`
- Specialist route renderer: `subagent`

| Surface | Vendor Support | Foundry Status | Scope | Stability | Evidence | Project Path | Global Path | Format | Native/Projected | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rules` | native | `native` | repo | stable | official-doc | CLAUDE.md | ~/.claude/CLAUDE.md | Markdown | native | Primary rules file, with optional scoped rules in `.claude/rules/*.md` and local settings in `.claude/settings.json`. |
| `skills` | native | `native` | repo | stable | official-doc | .claude/skills/<skill-id>/SKILL.md | ~/.claude/skills/<skill-id>/SKILL.md | Markdown | native | Primary Claude skill install surface. |
| `workflows` | native slash commands; Foundry installs projected workflow skills | `native` | repo | stable | official-doc, foundry-projection | .claude/skills/<workflow-id>/SKILL.md | ~/.claude/skills/<workflow-id>/SKILL.md | Markdown | projected workflow skill | Foundry installs workflows as generated skills under `.claude/skills`; `.claude/workflows` is legacy cleanup only. |
| `customAgents` | unsupported | `do-not-ship` | mixed | unsupported | official-doc | n/a | n/a | n/a | do-not-ship | Claude uses subagents rather than a separate custom-agent file class. |
| `subagents` | native | `native` | repo | stable | official-doc | .claude/agents/*.md | ~/.claude/agents/*.md | Markdown with YAML frontmatter | native subagent | Specialist routes ship as native Claude subagents. |
| `hooks` | native | `native` | repo | stable | official-doc | .claude/hooks/* + .claude/settings.json | ~/.claude/hooks/* + ~/.claude/settings.json | JSON + JavaScript | native hook templates | Foundry ships project hook templates and settings snippets for safe native hook wiring. |

### GitHub Copilot

- Hook support flag: `native`
- Workflow surface kind: `prompt`
- Specialist route renderer: `custom-agent`

| Surface | Vendor Support | Foundry Status | Scope | Stability | Evidence | Project Path | Global Path | Format | Native/Projected | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rules` | native | `native` | mixed | stable | official-doc | .github/copilot-instructions.md (optionally alongside AGENTS.md and .github/instructions/*.instructions.md) | ~/.copilot/copilot-instructions.md | Markdown | native | Foundry treats `.github/copilot-instructions.md` as the primary rules file and may also generate compatible companion instruction surfaces. |
| `skills` | native | `native` | repo | stable | official-doc | .github/skills/<skill-id>/SKILL.md | ~/.copilot/skills/<skill-id>/SKILL.md | Markdown | native | Primary Copilot skill surface. |
| `workflows` | native prompt files | `native` | ide | preview | official-doc | .github/prompts/<workflow-id>.prompt.md | ~/.copilot/prompts/<workflow-id>.prompt.md | Markdown prompt file | native workflow prompt | Foundry ships workflows as prompt files, not a project workflow directory. |
| `customAgents` | native | `native` | cli | stable | official-doc | .github/agents/*.agent.md | ~/.copilot/agents/*.agent.md | Markdown with frontmatter | native custom agent | Foundry should emit `.agent.md` files for Copilot custom agents. |
| `subagents` | unsupported | `do-not-ship` | mixed | unsupported | official-doc | n/a | n/a | n/a | do-not-ship | Copilot specialist routes use custom agents, not subagents. |
| `hooks` | native | `native` | repo | stable | official-doc | .github/hooks/*.json + .github/hooks/*.mjs | n/a | JSON + JavaScript | native hook templates | Foundry keeps Copilot hooks security-focused and repo-native. MCP stays in `.vscode/mcp.json`. |

### Gemini CLI

- Hook support flag: `native`
- Workflow surface kind: `command`
- Specialist route renderer: `agent-route-command`

| Surface | Vendor Support | Foundry Status | Scope | Stability | Evidence | Project Path | Global Path | Format | Native/Projected | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rules` | native | `native` | repo | stable | official-doc | .gemini/GEMINI.md | ~/.gemini/GEMINI.md | Markdown | native | Foundry treats `.gemini/GEMINI.md` as primary. Root `GEMINI.md` is compatibility/read guidance only. |
| `skills` | native | `native` | repo | stable | official-doc | .gemini/skills/<skill-id>/SKILL.md | ~/.gemini/skills/<skill-id>/SKILL.md | Markdown | native | Foundry now ships native Gemini skill files under `.gemini/skills`, including sidecar references when present. |
| `workflows` | native command files | `native` | repo | stable | official-doc | .gemini/commands/<workflow-id>.toml | ~/.gemini/commands/<workflow-id>.toml | TOML | native/projected command route | This is the canonical shipped workflow surface for Gemini. |
| `customAgents` | unsupported in Foundry's current ship model | `do-not-ship` | mixed | unsupported | official-doc | n/a | n/a | n/a | do-not-ship | Foundry does not currently ship a Gemini custom-agent file surface. |
| `subagents` | experimental remote subagents | `do-not-ship` | repo | experimental | official-doc | .gemini/agents/*.md | ~/.gemini/agents/*.md | Markdown with YAML frontmatter | native experimental subagent | Gemini documents an experimental subagent surface, but Foundry keeps specialist routes on command files until that surface is deliberately adopted. |
| `hooks` | native | `native` | repo | stable | official-doc | .gemini/hooks/* + .gemini/settings.json | ~/.gemini/settings.json | JSON + JavaScript | native hook templates | Foundry ships route/research and shell-security hook templates. |

### Antigravity

- Hook support flag: `do-not-ship`
- Workflow surface kind: `command`
- Specialist route renderer: `agent-route-command`

| Surface | Vendor Support | Foundry Status | Scope | Stability | Evidence | Project Path | Global Path | Format | Native/Projected | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rules` | degraded and inferred | `compatibility-target` | repo | inferred | inferred | .agents/rules/GEMINI.md | ~/.gemini/GEMINI.md | Markdown | projected rules surface | Foundry treats this as a Gemini-family compatibility rules surface. |
| `skills` | degraded and inferred | `compatibility-target` | repo | inferred | inferred | .agents/skills/<skill-id>/SKILL.md | ~/.gemini/antigravity/skills/<skill-id>/SKILL.md | Markdown | projected skill surface | Primary shipped skill surface for Antigravity compatibility installs. |
| `workflows` | degraded command projection | `compatibility-target` | repo | inferred | inferred | .gemini/commands/<workflow-id>.toml | ~/.gemini/commands/<workflow-id>.toml | TOML | projected command route | Foundry ships workflows as Gemini-family command routes. |
| `customAgents` | unsupported | `do-not-ship` | mixed | unsupported | inferred | n/a | n/a | n/a | do-not-ship | Foundry does not claim a native Antigravity custom-agent file surface. |
| `subagents` | unsupported | `do-not-ship` | mixed | unsupported | inferred | n/a | n/a | n/a | do-not-ship | Specialist behavior is projected through command routes, not subagent files. |
| `hooks` | unsupported and unverified | `do-not-ship` | mixed | unsupported | inferred | n/a | n/a | n/a | do-not-ship | No verified native hook surface is claimed for Antigravity in Foundry. |


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
| `supporting-skill` | native | native | native | native | native |
| `skill-discovery` | native | native | degraded | native | native |
| `skill-frontmatter` | native | native | degraded | native | degraded |
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
| `hook-support` | native | native | native | native | degraded |
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
| Codex | `scheduled-task` | .agents/skills/<workflow-id>/SKILL.md | Recurring work is projected into external automation or future Foundry automation, not native in-session scheduling. |
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
| Copilot | `agent-preloaded-skill` | .github/agents/*.agent.md | GitHub Copilot projects agent-preloaded-skill in degraded form via .github/agents/*.agent.md and explicit Foundry control-plane guidance. |
| Copilot | `multi-agent-orchestration` | .github/agents/*.agent.md | GitHub Copilot projects multi-agent-orchestration in degraded form via .github/agents/*.agent.md and explicit Foundry control-plane guidance. |
| Copilot | `batch-agent-fanout` | .github/agents/*.agent.md | GitHub Copilot projects batch-agent-fanout in degraded form via .github/agents/*.agent.md and explicit Foundry control-plane guidance. |
| Copilot | `orchestration-chain` | .github/prompts/*.prompt.md | GitHub Copilot projects orchestration-chain in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `review-and-validation` | .github/prompts/*.prompt.md | GitHub Copilot projects review-and-validation in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `research-escalation` | .github/prompts/*.prompt.md | GitHub Copilot projects research-escalation in degraded form via .github/prompts/*.prompt.md and explicit Foundry control-plane guidance. |
| Copilot | `memory-loading` | AGENTS.md + .github/copilot-instructions.md | GitHub Copilot projects memory-loading in degraded form via AGENTS.md + .github/copilot-instructions.md and explicit Foundry control-plane guidance. |
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
| Gemini | `skill-string-substitution` | .gemini/skills/<id>/SKILL.md | Gemini CLI projects skill-string-substitution in degraded form via .gemini/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Gemini | `skill-forked-execution` | .gemini/skills/<id>/SKILL.md | Gemini CLI projects skill-forked-execution in degraded form via .gemini/skills/<id>/SKILL.md and explicit Foundry control-plane guidance. |
| Gemini | `agent-registration` | .gemini/agents/*.md (experimental, not shipped by Foundry) | Gemini CLI projects agent-registration in degraded form via .gemini/agents/*.md (experimental, not shipped by Foundry) and explicit Foundry control-plane guidance. |
| Gemini | `specialist-agent` | .gemini/agents/*.md (experimental, not shipped by Foundry) | Gemini CLI projects specialist-agent in degraded form via .gemini/agents/*.md (experimental, not shipped by Foundry) and explicit Foundry control-plane guidance. |
| Gemini | `agent-preloaded-skill` | .gemini/agents/*.md (experimental, not shipped by Foundry) | Gemini CLI projects agent-preloaded-skill in degraded form via .gemini/agents/*.md (experimental, not shipped by Foundry) and explicit Foundry control-plane guidance. |
| Gemini | `multi-agent-orchestration` | .gemini/agents/*.md (experimental, not shipped by Foundry) | Gemini CLI projects multi-agent-orchestration in degraded form via .gemini/agents/*.md (experimental, not shipped by Foundry) and explicit Foundry control-plane guidance. |
| Gemini | `batch-agent-fanout` | .gemini/agents/*.md (experimental, not shipped by Foundry) | Gemini CLI projects batch-agent-fanout in degraded form via .gemini/agents/*.md (experimental, not shipped by Foundry) and explicit Foundry control-plane guidance. |
| Gemini | `memory-loading` | .gemini/GEMINI.md | Gemini CLI projects memory-loading in degraded form via .gemini/GEMINI.md and explicit Foundry control-plane guidance. |
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
