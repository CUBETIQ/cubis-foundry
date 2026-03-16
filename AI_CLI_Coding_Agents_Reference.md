# AI CLI Coding Agents: Complete Feature Reference

> **Claude Code · Gemini CLI · OpenAI Codex**
> Skills · Subagents · Hooks · Workflows · Plugins · Agent Teams
> Deep Research Report — March 2026

---

## Validation Note (Cubis Foundry CLI, 2026-03-15)

- Repo/runtime cross-checks in this workspace were validated against `@cubis/foundry` 0.3.76.
- Current `cbx` surface is `init`, `workflows`, `mcp`, `rules`, `agents`, and `remove`.
- Treat current source code and `--help` output as the Cubis Foundry truth when this report and local product docs disagree.
- Codex claims not present in current official OpenAI docs should be treated as unverified.

---

## Table of Contents

1. [Platform Overview & Installation](#1-platform-overview--installation)
2. [Context / Memory Files](#2-context--memory-files)
3. [Skills — Format, Activation & Examples](#3-skills--format-activation--examples)
4. [Custom Subagents](#4-custom-subagents)
5. [Hooks — All Lifecycle Events](#5-hooks--all-lifecycle-events)
6. [Slash Commands & Custom Commands](#6-slash-commands--custom-commands)
7. [MCP (Model Context Protocol) Integration](#7-mcp-model-context-protocol-integration)
8. [Plugins & Extensions](#8-plugins--extensions)
9. [Multi-Agent & Agent Teams](#9-multi-agent--agent-teams)
10. [Configuration Files Reference](#10-configuration-files-reference)
11. [Complete Feature Comparison Matrix](#11-complete-feature-comparison-matrix)
12. [Workflow Patterns & Recipes](#12-workflow-patterns--recipes)
13. [Community Resources & Further Reading](#13-community-resources--further-reading)

---

## 1. Platform Overview & Installation

### Platform At a Glance

| Attribute | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| Creator | Anthropic | Google | OpenAI |
| Launch | Feb 2025 | Jun 2025 | May 2025 |
| Runtime | Node.js (npm) | Node.js (npm) | Rust binary (npm) |
| License | Proprietary | Apache 2.0 (open-source) | Proprietary (Rust OSS) |
| Primary model | Claude Opus 4.6 / Sonnet 4.6 | Gemini 3.1 Pro Preview | GPT-5.4 / GPT-5.3-Codex |
| Context window | 1M tokens | 1M tokens | 1M tokens (experimental) |
| Free tier | Via Anthropic subscription | 60 req/min, 1K/day (personal Google) | ChatGPT Plus/Pro/Business |
| Config file | `~/.claude/settings.json` + `CLAUDE.md` | `~/.gemini/settings.json` + `GEMINI.md` | `~/.codex/config.toml` + `AGENTS.md` |
| Context file | `CLAUDE.md` | `GEMINI.md` | `AGENTS.md` |
| Skills standard | Anthropic skills (SKILL.md) | Open Agent Skills (SKILL.md) | Open Agent Skills (SKILL.md) |
| Hooks | 14 lifecycle events | 10+ lifecycle events | No official hook system documented in current CLI docs |
| Subagents | Yes (markdown .md files) | Yes (markdown .md files) | Yes (config.toml roles) |
| Plugins | Yes (marketplace) | Yes (extensions marketplace) | Yes (plugin system) |
| MCP support | Full MCP client + server | Full MCP client | Full MCP client + server |
| Multi-agent | Agent Teams (Feb 2026) | Subagents + remote agents | Multi-agent (experimental) |
| Sandboxing | Permission modes | YOLO / permission dialogs | macOS seatbelt / Linux Landlock |

### Installation

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code
# Requires Node.js 18+

# Gemini CLI
npm install -g @google/gemini-cli
npx @google/gemini-cli          # No install needed
# Preview version:
npm install -g @google/gemini-cli@preview

# OpenAI Codex
npm install -g @openai/codex
# Built in Rust; macOS + Linux (Windows: experimental)
```

### Authentication

| Platform | Method |
|---|---|
| Claude Code | `claude login` → Claude.ai OAuth, or `ANTHROPIC_API_KEY` env var. AWS Bedrock: `CLAUDE_CODE_USE_BEDROCK=1`. GCP Vertex: `CLAUDE_CODE_USE_VERTEX=1`. Azure: `CLAUDE_CODE_USE_FOUNDRY=1`. |
| Gemini CLI | `gemini` → Google OAuth on first run. `GOOGLE_API_KEY` env var. Workspace/enterprise accounts supported. `GOOGLE_GENAI_USE_VERTEXAI=true` for Vertex AI. |
| OpenAI Codex | `codex login` → ChatGPT OAuth (Plus/Pro/Business/Edu/Enterprise) OR `OPENAI_API_KEY` env var. Supports API key piped over stdin. |

---

## 2. Context / Memory Files

Each platform uses a markdown file as the agent's "constitution" — persistent instructions loaded at session start. All three support hierarchical loading (global → project → subdirectory).

---

### Claude Code — CLAUDE.md

CLAUDE.md is the most important file for Claude Code. Claude treats it as context, not law — it decides if rules are relevant to the current task. Anthropic recommends keeping it under 500 lines. Split domain-specific instructions into skill files for overflow.

A 2025 study found frontier LLMs reliably follow ~150–200 instructions before degradation. Claude Code's own system prompt consumes ~50 slots before CLAUDE.md is read, leaving ~100–150 effective instruction slots.

#### Loading Locations

| Location | Behavior |
|---|---|
| `~/.claude/CLAUDE.md` | Global — applies across all projects. Store personal preferences, communication style, global tools. |
| `<repo>/CLAUDE.md` | Project root — primary project context. Architecture, conventions, build commands, testing patterns. |
| `<subdir>/CLAUDE.md` | Subdirectory — overrides for specific areas (e.g. a payments service with different test commands). |
| `.claude/CLAUDE.md` | Alternate project location. Same behavior as repo root CLAUDE.md. |

#### Recommended CLAUDE.md Structure

```markdown
# Project Name

## Overview
Brief description of what this codebase does.

## Tech Stack
- Language: TypeScript / Node.js 20
- Framework: Next.js 14 (App Router)
- Database: PostgreSQL via Prisma ORM
- Testing: Vitest + Playwright

## Build & Test Commands
- `pnpm install` – install deps
- `pnpm dev` – start dev server
- `pnpm test` – run unit tests
- `pnpm lint` – run ESLint

## Architecture
- src/app/ – Next.js App Router pages & API routes
- src/lib/ – shared utilities
- src/db/ – Prisma schema and migrations

## Coding Conventions
- Always use TypeScript strict mode
- Prefer named exports over default exports
- Run `pnpm lint` before any commit

## Available Skills
- database-query: SQL, Postgres, migrations
- api-design: REST API, OpenAPI, GraphQL
- deployment: AWS, staging, production deploys
- security-review: OWASP, auth, secrets scanning

## What NOT to Do
- Never modify package-lock.json manually
- Never commit .env files
```

#### Important Notes

- Claude loads CLAUDE.md with an implicit note: "this might be relevant, or might not" — it decides.
- Irrelevant instructions waste attention slots, degrading adherence to critical rules.
- Use skills (Section 3) to offload domain-specific instructions that only apply sometimes.
- Use `/compact` if context gets too long; use PreCompact hooks to back up transcripts before compaction.
- Session data stored in `~/.claude/projects/` — scriptable for meta-analysis.

---

### Gemini CLI — GEMINI.md

Gemini CLI uses GEMINI.md files organized in a technical hierarchy. Multiple files are stacked and merged in order of scope.

#### Loading Locations

| Location | Scope | Notes |
|---|---|---|
| `~/.gemini/GEMINI.md` | User global | Personal preferences, global defaults |
| `.gemini/GEMINI.md` | Workspace (project) | Team-shared, commit to version control |
| `GEMINI.md` (repo root) | Project root | Equivalent to workspace-level |
| `<subdir>/GEMINI.md` | Directory-specific | Override for sub-projects or services |

- Use `/memory` to view the current merged context Gemini is using.
- GEMINI.md supports headings, code blocks, and any markdown formatting.
- Unlike CLAUDE.md, Gemini explicitly scans and merges all in-scope files.

---

### OpenAI Codex — AGENTS.md

Codex reads AGENTS.md files at session start, once per run. It supports layered guidance with override files at each level.

#### Loading Locations (Highest to Lowest Precedence)

| Location | Precedence | Behavior |
|---|---|---|
| `~/.codex/AGENTS.override.md` | 1 (highest global) | Temporary global override; remove to restore base |
| `~/.codex/AGENTS.md` | 2 (global) | Developer defaults (test commands, style preferences) |
| `<repo>/AGENTS.override.md` | 3 (repo override) | Team temp override without editing base file |
| `<repo>/AGENTS.md` | 4 (repo base) | Project norms, lint commands, PR process |
| `<subdir>/AGENTS.override.md` | 5 (local override) | Service/component-level overrides |
| `<subdir>/AGENTS.md` | 6 (local) | Subdir-specific rules |
| Config fallback names | — | Add to `project_doc_fallback_filenames` in config.toml |

#### Key Config Settings

```toml
# ~/.codex/config.toml
project_doc_max_bytes = 65536        # max combined size (default 32768 = 32KB)
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
```

- Files closer to your working directory appear later in combined prompt → higher effective precedence.
- Codex skips empty files and stops adding files once combined size reaches the limit.
- In GitHub PRs: `@codex` comments can be instructed to update AGENTS.md directly.

---

## 3. Skills — Format, Activation & Examples

Skills are self-contained capability modules that extend the agent with specialized knowledge and workflows. All three platforms implement the Open Agent Skills standard: a `SKILL.md` file in a skill directory.

Skills use **progressive disclosure**: only the metadata (name + description) is injected into the system prompt at session start. The full instructions are loaded on-demand when the agent determines the skill is relevant. This prevents context bloat while maintaining a large library of capabilities.

---

### Claude Code Skills

#### Discovery Locations

| Location | Scope | Notes |
|---|---|---|
| `.claude/skills/<skill-name>/` | Project-level | Committed to VCS; shared with team |
| `~/.claude/skills/<skill-name>/` | User-level | Available across all projects |
| Plugin skills | Plugin-bundled | Installed via plugin marketplace |

#### SKILL.md Frontmatter Fields

```yaml
---
name: skill-name                  # Required: unique identifier
description: >                    # Required: used for auto-activation matching
  When to activate this skill. Be specific about scope and boundaries.
  Example: 'Use when user wants to review code quality, run linting,
  or fix TypeScript errors in .ts/.tsx files.
  Do NOT use for general code writing or refactoring.'
# Optional fields:
model: sonnet                     # Override model for this skill
---

# Skill body: Full instructions in Markdown
You are a TypeScript expert. When activated:
1. Run `npx tsc --noEmit` to find type errors
2. Run `npx eslint src/` and fix all errors
3. Run `pnpm test` to verify nothing broke
4. Report a summary of all changes made
```

#### Skill Directory Structure

```
.claude/
└── skills/
    ├── code-review/
    │   ├── SKILL.md          # Instructions (required)
    │   ├── scripts/
    │   │   └── run-review.sh # Optional helper scripts
    │   └── templates/
    │       └── review.md     # Optional reference templates
    ├── database-migrations/
    │   └── SKILL.md
    └── security-audit/
        ├── SKILL.md
        └── patterns.json     # Reference data
```

#### How Claude Activates Skills

- **Automatic**: Claude scans skill descriptions at session start; activates matching skills via ToolSearch when task context aligns.
- **Explicit**: `/skills` → list and manually activate any skill. Or type the skill name in your prompt.
- **In frontmatter**: Skills can be declared in subagent/skill frontmatter for scoped activation.
- **Fork injection**: "with context: fork in a skill" injects skill content into a specified agent.

#### Skill Invocation in Subagent Frontmatter

```yaml
---
name: backend-dev
description: Backend development specialist
tools: Read, Write, Bash, Glob, Grep
skills:                           # Skills auto-loaded when this agent runs
  - code-review
  - database-migrations
model: sonnet
---
You are a backend engineer specializing in Node.js and PostgreSQL.
```

#### Key Recommendations

- Keep SKILL.md under 500 lines (official Anthropic recommendation).
- Write descriptions with clear trigger scope: what activates it AND what does NOT.
- Include `scripts/` subdirectory for deterministic helper scripts Claude can call.
- Add a list of your skill names in CLAUDE.md as a hint — auto-detection can miss skills sometimes.
- Skills are loaded on-demand — domain expertise without bloating the system prompt.

---

### Gemini CLI Skills

Gemini CLI implements the Open Agent Skills standard. Skills are discovered at session start, and Gemini autonomously decides when to activate them using the `activate_skill` tool. A consent/confirmation prompt appears before a skill is loaded.

#### Discovery Locations

| Location | Alias | Scope |
|---|---|---|
| `.gemini/skills/<n>/` | `.agents/skills/<n>/` | Workspace (project, VCS) |
| `~/.gemini/skills/<n>/` | `~/.agents/skills/<n>/` | User (all workspaces) |
| Extension skills | — | Bundled in installed extensions |

#### SKILL.md Format (Open Agent Skills Standard)

```yaml
---
name: security-auditor
description: >
  Use this skill when performing security audits, checking for vulnerabilities,
  reviewing authentication code, or scanning for hardcoded secrets.
  Do NOT use for general code review or refactoring.
---

# Security Auditor Skill

You are a ruthless security auditor. When activated:

## Checklist
1. Scan all files for hardcoded secrets (API keys, passwords, tokens)
2. Check authentication flows for common vulnerabilities
3. Review SQL queries for injection risks
4. Check for path traversal vulnerabilities
5. Verify all user inputs are sanitized

## Output Format
Report each finding with: severity (CRITICAL/HIGH/MEDIUM/LOW), file + line, description, fix.
```

#### Skill Management Commands

```bash
/skills list
/skills enable security-auditor
/skills disable security-auditor
/skills enable --scope workspace security-auditor
@security-auditor <task>          # Explicitly invoke a skill/subagent
```

#### Installing Community Skills (e.g. Firebase)

```bash
npx @firebase/agent-skills install
# Installs: firebase-basics, firebase-auth, firebase-firestore, firebase-app-hosting

# After install, use in Gemini CLI:
gemini
/firebase-app-hosting deploy my app to Firebase App Hosting
```

---

### OpenAI Codex Skills

Codex follows the Open Agent Skills standard. Skills are available in the CLI, IDE extension, and Codex web app. Skills support an additional `agents/openai.yaml` metadata file for UI configuration and invocation policy.

#### Discovery Locations

| Location | Scope | Notes |
|---|---|---|
| `.agents/skills/<n>/` (from CWD up to repo root) | Repository | Scanned recursively upward |
| `~/.agents/skills/<n>/` | User | Personal skills across all repos |
| `/etc/codex/skills/` or admin path | Admin / System | Org-enforced skills |

#### SKILL.md Format

```yaml
---
name: commit                       # Required
description: >                     # Required: controls implicit activation
  Stage and commit changes in semantic groups.
  Use when the user wants to commit, organize commits,
  or clean up a branch before pushing.
  Do NOT use for general code writing or file editing.
---

# Commit Skill

## Workflow
1. Run `git status` to see all changed files
2. Group changes by logical feature/fix/refactor
3. Stage each group: `git add <files>`
4. Write conventional commit message: `<type>(<scope>): <subject>`
5. Commit: `git commit -m "<message>"`
6. Repeat for each logical group
7. Show final `git log --oneline -5` summary

## Commit Types
feat, fix, docs, style, refactor, test, chore, perf
```

#### Optional agents/openai.yaml Metadata

```yaml
# .agents/skills/commit/agents/openai.yaml
invocation_policy: implicit        # auto | implicit | explicit
tool_dependencies:                 # Required MCP servers
  - github
ui_metadata:
  icon: git-commit
  label: Smart Commit
  description: Organize and commit your changes semantically
```

#### Skill Invocation

```bash
/skills                            # Open skill selector
$ commit my changes                # Use $ to mention a skill explicitly

# Implicit: Codex chooses when task matches description
"Please commit these changes"      # Codex auto-activates 'commit' skill

# Install additional skills
$skill-installer                   # Built-in skill installer
$skill-installer install $linear   # Install Linear integration skill
```

```toml
# Disable a skill without deleting (config.toml)
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

---

## 4. Custom Subagents

Subagents are specialized AI instances that operate within the main agent session, each with their own context window, system prompt, tool access, model, and permissions. They solve the context pollution problem by isolating heavy work (deep code exploration, documentation lookup, security audits) so the main session stays clean.

All three platforms define subagents as Markdown files with YAML frontmatter.

---

### Claude Code Subagents

#### File Locations

- `.claude/agents/<n>.md` — Project-level agents (shared with team, commit to VCS)
- `~/.claude/agents/<n>.md` — User-level agents (available in all projects)
- Plugin agents — bundled with installed plugins, namespaced automatically

#### Complete YAML Frontmatter Fields

```yaml
---
name: code-reviewer              # Required: agent identifier
description: >                   # Required: when Claude auto-delegates to this agent
  Expert code reviewer. Use proactively after any code changes.
  Focuses on quality, security, performance, and best practices.

# Tool access
tools: Read, Glob, Grep, Bash, Write, Edit, WebSearch, WebFetch
disallowedTools: Bash            # Blacklist specific tools

# Model selection
model: sonnet                    # sonnet | opus | haiku | claude-opus-4-6 etc.

# Permission mode
permissionMode: default          # default | acceptEdits | bypassPermissions | plan

# Memory: persist knowledge across conversations
memory: user                     # user | project (scope for memory directory)

# MCP servers available to this agent
mcpServers:
  - github
  - linear

# Hooks scoped to this agent
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-bash.sh"

# Conversation limit
maxTurns: 20

# Skills to auto-load
skills:
  - code-review
  - security-audit
---

You are a senior code reviewer with 15 years of experience...
```

#### Creating Subagents

```bash
# Interactive creation
/agents                          # Open agents manager
# -> 'Create new agent'
# -> Choose User-level or Project-level
# -> 'Generate with Claude' OR manual configuration

# CLI flag (inline, no file needed)
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

#### Invoking Subagents

```bash
# Natural language delegation (Claude decides)
"Review the changes I just made"

# Explicit invocation by name
"@code-reviewer review the auth module"

# Background execution (Ctrl+B to send to background)
"@explorer map the entire codebase architecture"  # then Ctrl+B

# Via Task tool in slash commands / skills
Task("Run the test suite and report failures", subagent_type="code-reviewer")
```

#### Memory System

When `memory` is set, the subagent gets a persistent directory that survives across conversations. The first 200 lines of `MEMORY.md` are injected into the subagent's context each session. The agent is instructed to curate `MEMORY.md` if it grows beyond 200 lines.

```yaml
---
name: codebase-expert
description: Deep codebase knowledge expert
memory: project                  # Shared across team (project scope)
---

You are a codebase expert. As you explore, update your memory with:
- Key architectural patterns you discover
- Non-obvious dependencies between modules
- Known bugs or tech debt locations
- Performance bottlenecks and their causes

Update MEMORY.md with concise notes. This builds institutional knowledge.
```

---

### Gemini CLI Subagents

Gemini CLI subagents are "specialists" the main agent can hire for specific jobs. Currently experimental — requires opt-in in settings.json.

> **Warning**: Subagents currently operate in YOLO mode — they may execute tools without individual user confirmation. Use caution with powerful tools like `run_shell_command`.

#### File Locations

- `.gemini/agents/<n>.md` — Project/workspace-level
- `~/.gemini/agents/<n>.md` — User-level

#### Enable Subagents

```json
// .gemini/settings.json
{
  "experimental": {
    "subAgents": true
  }
}
```

#### YAML Frontmatter Fields

```yaml
---
name: security_auditor           # Exposed as tool name to main agent
description: >                   # Used for auto-delegation routing
  Expert security auditor. Use when scanning for vulnerabilities,
  reviewing authentication, or checking for exposed secrets.
tools:                           # Tool access
  - read_file
  - search_file_content
  - list_directory
  - google_web_search
  # Wildcards supported:
  # - '*'     -> all tools
  # - 'mcp_*' -> all MCP tools
model: gemini-3.1-pro-preview    # Optional model override
---

You are a ruthless Security Auditor. Your job is to analyze code for potential
vulnerabilities. When you find one, explain it clearly and suggest a fix.
```

#### Invoking Gemini Subagents

```bash
# Automatic delegation (main agent decides)
"Check this code for security issues"  # routes to security_auditor

# Explicit @ syntax
@security_auditor analyze the auth module for vulnerabilities
```

#### Built-in Gemini Subagents

| Agent | Purpose | Auto-invoked? |
|---|---|---|
| `codebase_investigator` | Deep codebase analysis and exploration | Yes |
| `browser_agent` | Web browser automation, form filling, web scraping | When needed |
| `docs_agent` | Gemini CLI documentation lookup, command reference | Yes |
| `router_agent` | Routes tasks to appropriate specialized subagents | Internally |
| `generalist_agent` | General-purpose delegation and routing | Yes (v0.30+) |

---

### OpenAI Codex Subagents

Codex multi-agent support is experimental and requires explicit enabling. Agent roles are defined in `config.toml`, not as individual markdown files.

#### Enable Multi-Agent

```bash
# Via CLI
codex -> /experimental -> Enable Multi-agents -> restart Codex

# Via config.toml
[features]
multi_agent = true

# Via CLI flag
codex --enable multi_agent
```

#### Define Agent Roles in config.toml

```toml
[agents]
max_threads = 6                  # Max parallel agent threads
max_depth = 1                    # Max agent spawning depth

[agents.explorer]
description = "Read-only codebase explorer for gathering evidence."
config_file = "agents/explorer.toml"

[agents.reviewer]
description = "PR reviewer focused on correctness, security, and missing tests."
config_file = "agents/reviewer.toml"

[agents.docs_researcher]
description = "Documentation specialist that verifies APIs and framework behavior."
config_file = "agents/docs-researcher.toml"
```

#### Role-Specific Config File (e.g. agents/explorer.toml)

```toml
model = "gpt-5.3-codex-spark"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"       # Restrict to read-only for safety
developer_instructions = """
Stay in exploration mode. Trace real execution paths, cite files and
symbols, avoid proposing fixes unless parent agent asks.
Prefer fast search and targeted file reads over broad scans.
"""
```

#### Notes

- Subagents inherit parent turn's sandbox/approval overrides.
- Parent agent handles orchestration: spawning, routing, waiting for results, consolidating.
- Built-in `monitor` role for long-running polling workflows.

---

## 5. Hooks — All Lifecycle Events

Hooks are deterministic automation scripts that execute at specific lifecycle points in the agent loop. Unlike prompts (which Claude may or may not follow), **hooks are guaranteed to run**.

They receive event data as JSON on stdin, and return decisions/feedback as JSON on stdout.

- **Claude Code**: 14 events, 4 handler types — most mature hook system
- **Gemini CLI**: 10+ events with similar JSON contract
- **OpenAI Codex**: current official CLI docs do not document a first-class hook system comparable to Claude or Gemini

---

### Claude Code Hooks

#### Configuration File Locations

- `~/.claude/settings.json` — User-level (applies to all projects)
- `.claude/settings.json` — Project-level
- `.claude/settings.local.json` — Local project override (not committed)
- Enterprise policy settings — Admin-enforced
- Agent/skill frontmatter — Scoped to specific agent or skill

#### All 14 Lifecycle Events

| Event | When It Fires | Can Block? | Key Use Cases |
|---|---|---|---|
| `UserPromptSubmit` | When user submits a prompt, before Claude processes it | Yes (block) | Prompt validation, context injection, rate limiting |
| `PreToolUse` | After Claude creates tool params, before tool executes | Yes (deny/allow/ask) | Security checks, dangerous command blocking, input rewriting |
| `PermissionRequest` | When a permission dialog is about to be shown | Yes (allow/deny) | Auto-approve safe ops, auto-deny dangerous paths |
| `PostToolUse` | After tool completes successfully | Yes (block further) | Auto-format code, run tests, log operations |
| `PostToolUseFailure` | After a tool call fails with an error | Yes (block) | Error handling, retry logic, failure logging |
| `SubagentStart` | When a subagent (Task tool) spawns | No | DB setup, env prep for specific agents, logging |
| `SubagentStop` | When a subagent completes | Yes (block) | Validate subagent output, aggregate results |
| `Stop` | When main agent finishes responding | Yes (force continue) | Validate task completion, enforce quality gates |
| `Notification` | When Claude sends notifications | No (async) | Desktop notifications, Slack alerts, TTS |
| `PreCompact` | Before conversation compaction | No | Backup transcripts, analyze conversation history |
| `SessionStart` | On session startup/resume/clear/compact | No | Load env vars, inject project context, initialize |
| `SessionEnd` | When session exits (exit/sigint/error) | No | Cleanup, persist session data, final logging |
| `Setup` | On repo init or periodic maintenance | No | Environment validation, context injection |
| `TeammateIdle` / `TaskCompleted` | Agent Teams events (Feb 2026) | — | Agent team coordination and monitoring |

#### Handler Types (4 Types)

| Type | JSON Format | Best For |
|---|---|---|
| `command` | `{"type": "command", "command": "script.sh", "timeout": 30, "async": false}` | Shell scripts, formatters, linters, external tools |
| `prompt` | `{"type": "prompt", "prompt": "Evaluate if this tool use is safe...", "timeout": 30}` | LLM-based semantic evaluation, context-dependent decisions |
| `agent` | `{"type": "agent", "prompt": "Deep analysis...", "tools": ["Read", "Grep"]}` | Complex verification requiring tool access (codebase analysis) |
| `http` | `{"type": "http", "url": "http://localhost:8080/hooks", "timeout": 30, "headers": {...}}` | Webhook integrations, external services, monitoring systems |

#### Exit Codes & JSON Response Format

```bash
# Exit code 0: Success — stdout parsed as JSON for structured control
# Exit code 2: Block the action — stderr sent to Claude as error message

# PreToolUse response
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",     # allow | deny | ask
    "permissionDecisionReason": "Explanation for Claude",
    "updatedInput": {"command": "modified-command"},  # rewrite tool input
    "additionalContext": "Context injected into conversation"
  },
  "systemMessage": "Message shown to user/Claude"
}

# PostToolUse / Stop: block response
{ "decision": "block", "reason": "Tests are failing. Fix before completing." }

# Allow (omit decision, or exit 0 with no JSON)
{}
```

#### settings.json Hook Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate-bash.sh",
            "timeout": 10
          },
          {
            "type": "prompt",
            "prompt": "Is this bash command safe to run?"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/block-sensitive.py" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          { "type": "command", "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\"" },
          { "type": "command", "command": "npx eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\"" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Verify all tasks complete: tests run, build passing, no TODOs left."
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/setup-env.sh"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python .claude/hooks/backup-transcript.py",
            "async": true
          }
        ]
      }
    ]
  }
}
```

#### Hook Script Example — Security Gate (Python)

```python
#!/usr/bin/env python3
# .claude/hooks/block-sensitive.py
import json, sys, re

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")
content = data.get("tool_input", {}).get("content", "")

BLOCKED_PATHS = [".env", "package-lock.json", ".git/", "secrets/"]
SECRET_PATTERNS = [r"api[_-]?key", r"password", r"AKIA[0-9A-Z]{16}"]

# Block writes to sensitive paths
if any(x in file_path for x in BLOCKED_PATHS):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": f"Writing to {file_path} is not allowed"
        }
    }))
    sys.exit(0)

# Block secret exposure
for pattern in SECRET_PATTERNS:
    if re.search(pattern, content, re.IGNORECASE):
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Potential secret detected in content"
            }
        }))
        sys.exit(0)

# Allow
print("{}")
```

---

### Gemini CLI Hooks

Hooks introduced in v0.26.0 (enabled by default). Follow similar JSON-over-stdin contract to Claude Code hooks. Configuration lives in `settings.json`. Supports command hooks (shell scripts) and plugin hooks (npm packages tagged with `geminicli-plugin`).

#### All Hook Event Types

| Event | When It Fires | Matcher Type |
|---|---|---|
| `BeforeTool` | Before a tool is invoked; can validate, modify, or deny | Regex on tool name |
| `AfterTool` | After tool execution completes | Regex on tool name |
| `BeforeAgent` | Before agent loop starts for a turn | Lifecycle (exact string) |
| `AfterAgent` | After agent finishes its final response for a turn | `*` only currently |
| `BeforeModel` | Before LLM request is sent; can modify prompt or inject context | Lifecycle |
| `AfterModel` | After LLM response received; PII filtering, monitoring | Lifecycle |
| `BeforeToolSelection` | Before tool planning; can filter/prioritize available tools | Lifecycle |
| `Notification` | On errors, warnings, info events | Lifecycle (exact string) |
| `SessionStart` | On session startup | Lifecycle |
| `SessionEnd` | On session close; cleanup, persist data | Lifecycle |
| `PreCompress` | Before context compression/compaction | Lifecycle |

#### Gemini Hooks Configuration

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "secret-scanner",
            "type": "command",
            "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/block-secrets.sh",
            "description": "Prevent committing secrets to files"
          }
        ]
      }
    ],
    "AfterAgent": [
      {
        "matcher": "*",
        "hooks": [
          {
            "name": "build-check",
            "type": "command",
            "command": ".gemini/hooks/verify-build.sh",
            "description": "Verify build passes after each turn"
          }
        ]
      }
    ],
    "AfterTool": [
      {
        "matcher": "write_.*",
        "hooks": [
          {
            "name": "auto-format",
            "type": "command",
            "command": ".gemini/hooks/format-file.sh"
          }
        ]
      }
    ]
  }
}
```

#### Gemini Hook Response Format

```bash
# Allow
echo '{"decision": "allow"}'

# Deny (BeforeTool)
echo '{"decision": "deny", "reason": "Security Policy: Potential secret detected.", "systemMessage": "Security scanner blocked operation"}'

# Retry (AfterAgent)
echo '{"decision": "retry", "reason": "Build failed. Fix errors and try again."}'

# Kill agent loop
echo '{"continue": false}'
```

#### Hook Environment Variables

```bash
GEMINI_PROJECT_DIR   # Absolute path to project root
GEMINI_SESSION_ID    # Unique ID for current session
GEMINI_CWD           # Current working directory
```

#### Matcher Rules

- `BeforeTool` / `AfterTool`: matchers are **Regular Expressions** (e.g. `write_.*` matches all write tools)
- Lifecycle events (`BeforeAgent`, `AfterAgent`, etc.): matchers are **Exact Strings**
- `*` or empty string matches all occurrences of that event type

#### Hook Precedence (Highest to Lowest)

1. Project settings: `.gemini/settings.json`
2. User settings: `~/.gemini/settings.json`
3. Extension-defined hooks

#### The Ralph Loop Pattern

By using an `AfterAgent` hook that returns `{"decision": "retry"}`, you can create a self-correcting loop where the agent automatically retries difficult tasks, refreshing its context each attempt to prevent context rot. The Ralph extension implements this pattern and is available in the Gemini CLI extensions marketplace.

---

### OpenAI Codex Hooks

Current official Codex CLI docs do not document a first-class hooks system comparable to Claude Code or Gemini CLI. Treat `AGENTS.md`, MCP servers, shell wrappers, CI, and traditional git hooks as the reliable automation surfaces unless OpenAI publishes dedicated hook documentation.

```bash
# Traditional pre-commit hooks remain a practical Codex companion
# .git/hooks/pre-commit:
#!/bin/sh
npm run lint && npm test
```

- Traditional pre-commit hooks and linters are recommended alongside Codex.
- AGENTS.md rules + linters remain the main guardrail pattern.
- For hook-like orchestration, prefer external automation or `exec`-style wrapper pipelines.

---

## 6. Slash Commands & Custom Commands

Slash commands are user-triggered shortcuts stored as markdown files. Unlike skills (which activate automatically), commands are always **explicitly invoked**. They support dynamic arguments, can spawn subagents, and can chain workflows.

---

### Claude Code Slash Commands

#### File Locations

- `.claude/commands/<n>.md` — Project-level commands
- `~/.claude/commands/<n>.md` — User-level commands

#### Command File Format

```markdown
---
description: Research a problem using web search and codebase exploration
allowed-tools: Task, WebSearch, WebFetch, Grep, Glob, Read, Write, Bash
---

# Research: $ARGUMENTS

Research the following: **$ARGUMENTS**

## Instructions
Launch multiple subagents in parallel to gather information:

1. **Web Documentation Agent**
   - Search official documentation for the topic
   - Find best practices and recommended patterns

2. **Stack Overflow Agent**
   - Search for similar problems and solutions
   - Note common pitfalls and gotchas

3. **Codebase Context Agent**
   - Grep the codebase for relevant existing patterns
   - Find similar implementations already in the project

## Output
Synthesize findings and provide a recommendation for implementation.
```

#### Built-in Commands

```
/research <topic>      # Parallel research workflow (custom)
/agents                # Open agents manager
/skills                # List and manage skills
/hooks                 # Open hooks configuration UI
/compact               # Compact context window
/model                 # Switch model mid-session
/effort                # Set model effort level (low/medium/high)
/plan <description>    # Enter plan mode
/review                # Open code review presets
/copy                  # Copy latest output
```

---

### Gemini CLI Commands

#### File Location

- `.gemini/commands/<n>.md` or `~/.gemini/commands/<n>.md`

#### Built-in Commands

```
/help                  # Show available commands
/chat                  # Start new conversation
/memory                # View current memory context
/skills list|enable|disable
/tools                 # List available tools
/hooks                 # Show hooks status
/agents <task>         # Route task to subagent
/extensions            # Manage installed extensions
/theme                 # Change UI theme
/quit                  # Exit
/bug                   # Report bug directly from CLI
/rewind                # Rewind and replay session
/logout                # Clear credentials and reset auth
```

---

### OpenAI Codex Slash Commands

```
/skills                # Open skill selector
/review                # Code review presets (current branch, uncommitted changes, commit)
/model                 # Switch model mid-session
/theme                 # Open theme picker
/clear                 # Wipe terminal and start fresh chat
/copy                  # Copy latest completed output
/exit                  # Close interactive session
/fast                  # Toggle fast mode
/experimental          # Toggle experimental features
/agent                 # Enable/configure agent settings
/approvals             # Change approval policy mid-session
/feedback              # Submit feedback
/status                # Show current agent status
```

#### Composer Shortcuts

```
@<filename>            # Fuzzy file search and insert path (Tab to confirm)
!<shell command>       # Run local shell command inline
$<skill name>          # Mention/invoke a skill explicitly
Enter                  # Inject instructions into current running turn
Tab                    # Queue follow-up prompt for next turn
Ctrl+C                 # Cancel / close session
Up/Down                # Navigate draft history
```

---

## 7. MCP (Model Context Protocol) Integration

MCP is the standard way to connect AI coding agents to external tools and data sources. One MCP server can expose tools from GitHub, Linear, Jira, Figma, databases, or any other system.

All three platforms support MCP as a client. Claude Code and OpenAI Codex can also run as MCP servers themselves.

### Feature Comparison

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| MCP Client | Yes (full) | Yes (full) | Yes (full) |
| MCP Server | Yes (`claude mcp-server`) | No | Yes (`codex mcp-server`) |
| Config location | `~/.claude/settings.json` mcpServers | `~/.gemini/settings.json` mcpServers | `~/.codex/config.toml` [mcp_servers] |
| Transport types | stdio, HTTP/SSE | stdio, HTTP/SSE | stdio, streamable HTTP |
| OAuth support | Yes | Yes | Yes (`codex mcp auth`) |
| Auto-launch | Yes (on session start) | Yes | Yes |
| Per-agent MCP | Yes (mcpServers in frontmatter) | Yes (tools: mcp_*) | Yes (per-role config) |
| Namespacing | `mcp__<server>__<tool>` | `mcp_<server>_<tool>` | `mcp__<server>__<tool>` |

### Claude Code MCP Configuration

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" }
    },
    "linear": {
      "command": "npx",
      "args": ["-y", "@linear/mcp-server"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

### Gemini CLI MCP Configuration

```json
// ~/.gemini/settings.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "your-token" }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": { "SLACK_BOT_TOKEN": "$SLACK_BOT_TOKEN" }
    }
  }
}
```

### OpenAI Codex MCP Configuration

```toml
# ~/.codex/config.toml

[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = ["GITHUB_TOKEN"]

[mcp_servers.linear]
command = "npx"
args = ["-y", "@linear/mcp-server"]

# Streamable HTTP server
[mcp_servers.my_api]
url = "https://my-mcp-server.example.com/mcp"
env_bearer_token = "MY_API_KEY"

# CLI management
# codex mcp add github npx -y @modelcontextprotocol/server-github
# codex mcp list
# codex mcp remove github
```

### Running Claude Code as an MCP Server

```bash
# Expose Claude Code as MCP server (stdio)
claude mcp-server

# Used in OpenAI Agents SDK:
async with MCPServerStdio(
    name="Claude Code",
    params={"command": "claude", "args": ["mcp-server"]},
) as cc_mcp:
    # cc_mcp exposes: claude() and claude-reply() tools
```

### Running OpenAI Codex as an MCP Server

```bash
codex mcp-server                 # Start Codex as stdio MCP server

# Tools exposed:
# codex(config, prompt)         -> starts a Codex conversation
# codex-reply(threadId, prompt) -> continues a Codex conversation
```

```python
async with MCPServerStdio(
    name="Codex CLI",
    params={"command": "npx", "args": ["-y", "codex", "mcp-server"]},
    client_session_timeout_seconds=360000,
) as codex_mcp:
    # Expose to your AI agents
```

---

## 8. Plugins & Extensions

Plugins/Extensions are distributable packages that bundle multiple components (skills, subagents, slash commands, hooks, MCP servers) into a single installable unit with namespace isolation.

---

### Claude Code Plugins

A plugin packages: skills + subagents + slash commands + hooks + MCP servers.

```bash
# Install a plugin
/plugins install <marketplace-id>
```

```
# Plugin directory structure:
my-plugin/
├── plugin.json          # Plugin metadata
├── skills/
│   └── code-review/
│       └── SKILL.md
├── agents/
│   └── reviewer.md
├── commands/
│   └── review.md
└── hooks/
    └── post-commit.sh

# Namespaced commands (avoids conflicts):
/my-plugin:review
/my-plugin:deploy
```

- Plugin hooks merge with user hooks and run in parallel.
- Commands appear in `/...` autocomplete with plugin namespace.
- Skills from plugins auto-activate like regular skills.
- Anthropic hosts an official plugin marketplace; community plugins also available.

---

### Gemini CLI Extensions

Extensions bundle: tools (MCP) + custom commands + hooks + scoped tool permissions.

```bash
/extensions list                   # List installed extensions
/extensions install <id>           # Install from registry
/extensions update                 # Update all extensions

# Or via CLI:
gemini extensions install <id>
```

```
# Extension directory structure:
my-extension/
├── extension.json        # Metadata, system prompt additions
├── tools/                # Custom tool definitions
├── commands/             # Custom slash commands
└── hooks/                # Hook scripts
```

- Extensions can create distinct AI personas (e.g. "Secure Code Reviewer" with read-only tools).
- The Ralph extension uses `AfterAgent` hooks for the persistent loop pattern.
- Extensions are namespaced: `/my-extension:command`.
- Launched with partner extensions (Firebase, GitHub, etc.) in Sep 2025.

---

### OpenAI Codex Plugin System

Codex plugin system (added Feb 2026) loads skills, MCP entries, and app connectors.

```toml
# config.toml
[plugins]
# Plugins can add: skills, MCP servers, app connectors

# Team config: shared defaults in .codex/
# .codex/
# ├── config.toml           # Shared team defaults
# ├── AGENTS.md             # Team-wide instructions
# ├── skills/               # Shared skills
# │   └── commit/
# │       └── SKILL.md
# └── requirements.toml     # Admin-enforced constraints
```

---

## 9. Multi-Agent & Agent Teams

### Claude Code Agent Teams (Feb 2026)

Agent Teams is the newest Claude Code feature (launched Feb 5, 2026 with Opus 4.6). Unlike subagents (isolated workers reporting to a boss), Agent Teams are a **collaborative squad**: one Claude is the lead, others are teammates who can talk to each other directly, self-assign tasks from a shared list, and challenge each other's findings.

```bash
# Enable Agent Teams
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
# or set in .claude/settings.json

# Example team workflow:
/plan_w_team
# -> Create a plan with team orchestration
# -> Specify: 'one builder and one validator for each task group'
# -> Plan generated with: team members, step-by-step tasks, dependencies

/build
# -> Builders implement features
# -> Validators verify completion
# -> Task system coordinates everything

# Team hooks for observability:
# TeammateIdle    - when a team member is waiting
# TaskCompleted   - when a task is marked done
```

#### Master-Clone Architecture

Instead of defining fixed specialist subagents, put all context in CLAUDE.md and let the main agent use the built-in `Task(...)` feature to spawn clones of itself. This gives context-saving benefits without forcing rigid human-defined workflows. The agent manages its own orchestration dynamically.

---

### OpenAI Codex Multi-Agent (SDK Pattern)

The most powerful multi-agent pattern for Codex uses the Agents SDK + Codex as MCP server. This creates a deterministic, traceable pipeline.

```python
import asyncio
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

async def main():
    async with MCPServerStdio(
        name="Codex CLI",
        params={"command": "npx", "args": ["-y", "codex", "mcp-server"]},
        client_session_timeout_seconds=360000,
    ) as codex_mcp:

        developer = Agent(
            name="Developer",
            instructions="You implement features. Use codex MCP with "
                         '{"approval-policy": "never", "sandbox": "workspace-write"}',
            mcp_servers=[codex_mcp],
            handoffs=[project_manager]
        )

        reviewer = Agent(
            name="Reviewer",
            instructions='Review code quality. Use codex MCP with {"sandbox": "read-only"}',
            mcp_servers=[codex_mcp],
            handoffs=[project_manager]
        )

        project_manager = Agent(
            name="Project Manager",
            instructions="Coordinate the team. Verify deliverables before passing to next agent.",
            handoffs=[developer, reviewer]
        )

        await Runner.run(project_manager, "Build a REST API for user auth")

asyncio.run(main())
```

---

### Gemini CLI Multi-Agent (Extension Pattern)

Gemini CLI multi-agent workflows are achieved by building custom extensions that launch independent Gemini CLI instances with `--yolo` and specific extension scopes. Task files on disk serve as the coordination mechanism (filesystem-as-state pattern). Official background agents feature is in development.

```bash
# Pattern: Extension-based agent spawning
# When /agents:run is called, the prompt instructs the core AI to:
# 1. Build a shell command launching a new gemini-cli instance
# 2. Load it with only the specific agent's extension
# 3. Run in --yolo mode for auto-approved tool calls
# 4. Use task files on disk for state coordination

/agents:run coder-agent "Implement the authentication module"

# Under the hood:
gemini -e coder-agent --yolo -p "task.md content here"
```

---

## 10. Configuration Files Reference

### Claude Code — settings.json

```json
// ~/.claude/settings.json (or .claude/settings.json for project)
{
  "model": "claude-opus-4-6",
  "smallFastModel": "claude-haiku-4-5-20251001",

  "mcpServers": {
    "github": { "command": "npx", "args": ["..."] }
  },

  "hooks": { },

  "defaultPermissionMode": "default",

  "feedbackSurveyRate": 0.1,

  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
}
```

---

### Gemini CLI — settings.json

```json
// ~/.gemini/settings.json (or .gemini/settings.json for project)
{
  "model": "gemini-3.1-pro-preview",
  "temperature": 0.7,
  "thinkingBudget": 8192,

  "experimental": { "subAgents": true },

  "agentSkills": { "enabled": true },

  "hooks": { },

  "mcpServers": { },

  "extensions": { "enabled": true },

  "allowYolo": false,

  "theme": "dark",
  "showStatusInTitle": true,

  "tokenCaching": { "enabled": true },

  "telemetry": { "logPrompts": false }
}
```

---

### OpenAI Codex — config.toml

```toml
# ~/.codex/config.toml

# Model
model = "gpt-5.4"
model_reasoning_effort = "medium"   # low | medium | high

# Approval & Sandbox
approval_policy = "on-request"      # untrusted | on-request | never
sandbox_mode = "workspace-write"    # read-only | workspace-write | danger-full-access

# Web search
web_search = "cached"               # cached | live | disabled

# Features
[features]
multi_agent = false
shell_snapshot = true
sqlite = true
fast_mode = true

# MCP servers
[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = ["GITHUB_TOKEN"]

# Agent roles
[agents]
max_threads = 4
[agents.explorer]
description = "Read-only explorer"
config_file = "agents/explorer.toml"

# Profiles
[profiles.deep-review]
model = "gpt-5.4"
model_reasoning_effort = "high"
approval_policy = "never"

# Custom shell environment
[shell_environment_policy]
inherit = "core"
exclude = ["AWS_*", "AZURE_*"]

# Notifications
notify = ["notify-send", "Codex"]

# AGENTS.md settings
project_doc_max_bytes = 65536
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
```

---

## 11. Complete Feature Comparison Matrix

### Skills

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| File name | SKILL.md | SKILL.md | SKILL.md |
| Project location | `.claude/skills/<n>/` | `.gemini/skills/<n>/` | `.agents/skills/<n>/` |
| User location | `~/.claude/skills/<n>/` | `~/.gemini/skills/<n>/` | `~/.agents/skills/<n>/` |
| Required frontmatter | name, description | name, description | name, description |
| Extra metadata | model field | — | `agents/openai.yaml` (invocation_policy, tool_dependencies) |
| Activation trigger | `/skills`, `@`, ToolSearch, auto | activate_skill tool (with consent), `/skills`, `@` | `/skills`, `$`, auto (implicit matching) |
| Max recommended size | 500 lines | Not specified | Not specified |
| Scripts directory | Yes (`scripts/`) | Yes (any files) | Yes (`scripts/`) |

### Subagents

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| File format | `<n>.md` with YAML frontmatter | `<n>.md` with YAML frontmatter | Roles in `config.toml` |
| Project location | `.claude/agents/` | `.gemini/agents/` | `[agents.*]` in config.toml |
| Required frontmatter | name, description | name, description | description (in config.toml) |
| Tool restriction | `tools:` / `disallowedTools:` | `tools:` (with wildcards `*`, `mcp_*`) | Via role-specific config file |
| Model override | `model: sonnet/opus/haiku` | `model: <model-id>` | `model` in role config file |
| Memory system | Yes (`memory: user/project`) | No built-in | No built-in |
| Permission mode | `permissionMode: default/acceptEdits/bypassPermissions/plan` | YOLO (implicit) | `sandbox_mode` in role config |
| Background execution | Ctrl+B | Not documented | Runs in background |
| Max turns | `maxTurns: N` | Not specified | Not specified |

### Hooks

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| Config file | `settings.json` | `settings.json` | Not officially documented |
| Event count | 14 events | 10+ events | — |
| Handler types | command, prompt, agent, http | command, plugin hook (npm) | — |
| Blocking support | Yes (PreToolUse, Stop, etc.) | Yes (BeforeTool, AfterAgent retry) | Use external wrappers / CI instead |
| Input/output | JSON via stdin → JSON or exit code | JSON via stdin → JSON or exit code | — |
| Async hooks | Yes (`async: true`) | Not documented | — |
| Matcher syntax | Regex (tool name) | Regex (tools) / Exact (lifecycle) | — |

### Commands

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| Custom command files | `.claude/commands/*.md` | `.gemini/commands/*.toml` | Built-in only |
| Arguments | `$ARGUMENTS` variable | `{{args}}` placeholders | `$skill` for skills |
| Chaining | Yes (invoke subagents, skills) | Yes | Yes |

### MCP

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| As MCP server | Yes (`claude mcp-server`) | No | Yes (`codex mcp-server`) |
| Config | `mcpServers` in settings.json | `mcpServers` in settings.json | `[mcp_servers.*]` in config.toml |
| CLI management | Limited | Limited | `codex mcp add/list/remove` |

### Context Files

| Feature | Claude Code | Gemini CLI | OpenAI Codex |
|---|---|---|---|
| Main file | `CLAUDE.md` | `GEMINI.md` | `AGENTS.md` |
| Global location | `~/.claude/CLAUDE.md` | `~/.gemini/GEMINI.md` | `~/.codex/AGENTS.md` |
| Override support | No explicit override system | File merging by scope | `AGENTS.override.md` at each level |
| Max size | ~500 lines recommended | Not specified | 32KB default (configurable) |
| Fallback filenames | `CLAUDE.md` only | `GEMINI.md` only | Configurable via `project_doc_fallback_filenames` |

---

## 12. Workflow Patterns & Recipes

### Pattern 1: Auto-Formatting & Linting Pipeline

Run formatters automatically every time a file is written, without manual invocation.

```json
// .claude/settings.json — Claude Code
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        { "type": "command", "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\"" },
        { "type": "command", "command": "npx eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\"" }
      ]
    }]
  }
}
```

For Gemini CLI, use `AfterTool` with matcher `write_.*`:

```json
{
  "hooks": {
    "AfterTool": [{
      "matcher": "write_.*",
      "hooks": [{ "name": "auto-format", "type": "command", "command": ".gemini/hooks/format-file.sh" }]
    }]
  }
}
```

---

### Pattern 2: Quality Gate — Force Tests Before Completion

Use Stop hooks to prevent Claude from marking a task complete until tests pass.

```bash
# .claude/hooks/validate-complete.sh
#!/bin/bash
RESULT=$(npm test 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "{\"decision\": \"block\", \"reason\": \"Tests are failing. Fix before completing:\n$RESULT\"}"
  exit 0
fi

echo "{}"
```

```json
// settings.json
{
  "hooks": {
    "Stop": [{
      "hooks": [{ "type": "command", "command": ".claude/hooks/validate-complete.sh" }]
    }]
  }
}
```

---

### Pattern 3: Parallel Research Workflow

Launch multiple subagents simultaneously to research different sources in parallel.

```markdown
# .claude/commands/deep-research.md
---
allowed-tools: Task, WebSearch, WebFetch, Grep, Glob, Read
---

Research: $ARGUMENTS

Launch these agents IN PARALLEL in a single message:
1. Task("Search official docs for: $ARGUMENTS")
2. Task("Search GitHub issues and Stack Overflow for: $ARGUMENTS")
3. Task("Search the codebase for existing patterns related to: $ARGUMENTS")

Then synthesize all findings into a comprehensive recommendation.
```

---

### Pattern 4: Security-First Development — Block Secrets in Files

```python
#!/usr/bin/env python3
# hooks/block-secrets.py — works for Claude Code (PreToolUse) and Gemini CLI (BeforeTool)
import json, sys, re

data = json.load(sys.stdin)
content = (data.get("tool_input", {}).get("content", "")
           or data.get("tool_input", {}).get("new_string", ""))

PATTERNS = [
    r"AKIA[0-9A-Z]{16}",            # AWS access key
    r"(?i)api[_-]?key\s*=\s*['\"][^'\"]{10,}",
    r"(?i)password\s*=\s*['\"][^'\"]{8,}",
    r"(?i)secret\s*=\s*['\"][^'\"]{8,}",
    r"sk-[a-zA-Z0-9]{48}",          # OpenAI key
    r"ghp_[a-zA-Z0-9]{36}",         # GitHub token
]

for pattern in PATTERNS:
    if re.search(pattern, content):
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Potential secret detected. Move to .env file."
            }
        }))
        sys.exit(0)

print("{}")
```

---

### Pattern 5: Context Injection at Session Start

Automatically inject dynamic context (date, recent git log, env state) at session start.

```bash
#!/bin/bash
# .claude/hooks/setup-env.sh  (SessionStart hook)

# Persist env vars via CLAUDE_ENV_FILE
echo "TODAY=$(date +%Y-%m-%d)" >> "$CLAUDE_ENV_FILE"
echo "PROJECT_ROOT=$(git rev-parse --show-toplevel)" >> "$CLAUDE_ENV_FILE"
echo "BRANCH=$(git branch --show-current)" >> "$CLAUDE_ENV_FILE"

# Inject context into conversation
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null)
echo "{\"additionalContext\": \"Today: $(date). Recent commits:\n$RECENT_COMMITS\"}"
```

---

### Pattern 6: Codex Non-Interactive Automation (exec command)

Run Codex headlessly in scripts, CI/CD pipelines, and automated workflows.

```bash
# Non-interactive exec mode
codex exec --approval-policy never --sandbox workspace-write \
  "Fix all TypeScript errors and run the test suite"

# Stream JSON output for programmatic parsing
codex exec --output-format json "Generate unit tests for src/auth.ts" \
  | jq ".result"

# Resume previous session
codex resume --last "Continue where you left off"

# Fork previous session (non-destructive)
codex fork --last "Try a different approach to the auth bug"

# GitHub Actions integration:
- name: AI Code Review
  run: |
    codex exec --approval-policy never --sandbox read-only \
      "Review the diff and report any issues"
```

---

### Pattern 7: Skill-Based Workflow Isolation

Create skills to separate concerns — each skill handles one type of task and is only loaded when relevant.

```
.claude/skills/
├── database-query/          # Auto-activates on SQL/DB questions
│   ├── SKILL.md
│   └── scripts/
│       └── run-query.sh
├── api-design/              # Auto-activates for REST/GraphQL tasks
│   ├── SKILL.md
│   └── templates/
│       └── openapi.yaml
├── deployment/              # Auto-activates for deploy tasks
│   ├── SKILL.md
│   └── scripts/
│       ├── deploy-staging.sh
│       └── deploy-prod.sh
└── security-review/         # Auto-activates for security topics
    └── SKILL.md
```

Add to CLAUDE.md to help auto-detection:

```markdown
## Available Skills
- database-query: SQL, Postgres, migrations
- api-design: REST API, OpenAPI, GraphQL
- deployment: AWS, staging, production deploys
- security-review: OWASP, auth, secrets scanning
```

---

### Pattern 8: Gemini AfterAgent Build Verification Loop

Use Gemini's `AfterAgent` hook to run build/lint after every agent response turn. If the build fails, return `retry` to make the agent fix it automatically.

```json
// .gemini/settings.json
{
  "hooks": {
    "AfterAgent": [{
      "matcher": "*",
      "hooks": [{
        "name": "verify-build",
        "type": "command",
        "command": ".gemini/hooks/verify-build.sh"
      }]
    }]
  }
}
```

```bash
# .gemini/hooks/verify-build.sh
#!/bin/bash
OUTPUT=$(npm run build 2>&1)
if [ $? -ne 0 ]; then
  jq -n --arg out "$OUTPUT" \
    '{"decision": "retry", "reason": ("Build failed:\n" + $out)}'
  exit 0
fi
echo '{"decision": "allow"}'
```

---

## 13. Community Resources & Further Reading

### Official Documentation

| Platform | URL | Key Pages |
|---|---|---|
| Claude Code | code.claude.com/docs | Skills, Hooks, Subagents, CLI Reference, SDK |
| Claude API | docs.anthropic.com/claude-code | Agent SDK Python/TS reference |
| Gemini CLI | geminicli.com/docs | Skills, Hooks, Subagents, Extensions, Settings |
| Gemini CLI GitHub | github.com/google-gemini/gemini-cli | Open source; CONTRIBUTING.md, issues, changelog |
| OpenAI Codex | developers.openai.com/codex | CLI, Skills, Multi-agent, Config, AGENTS.md |
| OpenAI Cookbook | cookbook.openai.com | Codex MCP + Agents SDK workflow examples |
| Google Developers Blog | developers.googleblog.com | Gemini CLI hooks announcement (Jan 2026) |
| Google Codelabs | codelabs.developers.google.com | How to create Agent Skills for Gemini CLI |

### GitHub Repositories

| Repository | What It Contains |
|---|---|
| `anthropics/claude-code` | Official Claude Code changelog, plugin-dev skills, SKILL.md examples |
| `disler/claude-code-hooks-mastery` | All 13+ hook events implemented, TTS system, Builder/Validator agent pattern |
| `disler/claude-code-hooks-multi-agent-observability` | Real-time monitoring for Claude Code agents via hook event tracking |
| `google-gemini/gemini-cli` | Full open-source Gemini CLI implementation, configuration docs |
| awesome-claude-code (community) | Curated list of hooks, skills, commands, subagents for Claude Code |
| `firebase/agent-skills` (Google) | Firebase Agent Skills (firebase-basics, firestore, app-hosting, auth) |

### Community Articles & Blogs

| Source | Topic |
|---|---|
| alexop.dev — Claude Code Customization Guide | CLAUDE.md, Skills, Subagents, Slash Commands deep dive |
| alexop.dev — Understanding Claude Code Full Stack | MCP, Skills, Subagents, Hooks explained in order introduced |
| sankalp.bearblog.dev — Claude Code 2.0 | Skills, plugins, subagents, Master-Clone architecture |
| genaiunplugged.substack.com | Tutorial covering all Claude Code extensibility types |
| muneebsa.medium.com — Claude Code Extensions Explained | Skills, MCP, Hooks, Subagents, Agent Teams with timeline |
| blog.sshh.io — How I Use Every Claude Code Feature | Real-world usage; Master-Clone architecture |
| youngleaders.tech — Skills vs Commands vs Subagents vs Plugins | Architectural breakdown of Claude Code extensibility |
| thiele.dev — Gemini CLI Hooks: AfterTool & AfterAgent Autonomy | Build verification loop patterns with Gemini hooks |
| aipositive.substack.com — Gemini CLI Multi-Agent with Just Prompts | Filesystem-as-state multi-agent pattern |
| claudefa.st — Claude Code Hooks Complete Guide | HTTP hooks, 4 handler types, async hooks, skill activation hook |
| smartscope.blog — Claude Code Hooks Guide (Feb 2026) | 14 events, 3 handler types, TeammateIdle, TaskCompleted |
| datacamp.com — Claude Code Hooks Practical Guide | Beginner-friendly hooks tutorial with Python examples |

### Open Agent Skills Standard

Claude Code (Anthropic), Gemini CLI (Google), and OpenAI Codex all implement the same Open Agent Skills standard. This means SKILL.md files written for one platform can in principle work on another with minimal changes.

Requirements:
- A directory containing a `SKILL.md` file
- YAML frontmatter with at minimum `name` and `description`
- The `.agents/skills/` path is supported across all three platforms as a platform-neutral location

```markdown
# Universal SKILL.md (works on Claude Code, Gemini CLI, OpenAI Codex)

# Location: .agents/skills/<skill-name>/SKILL.md  (universal alias)
# OR:  .claude/skills/<n>/    (Claude Code)
# OR:  .gemini/skills/<n>/    (Gemini CLI)
# OR:  <repo>/.agents/skills/ (Codex)

---
name: universal-skill-name
description: >
  Precise description of when this skill should activate.
  Include what task types trigger it and what should NOT trigger it.
---

# Skill instructions go here
Detailed step-by-step instructions for the agent to follow...
```

---

> Research compiled March 2026. Platforms are actively developed — always check official documentation for the latest features.
>
> - **Claude Code**: Most mature hooks/skills/subagents system
> - **Gemini CLI**: Only fully open-source option (Apache 2.0)
> - **OpenAI Codex**: Fastest (Rust binary); uniquely can expose itself as an MCP server for SDK workflows
