# Cubis Foundry — Platform Research Summary

> Validated against current repo state (`@cubis/foundry` 0.3.75)
> Date: 2026-03-15

---

## 0. Validation Note — Current Cubis Foundry CLI

- Current runtime surface is `cbx {init|workflows|mcp|rules|agents|remove}`.
- `cbx` is a workflow-environment manager, not a direct coding-agent shell.
- Use source code and `--help` output as the current CLI truth; some prose docs in-repo can drift.
- `agents` is currently status-only in the public CLI, even though the platform bundle ships agent/workflow content.

---

## 1. Claude Code (code.claude.com)

### Skill Format
- **Path:** `.claude/skills/<name>/SKILL.md`
- **Frontmatter (YAML):** name, description, disable-model-invocation, user-invocable, allowed-tools, model, context (fork), agent, hooks, argument-hint
- **Body:** Markdown instructions, progressive disclosure via `## References` table

### Agent Format
- **Path:** `.claude/agents/<name>.md`
- **Frontmatter (YAML):** name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, isolation

### Rules
- **Path:** `CLAUDE.md` (project root) or `.claude/CLAUDE.md`
- **Scoped rules:** `.claude/rules/*.md`

### Key Features
- `context: fork` for subagent delegation — spawns skill in isolated subagent
- Progressive disclosure via reference files loaded on demand
- MCP skill tools: `skill_validate`, `skill_get`, `skill_get_reference`, `skill_search`, `route_resolve`
- `$ARGUMENTS` variable for skill arguments
- `${CLAUDE_SKILL_DIR}` for relative path resolution

### Commands
- `.claude/commands/<name>.md` — still supported for explicit commands; skills remain the preferred reusable capability surface

---

## 2. Codex CLI (OpenAI)

### Skill Format
- **Path:** `.agents/skills/<name>/SKILL.md`
- **Frontmatter (YAML):** name, description (only these two are recognized)
- **Body:** Same markdown body as Claude skills

### Agent Format
- **Path:** `.agents/agents/<name>.md`
- **Note:** Cubis Foundry models Codex specialists as postures by default, even though Codex now documents experimental multi-agent roles in `config.toml`
- **Frontmatter:** name, description (limited frontmatter support)

### Rules
- **Path:** `AGENTS.md` at project root
- **Also reads:** `CLAUDE.md` (compatibility)

### Workflows
- **Path:** `.agents/workflows/<name>.md`
- **Frontmatter:** command, description, triggers

### Key Features
- Cubis Foundry routes Codex specialists as internal postures by default
- Network may be restricted in sandbox mode
- References `AGENTS.md` as primary rule file
- Native skills plus MCP client/server support; unlike Claude, Codex does not expose Cubis-style `skill_*` helper tools

---

## 3. Gemini CLI (geminicli.com, validated March 2026)

### Skill Format
- **Path:** `.gemini/skills/<name>/SKILL.md`
- **Frontmatter (YAML):** name, description ONLY (no other fields recognized)
- **Body:** Same markdown body

### Agent Format
- **Path:** `.gemini/agents/<name>.md`
- **Frontmatter (YAML):** name, description, kind (local/remote), tools (wildcard), model, temperature, max_turns, timeout_mins

### Rules
- **Path:** `.gemini/GEMINI.md`

### Commands
- **Path:** `.gemini/commands/<name>.toml`
- **Format:** TOML with `prompt` + `description` fields
- **Supports:** `{{args}}` for arguments, `!{shell}` for shell interpolation, `@{file}` for file inclusion

### Key Features
- `activate_skill` tool for progressive disclosure
- TOML commands (not markdown)
- Extensions system for additional capabilities
- Simpler frontmatter — only name + description

---

## 4. Antigravity (Google IDE Agent)

### Skill Format
- **Path:** `.agent/skills/<name>/SKILL.md`
- **Frontmatter (YAML):** name, description ONLY

### Agent Format
- **Path:** `.agent/agents/<name>.md`
- **Frontmatter:** Same as Claude Code format (name, description, tools, model, etc.)

### Rules
- **Path:** `.agent/rules/GEMINI.md`
- **Frontmatter:** `trigger: always_on`

### Workflows
- **Path:** `.agent/workflows/<name>.md`

### Commands
- **Path:** `.gemini/commands/<name>.toml` (shared with Gemini CLI)
- **Format:** Same TOML format as Gemini CLI

### Key Features
- Agent Manager for parallel agents
- No custom subagent spawning from skills (unlike Claude Code)
- `trigger: always_on` in rule files for persistent activation
- Workflow-based multi-step instead of `context:fork`

---

## 5. GitHub Copilot

### Skill Format
- **Path:** `.github/skills/<name>/SKILL.md`
- **Frontmatter:** Same as Claude Code (reads Claude format natively)

### Agent Format
- **Path:** `.github/agents/<name>.md`

