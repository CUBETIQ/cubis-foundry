# Platform Support Matrix

> Generated from source analysis of `generate-platform-assets.mjs` and platform rule files.
> Last updated: Phase 4 of the skill library redesign.

## Platforms

| Platform                            | Rule File                          | Output Directory | Execution Model                                     |
| ----------------------------------- | ---------------------------------- | ---------------- | --------------------------------------------------- |
| **Antigravity** (Gemini CLI / Kiro) | `GEMINI.md` (`trigger: always_on`) | `.agent/`        | Agents as Gemini subprocesses (parallel)            |
| **Claude** (Claude Code)            | `CLAUDE.md`                        | `.claude/`       | Subagents via `Task` tool (parallel, isolated)      |
| **Codex** (Codex CLI)               | `AGENTS.md`                        | `.agents/`       | Postures within session (sequential, no subprocess) |
| **Copilot** (GitHub Copilot)        | `copilot-instructions.md`          | `.github/`       | Agents + `.prompt.md` files (parallel via VS Code)  |

---

## File Artifacts per Platform

| Artifact              | Antigravity            | Claude         | Codex                           | Copilot                          |
| --------------------- | ---------------------- | -------------- | ------------------------------- | -------------------------------- |
| Agent files           | 22 `.md` (raw)         | 22 `.md` (raw) | 22 `.md` (raw)                  | 22 `.md` (sanitized frontmatter) |
| Workflow files        | 18 `.md` (raw)         | 18 `.md` (raw) | 18 `.md` (raw)                  | 18 `.md` (raw)                   |
| Command/prompt files  | 18 `.toml` (generated) | —              | —                               | 18 `.prompt.md` (generated)      |
| Skill mirrors         | —                      | 87+ skill dirs | —                               | 87+ skill dirs                   |
| Rules file            | `GEMINI.md`            | `CLAUDE.md`    | `AGENTS.md`                     | `copilot-instructions.md`        |
| Compatibility aliases | —                      | —              | `$agent-{id}`, `$workflow-{id}` | —                                |

---

## Agent Frontmatter Handling

### Shared Agent Frontmatter Fields

```yaml
name: agent-id
description: "Agent purpose and trigger keywords."
tools: Read, Grep, Glob, Bash, Write, Edit
model: inherit
skills: skill-1, skill-2, skill-3
```

### Copilot Sanitization

Only these 10 keys survive in Copilot agent frontmatter:

```
name, description, tools, target, infer, mcp-servers, metadata, model, handoffs, argument-hint
```

**Removed**: `skills`, `triggers`, `domain`, `role`, `stack`, `category`, `layer`

Skills are instead appended as a markdown section:

```markdown
## Skill routing

Prefer these skills when task intent matches: `skill-1`, `skill-2`, `skill-3`.
```

### Other Platforms

Antigravity, Claude, and Codex receive the full shared frontmatter unchanged.

---

## Platform Execution Models

### Antigravity (Gemini CLI)

- **Entry**: `.toml` command files or direct `/command` invocation
- **Flow**: `/command` → load `.toml` → load workflow `.md` → route to `@agent` → agent loads skills from frontmatter
- **Agent model**: Real Gemini subprocesses (can run in parallel)
- **Command format**: TOML with `description` and `prompt` fields containing execution contract
- **Skill access**: Listed in agent frontmatter `skills:` field, loaded via MCP `skill_vault_read`
- **Rules**: `.agent/rules/GEMINI.md` with `trigger: always_on` frontmatter

### Claude (Claude Code)

- **Entry**: Direct request or Task tool invocation
- **Flow**: request → route_resolve → if cross-domain → Task tool spawns `@subagent` → subagent loads workflow → routes to agents → agents load skills
- **Agent model**: Parallel processes via Task tool (fully isolated)
- **Skill access**: Listed in agent frontmatter `skills:` field, loaded via MCP `skill_vault_read`
- **Rules**: `.claude/rules/*.md` with path matchers for scoped rules, project-wide `CLAUDE.md`

