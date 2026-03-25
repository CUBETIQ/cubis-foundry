# Foundry V2 — Documentation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write all user documentation, contributor guide, runbooks, and technical reference defined in the spec.

---

## File Map

```
docs/
  user/
    getting-started.md
    install-profiles.md
    commands/
      cbx-init.md
      cbx-workflows.md
      cbx-catalog.md
      cbx-build.md
      cbx-doctor.md
    platforms/
      claude.md
      codex.md
      copilot.md
      gemini.md
      antigravity.md
    troubleshooting.md
    faq.md
  contributor/
    getting-started.md
    adding-module.md
    adding-platform.md
    skill-authoring.md
    workflow-authoring.md
    agent-authoring.md
    rule-authoring.md
    testing.md
    release-process.md
    coding-standards.md
  runbooks/
    release.md
    hotfix.md
    incident-response.md
    skill-update.md
    platform-migration.md
    audit-failure.md
  tech/
    schemas/
      package-yaml.md
      module-yaml.md
      adapter-yaml.md
      install-state.md
    apis/
      catalog-api.md
      compiler-api.md
      installer-api.md
      rules-api.md
      state-api.md
      doctor-api.md
      mcp-api.md
    cli-reference.md
    build-pipeline.md
    install-flow.md
    skill-format.md
    eval-format.md
    rule-format.md
```

---

## Tasks

### Task 1: User Documentation

- [ ] Write `docs/user/getting-started.md` — install cbx, run `cbx init`, choose profile
- [ ] Write `docs/user/install-profiles.md` — core vs developer vs security vs research
- [ ] Write `docs/user/commands/cbx-init.md` — full reference for cbx init
- [ ] Write `docs/user/commands/cbx-workflows.md` — install, remove, prune-skills, sync-rules
- [ ] Write `docs/user/commands/cbx-catalog.md` — validate, build, audit, diff, status
- [ ] Write `docs/user/commands/cbx-build.md` — build architecture command
- [ ] Write `docs/user/commands/cbx-doctor.md` — doctor command
- [ ] Write `docs/user/troubleshooting.md` — common issues and fixes
- [ ] Write `docs/user/faq.md` — frequently asked questions
- [ ] Commit

### Task 2: Contributor Guide

- [ ] Write `docs/contributor/getting-started.md` — clone, build, test cycle
- [ ] Write `docs/contributor/adding-module.md` — how to create a new module
- [ ] Write `docs/contributor/adding-platform.md` — how to add a new platform adapter
- [ ] Write `docs/contributor/skill-authoring.md` — how to write a good SKILL.md
- [ ] Write `docs/contributor/testing.md` — how to test changes (unit, golden file, installer)
- [ ] Write `docs/contributor/release-process.md` — how to cut a release
- [ ] Write `docs/contributor/coding-standards.md` — TypeScript, YAML, Jinja2 conventions
- [ ] Commit

### Task 3: Runbooks

- [ ] Write `docs/runbooks/release.md` — step-by-step release process
- [ ] Write `docs/runbooks/hotfix.md` — emergency hotfix without breaking upgrades
- [ ] Write `docs/runbooks/incident-response.md` — user-reported data loss
- [ ] Write `docs/runbooks/skill-update.md` — update a skill after a framework release
- [ ] Commit

### Task 4: Technical Reference

- [ ] Write `docs/tech/schemas/package-yaml.md` — full reference for foundry/package.yaml
- [ ] Write `docs/tech/schemas/module-yaml.md` — full reference for foundry/modules/<id>/module.yaml
- [ ] Write `docs/tech/schemas/adapter-yaml.md` — full reference for foundry/adapters/<platform>.yaml
- [ ] Write `docs/tech/cli-reference.md` — complete CLI command reference
- [ ] Write `docs/tech/build-pipeline.md` — how the 5-stage compilation pipeline works
- [ ] Write `docs/tech/install-flow.md` — how install/upgrade/remove flows work
- [ ] Commit

### Task 5: GitHub workflows

- [ ] Create `.github/workflows/research.yml` — monthly research pipeline
- [ ] Create `.github/workflows/eval.yml` — weekly full eval suite
- [ ] Configure `cbx catalog audit --skills` to run on PRs changing foundry/modules/
- [ ] Commit

---

## Verification

- All docs/ files exist and have meaningful content (not stub/todo)
- `cbx catalog validate` — no errors
- `cbx catalog build` — generates docs
