# Platform Adaptations

## Overview

Each platform (Claude Code, Codex, Gemini CLI, Antigravity, Copilot) has different capabilities and file format requirements. When adapting skills for different platforms, the content stays the same but the packaging changes.

## Platform-Specific Frontmatter

### Claude Code (Full Frontmatter)

```yaml
---
name: skill-name
description: "Use when..."
allowed-tools: [Read, Edit, Write, Bash, Grep, Glob]
context: fork
agent: specialist-agent-name
model: inherit
user-invocable: true
argument-hint: "describe what to do"
---
```

**Unique fields:**
- `allowed-tools` — restricts which tools the skill can use
- `context: fork` — runs the skill in an isolated subagent
- `agent` — specifies which agent runs the forked context
- `model` — override the model (default: inherit from caller)
- `user-invocable` — whether users can invoke directly
- `argument-hint` — help text for skill arguments

**Variables:**
- `$ARGUMENTS` — user-provided arguments when invoking the skill
- `${CLAUDE_SKILL_DIR}` — absolute path to the skill's directory

### Codex CLI (Minimal Frontmatter)

```yaml
---
name: skill-name
description: "Use when..."
---
```

**Only name and description are recognized.** All other fields are ignored.

**Key differences:**
- No agent spawning — specialists are "postures" (internal mode switches)
- No `context: fork` — all execution is in the main context
- Network may be restricted in sandbox mode
- References must be in the same directory (no absolute paths)

### Gemini CLI (Minimal Frontmatter)

```yaml
---
name: skill-name
description: "Use when..."
---
```

**Only name and description are recognized.**

**Key differences:**
- Uses `activate_skill` tool for progressive disclosure
- Commands use TOML format (`.gemini/commands/<name>.toml`)
- Extensions system for additional capabilities
- Path prefix: `.gemini/`

### Antigravity (Minimal Frontmatter)

```yaml
---
name: skill-name
description: "Use when..."
---
```

**Key differences:**
- Agent Manager for parallel agents (no custom subagent spawning)
- Rule files use `trigger: always_on` in frontmatter
- Workflow-based multi-step instead of `context:fork`
- Path prefix: `.agent/`
- Commands use TOML format (shared with Gemini CLI)

### GitHub Copilot (Claude-Compatible)

```yaml
---
name: skill-name
description: "Use when..."
allowed-tools: [Read, Edit, Write, Bash, Grep, Glob]
---
```

**Reads Claude format natively.** Same frontmatter as Claude Code works.

**Additional features:**
- Prompt files: `.github/prompts/<name>.prompt.md`
- Path-scoped instructions: `.github/instructions/<name>.instructions.md`
- `applyTo` glob for file-pattern-based activation
- `excludeAgent` to hide instructions from specific agents
- Also reads `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`

## Adaptation Strategy

### Canonical Version (workflows/skills/)
The canonical skill in `workflows/skills/<name>/` is the authoring source of truth.

### Generated Platform Mirrors
Generated mirrors are maintained for Claude Code, Copilot, Codex, Gemini CLI, and Antigravity under `platforms/<platform>/skills/<name>/SKILL.md`.

- Claude Code mirrors can use Claude-specific frontmatter and instruction references such as `context: fork`, `$ARGUMENTS`, and `${CLAUDE_SKILL_DIR}`.
- Copilot mirrors stay Claude-compatible where useful, but Copilot-native behavior still follows Copilot's own constraints.
- Codex, Gemini CLI, and Antigravity mirrors usually keep minimal frontmatter and rely on platform rules plus MCP/routing behavior for the rest.
- Do not assume one mirror transform works for every asset type. Skills, custom agents, workflow projections, prompts, and command files each have different platform constraints and must be generated through their own platform-aware pipeline.

### Shared Steering + Platform Overrides
Routing and loading behavior should not be documented independently in every platform skill.

- `shared/rules/STEERING.md` is the canonical routing and skill-loading source.
- `shared/rules/overrides/<platform>.md` adds platform-specific behavior.
- Generated platform rule files are composed from the shared steering file plus the relevant platform override.

### Non-Skill Assets
Custom agents and workflow projections are not mirrored with the same logic as skills.

- Skills are mirrored with platform-specific frontmatter and body transforms.
- Shared agents are compiled into platform-native outputs such as Claude/Copilot markdown agents or Codex TOML agents.
- Workflows are compiled into platform-native workflow skills, command files, or prompt files depending on the target platform.
- Regenerate these with the platform asset generator, not by copying skill directories.

## Instruction Adaptation

When the canonical instructions reference platform-specific features, adapt them:

| Canonical | Claude Code | Codex | Gemini | Antigravity | Copilot |
|-----------|------------|-------|--------|-------------|---------|
| "fork to subagent" | `context: fork` | "switch posture" | "activate agent" | "use workflow" | `context: fork` |
| "load reference" | `skill_get_reference` | "read file" | `activate_skill` | "read file" | `skill_get_reference` |
| "use MCP tool" | `skill_validate` / `skill_get` | `skill_validate` / `skill_get` when MCP is connected | `skill_validate` / `skill_get` when MCP is connected; `activate_skill` only when using Gemini-native skill loading | `skill_validate` / `skill_get` when MCP is configured | `skill_validate` / `skill_get` when MCP is configured |
| "run script" | `Bash` | `Bash` (may be sandboxed) | Shell | Shell | `Bash` |