### Codex (Codex CLI)

- **Entry**: `/orchestrate` or similar command
- **Flow**: `/command` → adopt orchestrator posture (in-session) → sequentially adopt specialist postures → each posture loads skills
- **Agent model**: Postures within current session (NO parallelism, NO subprocess spawning)
- **Skill access**: Listed in agent frontmatter `skills:` field, loaded via MCP `skill_vault_read`
- **Cross-invoke**: `$agent-{id}` and `$workflow-{id}` compatibility aliases
- **Constraints**: Network may be restricted, sequential-only execution
- **Rules**: `.agents/rules/AGENTS.md`

### Copilot (GitHub Copilot)

- **Entry**: `.prompt.md` files (task-shaped templates) or `@agent` mention
- **Flow**: prompt → loads workflow → routes to `@agent` → agent has "Skill routing" section → skills loaded via MCP
- **Agent model**: VS Code native agent references (supports parallelism)
- **Skill access**: Via skill routing markdown section (appended during generation)
- **Unique artifacts**: `.prompt.md` files (1 per workflow), `.instructions.md` files (path-scoped)
- **MCP config**: `.vscode/mcp.json`
- **Rules**: `.github/instructions/*.instructions.md` (path-scoped), `copilot-instructions.md` (global)

---

## Route Decision Tree (Shared Across All Platforms)

All 4 platforms share the same 6-level routing logic:

| Level         | Condition                          | Action                                     |
| ------------- | ---------------------------------- | ------------------------------------------ |
| TRIVIAL       | Simple question, no implementation | Answer directly                            |
| EXPLICIT      | User names a workflow or agent     | Route to it                                |
| SINGLE-DOMAIN | Task fits one specialist           | Route to specialist agent                  |
| CROSS-DOMAIN  | Task spans multiple domains        | Use orchestrator with multiple specialists |
| UNRESOLVED    | No clear route                     | Use `route_resolve` MCP tool               |
| FAILED        | Route resolve fails                | Fall back to orchestrator or ask user      |

---

## Skill Discovery Mechanism

All platforms use the same skill discovery stack:

1. **Agent frontmatter** `skills:` field (or Copilot's skill routing section) — preferred, no network call
2. **MCP `skill_search`** — keyword search against manifest when frontmatter skills don't match
3. **MCP `route_resolve`** — full routing resolution when skill_search is insufficient
4. **MCP `skill_vault_read`** — loads the actual SKILL.md content once a skill is identified

---

## Build Pipeline

**Source**: `workflows/workflows/agent-environment-setup/shared/` (write once)

**Script**: `scripts/generate-platform-assets.mjs`

**Transforms**:

| Step              | All Platforms         | Antigravity Only | Copilot Only                                |
| ----------------- | --------------------- | ---------------- | ------------------------------------------- |
| Copy agents       | ✓                     | —                | Sanitize frontmatter + append skill routing |
| Copy workflows    | ✓                     | —                | —                                           |
| Generate commands | —                     | `.toml` files    | `.prompt.md` files                          |
| Copy skills       | —                     | —                | Mirror canonical skills dir                 |
| Generate manifest | Route manifest (JSON) | —                | —                                           |

**Output**: `generated/route-manifest.json` with all 40 routes (22 agents + 18 workflows) and per-platform artifact paths.

---

## Validation Scripts

| Script                         | What It Validates                                       |
| ------------------------------ | ------------------------------------------------------- |
| `validate-skill-packaging.mjs` | SKILL.md frontmatter, required headings, markdown links |
| `validate-mcp-skills.mjs`      | Manifest sync, description length, rule references      |
| `validate-shared-routing.mjs`  | Shared agent/workflow routing consistency               |
| `validate-runtime-wiring.mjs`  | Platform artifact existence and cross-references        |
