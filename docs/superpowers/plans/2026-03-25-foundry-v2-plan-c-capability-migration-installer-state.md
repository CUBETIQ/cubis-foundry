# Foundry V2 — Capability Migration + Installer + State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all existing skills to the capability model, implement the staged-diff installer with user-override protection, and implement per-platform install state.

**Architecture:**
- **Installer**: Stage → Diff → Conflict detect → Apply → Log
- **State**: JSON per platform in `~/.foundry/state/<platform>.json`
- **User overrides**: `.user` suffix files, `~/.foundry/user-rules/`, `~/.foundry/rules.preferences.yaml`

---

## File Map

### Installer subsystem

```
src/cli/installer/
  index.ts                    # Public API: applyInstall(), previewInstall(), checkUpgrade(), removeInstall()
  stager.ts                   # Write assets to staging directory
  differ.ts                  # Diff staging against user environment
  applier.ts                 # Apply staged assets with conflict resolution
  state.ts                   # State management (delegates to state subsystem)

src/cli/state/
  index.ts                   # Public API: readState(), writeState(), patchState(), listInstalledPlatforms(), clearState()
  platform-state.ts          # Read/write ~/.foundry/state/<platform>.json

src/cli/rules/
  index.ts                   # Public API: loadRules(), mergeRules(), isUserOverridden(), compileRules()
  smart-rule.ts             # Rule: scope, condition, action, priority, userOverrideable
  merger.ts                  # Merge user rules with generated rules
```

### Capability migration

```
foundry/modules/
  <capability>/
    module.yaml
    SKILL.md                  # Migrated from workflows/skills/<id>/SKILL.md
    templates/                # Platform-specific templates
      claude.j2
      codex.j2
    rules/
      *.yaml
    evals/
      assertions.md
```

---

## Tasks

### Task 1: Implement state subsystem

- [ ] Create `src/cli/state/platform-state.ts` — read/write JSON files in `~/.foundry/state/`
- [ ] Create `src/cli/state/index.ts` — public API with types `InstallState`, `InstalledAsset`
- [ ] Write tests for state read/write
- [ ] Commit

### Task 2: Implement rules subsystem

- [ ] Create `src/cli/rules/smart-rule.ts` — Rule type with scope, condition, action, priority, userOverrideable
- [ ] Create `src/cli/rules/merger.ts` — merge generated rules with user rules (user always wins)
- [ ] Create `src/cli/rules/index.ts` — loadRules, mergeRules, isUserOverridden, compileRules
- [ ] Write tests: user rules override generated rules, priority ordering
- [ ] Commit

### Task 3: Implement installer subsystem

- [ ] Create `src/cli/installer/stager.ts` — copy CompiledAssets to temp staging dir
- [ ] Create `src/cli/installer/differ.ts` — diff staging vs user env, return DiffReport
- [ ] Create `src/cli/installer/applier.ts` — apply staged assets, skip .user files, honor user overrides
- [ ] Create `src/cli/installer/index.ts` — orchestrator: applyInstall, previewInstall, checkUpgrade, removeInstall
- [ ] Write tests: apply creates correct files, user override skipped, checksums match
- [ ] Commit

### Task 4: Migrate first 5 capabilities

Migrate these skills from `workflows/skills/` to `foundry/modules/`:
- [ ] `api-design` — SKILL.md + module.yaml + templates
- [ ] `fastapi` — SKILL.md + module.yaml + templates
- [ ] `typescript-best-practices` — SKILL.md + module.yaml + templates
- [ ] `frontend-design` — SKILL.md + module.yaml + templates (the big one)
- [ ] `code-review` — SKILL.md + module.yaml + templates

For each:
- Create `foundry/modules/<id>/module.yaml` with capability contract
- Copy `workflows/skills/<id>/SKILL.md` → `foundry/modules/<id>/SKILL.md`
- Create `foundry/modules/<id>/templates/claude.j2` (adapt existing skill for Claude platform)
- Run `cbx catalog build --platform claude` and verify output

### Task 5: Migrate remaining capabilities

- [ ] All remaining skills from `workflows/skills/` to `foundry/modules/`
- [ ] Design stack consolidation: merge design-arrange, design-bolder, design-distill, design-polish, design-typeset into single `design` capability with 6 modes
- [ ] QA capability: merge ui-testing-harness, playwright-web-qa, flutter-mobile-qa
- [ ] Demote `stitch` to compat-alias
- [ ] Remove old `workflows/skills/` and `workflows/workflows/agent-environment-setup/platforms/` (the "no V1 bridge" decision)
- [ ] Run `cbx catalog build` — all 5 platforms generate successfully
- [ ] Commit

---

## Verification

- `npm run test:cli` — all tests pass
- `cbx catalog build` — all platforms generate without errors
- `cbx catalog validate` — no validation errors
- `ls foundry/modules/` — ~20-25 capability directories
- `ls generated/runtime-assets/claude/` — populated with generated skills
