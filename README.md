# Cubis Foundry CLI (`cbx`)

Workflow-first installer for AI agent environments, with Codex callable-skill wrappers.

Repository layout note: reusable workflow/skill/power assets are stored under `Ai Agent Workflow/`.

Primary support in this release:
- Antigravity
- Codex
- Copilot (VS Code Chat + Copilot CLI)

## Install

```bash
npm install -g @cubis/foundry
cbx --help
```

Compatibility binaries are still shipped for migration:
- `cubiskill`
- `cubis`

## Quick Setup (Simple)

```bash
# 1) Install CLI
npm install -g @cubis/foundry

# 2) Set Postman key once (recommended: env mode)
export POSTMAN_API_KEY="<your-postman-api-key>"

# 3) Install workflow bundle for your platform
cbx workflows install --platform codex --bundle agent-environment-setup --postman --yes

# 4) Optional: install for other platforms too
cbx workflows install --platform antigravity --bundle agent-environment-setup --postman --yes
cbx workflows install --platform copilot --bundle agent-environment-setup --postman --yes
```

## Command Model

`workflows` is now the primary command group.

```bash
cbx workflows install --platform antigravity
cbx workflows install --platform codex
cbx workflows install --platform copilot
cbx workflows remove <bundle-or-workflow> --platform antigravity
cbx workflows sync-rules --platform codex
cbx workflows doctor codex
cbx workflows platforms
cbx workflows install --platform antigravity --dry-run
cbx workflows install --platform antigravity --terminal-integration --terminal-verifier codex
cbx workflows install --platform codex --postman
cbx workflows install --platform codex --postman --postman-workspace-id null
cbx workflows install --platform codex --postman --postman-api-key "<key>"
cbx workflows install --platform antigravity --postman
cbx workflows install --platform copilot --postman
```

Install bootstrap behavior:
- `cbx workflows install` now also bootstraps `ENGINEERING_RULES.md` and `TECH.md` (creates when missing; keeps existing files unless explicitly regenerated).
- When install scope is `global` (default), skills/powers install to global paths, while workflows + agents stay in workspace (`project`) paths.
- Rule sync + engineering artifacts (`AGENTS.md`/`GEMINI.md`/Copilot instructions, `ENGINEERING_RULES.md`, `TECH.md`) are maintained in workspace (`project`) scope.
- Codex workflow templates are maintained in workspace `.agents/workflows` so workflow-wrapper routing remains discoverable in project rules.
- Optional `--postman` bootstrap creates `postman_setting.json` and installs/configures the Postman skill/MCP for Codex, Antigravity, and Copilot.
- Use `cbx rules init --platform <platform> --overwrite` to force-regenerate both files.

Postman setup behavior:
- `postman_setting.json` is generated in project root (or `~/.cbx/postman_setting.json` with `--scope global`).
- Env-first auth is supported: when `POSTMAN_API_KEY` is set, generated settings keep `apiKey: null` and MCP config uses `Bearer ${POSTMAN_API_KEY}`.
- Inline auth is supported with `--postman-api-key <key>`.
- `--postman-workspace-id null` writes JSON `null` for `defaultWorkspaceId`.
- In project scope, `postman_setting.json` is auto-added to `.gitignore` (no duplicate entries).

`rules` manages strict engineering policy and a generated codebase tech map:

```bash
cbx rules init --platform antigravity
cbx rules init --platform codex
cbx rules init --platform copilot
cbx rules init --platform codex --scope global
cbx rules tech-md --overwrite
cbx rules init --platform codex --dry-run
```

What `cbx rules init` does:
- Creates `ENGINEERING_RULES.md` next to the active platform rule file.
- Appends/patches one managed engineering block in that rule file.
- Generates `TECH.md` at workspace root by scanning the current codebase.
- Preserves user content outside managed markers.

`TECH.md` scanner coverage (deterministic, no AI calls):
- Language/file signals from workspace scan.
- JS/TS package signals from `package.json` (including nested/monorepo package files).
- Flutter/Dart package signals from `pubspec.yaml`.
- Go module signals from `go.mod`.
- Python package signals from `requirements*.txt` and `pyproject.toml`.
- Rust crate signals from `Cargo.toml`.

### Deprecated Alias

`cbx skills ...` still works for one minor cycle and prints a deprecation notice.

## Bundle Catalog

Catalog root:

```text
Ai Agent Workflow/workflows/
```

First bundled profile:
- `agent-environment-setup`

Bundle manifest:

```text
Ai Agent Workflow/workflows/agent-environment-setup/manifest.json
```

