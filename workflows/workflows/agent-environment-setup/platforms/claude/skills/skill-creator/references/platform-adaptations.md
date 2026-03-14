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
The canonical skill in `workflows/skills/<name>/` uses the full Pro Skill Standard format with rich frontmatter. This is the source of truth.

### Claude Code Mirror
Placed at `platforms/claude/skills/<name>/SKILL.md`. Uses full Claude frontmatter. Instructions may reference `context:fork`, `$ARGUMENTS`, and `${CLAUDE_SKILL_DIR}`.

### Copilot Mirror
Placed at `platforms/copilot/skills/<name>/SKILL.md`. Same as Claude (Copilot reads Claude format). May add notes about prompt files and path-scoped instructions.

### Codex, Gemini CLI, Antigravity
These platforms use the canonical version directly, referenced by their respective rule files. No separate mirror needed — the rule files handle routing.

## Instruction Adaptation

When the canonical instructions reference platform-specific features, adapt them:

| Canonical | Claude Code | Codex | Gemini | Antigravity | Copilot |
|-----------|------------|-------|--------|-------------|---------|
| "fork to subagent" | `context: fork` | "switch posture" | "activate agent" | "use workflow" | `context: fork` |
| "load reference" | `skill_get_reference` | "read file" | `activate_skill` | "read file" | `skill_get_reference` |
| "use MCP tool" | `skill_validate` | N/A | `activate_skill` | N/A | N/A |
| "run script" | `Bash` | `Bash` (may be sandboxed) | Shell | Shell | `Bash` |