### Rules
- **Path:** `.github/copilot-instructions.md`
- **Also reads:** `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (cross-platform compatibility)

### Workflows
- **Path:** `.github/copilot/workflows/<name>.md`

### Prompts
- **Path:** `.github/prompts/<name>.prompt.md`
- **Purpose:** Reusable prompt templates

### Instructions
- **Path:** `.github/instructions/<name>.instructions.md`
- **Frontmatter:** `applyTo` (glob pattern), `excludeAgent`
- **Purpose:** Path-scoped rules that apply to specific file patterns

### Key Features
- Reads multiple rule file formats (CLAUDE.md, AGENTS.md, GEMINI.md)
- Path-scoped instructions via `applyTo` globs
- Prompt files for reusable templates
- `excludeAgent` to prevent specific agents from seeing instructions

---

## 6. Platform Comparison Matrix

| Feature | Claude Code | Codex CLI | Gemini CLI | Antigravity | Copilot |
|---|---|---|---|---|---|
| Skill Path | `.claude/skills/` | `.agents/skills/` | `.gemini/skills/` | `.agent/skills/` | `.github/skills/` |
| Frontmatter | Full (10+ fields) | name+desc only | name+desc only | name+desc only | Full (Claude fmt) |
| Agent Spawning | Yes (context:fork) | Experimental roles in `config.toml`; Cubis Foundry uses postures by default | Experimental markdown subagents | No (Agent Manager) | Yes |
| Rule File | `CLAUDE.md` | `AGENTS.md` | `.gemini/GEMINI.md` | `.agent/rules/GEMINI.md` | `.github/copilot-instructions.md` |
| Skill / MCP Surface | Yes (`skill_*`) | Native skills + MCP client/server | `activate_skill` + MCP client | No dedicated skill helper tools | No dedicated skill helper tools |
| Commands | Markdown commands | Built-in slash commands | TOML | TOML | Prompt files |
| Progressive Disclosure | References table | Manual | activate_skill | Manual | References table |

---

## 7. Skill Adaptation Strategy

### Claude Code SKILL.md
```yaml
---
name: skill-name
description: "Full description with trigger conditions"
allowed-tools: [Read, Edit, Write, Bash, Grep, Glob]
context: fork
agent: specialist-agent
---
```
- Full frontmatter with allowed-tools, context:fork, agent references
- `${CLAUDE_SKILL_DIR}` for relative paths
- `$ARGUMENTS` for skill arguments

### Codex SKILL.md
```yaml
---
name: skill-name
description: "Full description with trigger conditions"
---
```
- Name + description only in frontmatter
- No context:fork references — posture-based routing instead
- Instructions adapted for restricted network scenarios

### Gemini CLI SKILL.md
```yaml
---
name: skill-name
description: "Full description with trigger conditions"
---
```
- Name + description only
- Instructions reference `activate_skill` for progressive loading
- `.gemini/` paths in all references

### Antigravity SKILL.md
```yaml
---
name: skill-name
description: "Full description with trigger conditions"
---
```
- Name + description only
- No context:fork — workflow-based multi-step instead
- `.agent/` paths in references

### Copilot SKILL.md
- Same format as Claude Code (Copilot reads Claude format natively)
- Additional notes about prompt files and path-scoped instructions
- `.github/` paths for platform-specific references

---

## 8. Canonical Skill Directory Structure

```
workflows/skills/<name>/
  SKILL.md                          # Canonical skill definition
  evals/
    evals.json                      # Evaluation prompts + assertions
    assertions.md                   # Human-readable assertion details
  examples/
    01-<scenario>.md                # Usage example 1
    02-<scenario>.md                # Usage example 2
  references/
    <topic-1>.md                    # Reference document 1
    <topic-2>.md                    # Reference document 2
    <topic-3>.md                    # Reference document 3
  scripts/                          # (when applicable)
    <action>.sh|py
  agents/                           # (when applicable)
    <role>.md
```

### Platform Mirrors
```
workflows/.../platforms/claude/skills/<name>/SKILL.md       # Claude Code
workflows/.../platforms/copilot/skills/<name>/SKILL.md      # GitHub Copilot
```

Codex, Gemini CLI, and Antigravity use the canonical version referenced by their respective rule files.

---

## 9. Complete Skill Library (67 Skills)

### A — Languages (10)
python-best-practices, typescript-best-practices, golang-best-practices, rust-best-practices, javascript-best-practices, java-best-practices, kotlin-best-practices, swift-best-practices, csharp-best-practices, php-best-practices

### B — Frameworks (18)
go-fiber, nestjs, fastapi, express-nodejs, gin-golang, laravel, django-drf, spring-boot, nextjs, react, vuejs, svelte-sveltekit, react-native, t3-stack, remix, prisma, sqlalchemy, drizzle-orm

### C — Design/Architecture (7)
frontend-design, system-design, microservices-design, api-design, database-design, architecture-doc, tech-doc

### D — Testing/QA (7)
playwright-interactive, playwright-persistent-browser, electron-qa, unit-testing, integration-testing, performance-testing, systematic-debugging

### E — Security (5)
owasp-security-review, pentest-skill, vibesec, secret-management, sanitize-pii

### F — DevOps (4)
ci-cd-pipeline, docker-compose-dev, kubernetes-deploy, observability

### G — AI/ML (3)
llm-eval, rag-patterns, prompt-engineering

### H — Workflow (6)
git-workflow, code-review, sadd, kaizen-iteration, requesting-code-review, receiving-code-review

### I — Integrations (6)
stripe-integration, expo-app, react-native-callstack, huggingface-ml, google-workspace, mcp-server-builder

### J — Meta (1)
skill-creator

---

## 10. Recommended Cubis Foundry Enhancements

1. Generate the platform research/support matrix from canonical code and generator inputs to prevent count drift.
2. Add a docs consistency check that compares public help text, README defaults, and platform support tables.
3. Decide whether Playwright MCP should remain partial/internal or become a fully documented public init/install surface.
4. Add a documented markdown-to-PDF export path if the PDF is intended to stay maintained.