Bundle contains platform-specific:
- workflow templates (`workflows/*.md`)
- specialist agent templates (`agents/*.md`)
- mapped reusable skills copied from `Ai Agent Workflow/skills/<id>/`
- Codex callable wrapper skills generated from workflow/agent templates
- rule templates (`rules/*.md`)

## Installed Capability Set (v1)

Database capability stack:
- `database-skills` (engine hub)
- `database-design` (schema/migration design)
- `database-optimizer` (query/index/tuning triage)
- `drift-flutter` (Flutter local persistence)


Core workflows:
- `/brainstorm`
- `/plan`
- `/create`
- `/test`
- `/debug`
- `/implement-track`
- `/backend`
- `/security`
- `/database`
- `/mobile`
- `/devops`
- `/qa`

Routing behavior:
- Antigravity/Copilot: workflow + agent markdown can be routed by platform conventions.
- Codex: use generated callable wrapper skills (`$workflow-*`, `$agent-*`).
- Example for backend intent in Codex: `$workflow-backend` or `$agent-backend-specialist`.
- Backend workflow policy: always include OpenAPI updates plus Swagger UI and Stoplight Elements status in output.

### Codex Runtime Mode

Codex does not currently execute custom workflow slash commands or custom `@agent` markdown files as first-class runtime entities.
Codex skill invocation syntax is `$skill-name` (not `@agent-name`).

`cbx` handles this by generating callable Codex skills:
- Workflow wrappers: `$workflow-<name>` (for example `$workflow-review`, `$workflow-plan`)
- Agent wrappers: `$agent-<name>` (for example `$agent-backend-specialist`)

Use these wrappers directly in Codex prompts.
Do not rely on custom `/workflow` execution or custom `@agent` invocation in Codex runtime.

## Platform Paths

### Antigravity

Project scope:
- Workflows: `.agent/workflows`
- Agents: `.agent/agents`
- Skills: `.agent/skills`
- Rules: `.agent/rules/GEMINI.md`
- Terminal integration (optional): `.agent/terminal-integration`

Global scope:
- Skills: `~/.gemini/antigravity/skills`
- Rules: `~/.gemini/GEMINI.md`
- Workflows/agents/terminal-integration: default install keeps these in workspace (`.agent/...`) paths.

### Antigravity Terminal Integration (Optional)

Install-time options:
- `--terminal-integration`
- `--terminal-verifier <codex|gemini>`

Behavior:
- Interactive installs prompt whether to enable terminal verification integration.
- If enabled, cbx writes managed scripts/config under `.agent/terminal-integration`.
- cbx also writes a managed terminal verification block into Antigravity rule files so post-task verification commands are explicit.
- Removing the bundle cleans the managed terminal integration directory and block.

### Codex

Project scope:
- Workflow templates (reference docs): `.agents/workflows`
- Skills: `.agents/skills`
- Rules: `AGENTS.md`
- Agents: not installed for Codex runtime
- Callable wrappers: generated into `.agents/skills` as:
  - `workflow-<workflow-id>`
  - `agent-<agent-id>`
  - Example usage: `$workflow-plan`, `$agent-backend-specialist`

Global scope:
- Skills: `~/.agents/skills`
- Rules: `~/.codex/AGENTS.md`
- Workflow templates (reference docs): default install keeps these in workspace `.agents/workflows`
- Agents: not installed for Codex runtime

Legacy compatibility note:
- `.codex/skills` is treated as legacy and flagged by `doctor` with migration guidance.

### Copilot

Project scope:
- Workflows: `.github/copilot/workflows`
- Agents: `.github/agents`
- Skills: `.github/skills`
- Rules: `AGENTS.md` (preferred), fallback `.github/copilot-instructions.md`
- Skill schema note: `cbx` normalizes Copilot skill frontmatter by removing unsupported top-level keys like `displayName` and `keywords` during install.

Global scope:
- Skills: `~/.copilot/skills`
- Rules: `~/.copilot/copilot-instructions.md`
- Workflows/agents: default install keeps these in workspace (`.github/...`) paths.

## Rule Auto-Sync

`cbx` maintains a single managed block in the active platform rule file.

Markers:

```md
<!-- cbx:workflows:auto:start platform=<platform-id> version=1 -->
...
<!-- cbx:workflows:auto:end -->
```

Behavior:
- Preserves user content outside markers.
- Replaces first valid managed block in place.
- Appends a managed block if missing.
- On malformed/multiple markers, patches first valid range and warns.
- Keeps markers even when no workflows are installed.

