# Cubis Foundry CLI (`cbx`)

Workflow-first installer for AI agent environments.

Repository layout note: reusable workflow/skill/power assets are stored under `Ai Agent Workflow/`.

Primary support in this release:
- Antigravity
- Codex
- Copilot (VS Code Chat + Copilot CLI)

## Install

```bash
npm install -g cubis-foundry
cbx --help
```

Compatibility binaries are still shipped for migration:
- `cubiskill`
- `cubis`

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
```

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
- slash-command workflows (`workflows/*.md`)
- specialist agent definitions (`agents/*.md`)
- mapped reusable skills copied from `Ai Agent Workflow/skills/<id>/`
- rule templates (`rules/*.md`)

## Installed Workflow Set (v1)

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

Backend workflow routes to:
- `@backend-specialist`

### Codex Detailed Pack

Codex bundle now includes additional workflow commands:
- `/orchestrate`
- `/review`
- `/refactor`
- `/incident`
- `/release`

Full AG-kit-style specialist roster is installed for all supported platforms:
- Codex: `.agents/agents`
- Antigravity: `.agent/agents`
- Copilot: `.github/agents`

Specialists:
- `@backend-specialist`
- `@code-archaeologist`
- `@database-architect`
- `@debugger`
- `@devops-engineer`
- `@documentation-writer`
- `@explorer-agent`
- `@frontend-specialist`
- `@game-developer`
- `@mobile-developer`
- `@orchestrator`
- `@penetration-tester`
- `@performance-optimizer`
- `@product-manager`
- `@product-owner`
- `@project-planner`
- `@qa-automation-engineer`
- `@security-auditor`
- `@seo-specialist`
- `@test-engineer`

## Platform Paths

### Antigravity

Project scope:
- Workflows: `.agent/workflows`
- Agents: `.agent/agents`
- Skills: `.agent/skills`
- Rules: `.agent/rules/GEMINI.md`

Global scope:
- Workflows: `~/.gemini/antigravity/workflows`
- Agents: `~/.gemini/antigravity/agents`
- Skills: `~/.gemini/antigravity/skills`
- Rules: `~/.gemini/GEMINI.md`

### Codex

Project scope:
- Workflows: `.agents/workflows`
- Skills: `.agents/skills`
- Rules: `AGENTS.md`
- Agents: disabled by default (Codex custom agent files are not installed)

Global scope:
- Workflows: `~/.agents/workflows`
- Skills: `~/.agents/skills`
- Rules: `~/.codex/AGENTS.md`
- Agents: disabled by default (Codex custom agent files are not installed)

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
- Workflows: `~/.copilot/workflows`
- Agents: `~/.copilot/agents`
- Skills: `~/.copilot/skills`
- Rules: `~/.copilot/copilot-instructions.md`

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
- `project`

Optional:
- `--scope global`

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
cbx workflows install --platform antigravity --bundle agent-environment-setup --yes
cbx workflows doctor antigravity --json

# 3) Codex preview + apply + doctor
mkdir -p .codex/skills  # optional: simulate legacy path warning
cbx workflows install --platform codex --bundle agent-environment-setup --dry-run
cbx workflows install --platform codex --bundle agent-environment-setup --yes
cbx workflows doctor codex --json

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
- Codex legacy path warnings (`.codex/skills`)
- Antigravity `.gitignore` warning for `.agent/` with recommendation to use `.git/info/exclude` for local-only excludes
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
