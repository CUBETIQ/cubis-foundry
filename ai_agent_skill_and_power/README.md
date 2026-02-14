# Cubis Foundry CLI (`cbx`)

Workflow-first installer for AI agent environments.

Primary support in this release:
- Antigravity
- Codex

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
workflows/
```

First bundled profile:
- `agent-environment-setup`

Bundle manifest:

```text
workflows/agent-environment-setup/manifest.json
```

Bundle contains platform-specific:
- slash-command workflows (`workflows/*.md`)
- specialist agent definitions (`agents/*.md`)
- mapped reusable skills copied from `skills/<id>/`
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

Full AG-kit-style specialist roster is installed for both:
- Codex: `.agents/agents`
- Antigravity: `.agent/agents`

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
- Agents: `.agents/agents`
- Skills: `.agents/skills`
- Rules: `AGENTS.md`

Global scope:
- Workflows: `~/.agents/workflows`
- Agents: `~/.agents/agents`
- Skills: `~/.agents/skills`
- Rules: `~/.codex/AGENTS.md`

Legacy compatibility note:
- `.codex/skills` is treated as legacy and flagged by `doctor` with migration guidance.

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
- Uses repo markers for Antigravity/Codex.
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
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows install --platform antigravity --bundle agent-environment-setup --dry-run
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows install --platform antigravity --bundle agent-environment-setup --yes
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows doctor antigravity --json

# 3) Codex preview + apply + doctor
mkdir -p .codex/skills  # optional: simulate legacy path warning
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows install --platform codex --bundle agent-environment-setup --dry-run
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows install --platform codex --bundle agent-environment-setup --yes
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows doctor codex --json

# 4) Remove bundle preview + apply
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows remove agent-environment-setup --platform antigravity --dry-run
node /Users/phumrin/Documents/Cubis\ Foundry/ai_agent_skill_and_power/bin/cubis.js workflows remove agent-environment-setup --platform antigravity --yes
```

## Doctor Checks

`cbx workflows doctor` validates:
- workflow/agent/skill path existence
- active rule file status
- managed block health
- Codex legacy path warnings (`.codex/skills`)
- Antigravity `.gitignore` warning for `.agent/` with recommendation to use `.git/info/exclude` for local-only excludes

## Conductor Integration

No automatic Conductor installation is performed.

If Conductor artifacts already exist, workflows may reference them as supporting context.

## Development

Run CLI help locally:

```bash
node bin/cubis.js --help
```

Run full workflow smoke test:

```bash
bash scripts/smoke-workflows.sh
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