## Scope and Detection

Default scope:
- Install/init commands:
  - `cbx workflows install`
  - `cbx workflows init`
  - `cbx skills install`
  - `cbx skills init`
  - `cbx install` (legacy alias)
  - `cbx init` (legacy alias)
  - Default scope for these commands is `global`.
  - In this default global mode, only skills/powers install globally. Workflows/agents and rule/engineering files remain workspace-scoped.
- Other workflow/rules commands default to `project`.

Optional:
- `--scope global`
- `--scope project`

Platform auto-detection:
- Uses repo markers for Antigravity/Codex/Copilot.
- Prompts when ambiguous.
- Remembers last selected platform in local state.

State files:
- Project: `.cbx/workflows-state.json`
- Global: `~/.cbx/state.json`

## Dry Run

Preview mode is supported on install/remove/sync:

```bash
cbx workflows install --platform antigravity --bundle agent-environment-setup --dry-run
cbx workflows install --platform antigravity --bundle agent-environment-setup --terminal-integration --terminal-verifier codex --dry-run
cbx workflows remove agent-environment-setup --platform antigravity --dry-run
cbx workflows sync-rules --platform codex --dry-run
```

Dry-run behavior:
- prints planned file changes
- prints planned managed-block action (`would-create`/`would-patch`)
- does not write files
- does not update state files

## Full Smoke Test Sample

Use this script-style sequence to validate end-to-end behavior:

```bash
# 1) Create isolated workspace
TMP_DIR="$(mktemp -d /tmp/cbx-smoke.XXXXXX)"
cd "$TMP_DIR"

# 2) Antigravity preview + apply + doctor
cbx workflows install --platform antigravity --bundle agent-environment-setup --dry-run
cbx workflows install --platform antigravity --bundle agent-environment-setup --terminal-integration --terminal-verifier codex --yes
cbx workflows doctor antigravity --json

# 3) Codex preview + apply + doctor
mkdir -p .codex/skills  # optional: simulate legacy path warning
cbx workflows install --platform codex --bundle agent-environment-setup --dry-run
cbx workflows install --platform codex --bundle agent-environment-setup --yes
cbx workflows doctor codex --json
# Codex runtime usage (in prompt): $workflow-review or $agent-backend-specialist

# 4) Copilot preview + apply + doctor
cbx workflows install --platform copilot --bundle agent-environment-setup --dry-run
cbx workflows install --platform copilot --bundle agent-environment-setup --yes
cbx workflows doctor copilot --json

# 5) Remove bundle preview + apply
cbx workflows remove agent-environment-setup --platform antigravity --dry-run
cbx workflows remove agent-environment-setup --platform antigravity --yes
```

## Doctor Checks

`cbx workflows doctor` validates:
- workflow/agent/skill path existence
- active rule file status
- managed block health
- Codex wrapper-skill readiness (`$workflow-*`, `$agent-*`) through installed skills path
- Codex legacy path warnings (`.codex/skills`)
- Antigravity `.gitignore` warning for `.agent/` with recommendation to use `.git/info/exclude` for local-only excludes
- Antigravity terminal integration status (directory/config/rule block)
- Copilot project/global path health (`.github/agents`, `.github/skills`, `AGENTS.md` / `.github/copilot-instructions.md`)

## Conductor Integration

No automatic Conductor installation is performed.

If Conductor artifacts already exist, workflows may reference them as supporting context.

## Development

Run CLI help locally:

```bash
node bin/cubis.js --help
```

Run attribute validation (non-strict):

```bash
npm run test:attributes
```

Run attribute validation (strict, fails on warnings):

```bash
npm run test:attributes:strict
```

Run TECH.md scanner integration tests:

```bash
npm run test:tech-md
```

Run full workflow smoke test:

```bash
bash scripts/smoke-workflows.sh
```

Run the full suite:

```bash
npm run test:all
```

Run the full suite in strict mode:

```bash
npm run test:all:strict
```

## References

- [antigravity-kit](https://github.com/vudovn/antigravity-kit)
- [Codex Skills](https://developers.openai.com/codex/skills/)
- [Codex AGENTS Guide](https://developers.openai.com/codex/guides/agents-md)
- [Codex Config Basics](https://developers.openai.com/codex/config-basic)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenCode Rules](https://opencode.ai/docs/rules/)
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
- [GitHub Copilot Skills](https://docs.github.com/en/copilot/how-tos/context/configure-custom-instructions/add-repository-instructions#using-skills-to-group-custom-instructions)
