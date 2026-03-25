# Foundry V2 — Compiler Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the compiler subsystem. After this plan, `cbx catalog build` generates platform-specific assets from canonical sources into `generated/runtime-assets/<platform>/`.

**Architecture:** Pipeline-based compiler: Load → Validate → Resolve → Transform → Emit. Each stage is a separate function. Adapters define transform rules in YAML DSL.

**Tech Stack:** TypeScript (ESM), Zod, `yaml` package, `jinja2`-like templating (use a minimal custom implementation or `handlebars`).

---

## File Map

```
src/cli/compiler/
  index.ts                    # Public API: compile(), compileModule(), needsRecompile()
  pipeline.ts                 # Pipeline orchestration
  stages/
    load.ts                  # Stage 1: Load catalog + adapters
    validate.ts              # Stage 2: Validate (reuse catalog/validators)
    resolve.ts               # Stage 3: Dependency resolution
    transform.ts             # Stage 4: Transform — apply capability contracts
    emit.ts                  # Stage 5: Write to generated/runtime-assets/
  types.ts                   # CompilationContext, CompiledAssets, Asset types
  templates/
    renderer.ts              # Template rendering (Jinja2-like)
    helpers.ts               # Built-in template helpers

generated/                   # Generated outputs (gitignored)
  runtime-assets/
    codex/
    claude/
    copilot/
    gemini/
    antigravity/
```

---

## Tasks

### Task 1: Create compiler types and pipeline scaffolding

- [ ] Create `src/cli/compiler/types.ts` — define `CompilationContext`, `CompiledAssets`, `Asset`, `RecompileReason`
- [ ] Create `src/cli/compiler/pipeline.ts` — orchestrator that runs 5 stages in sequence
- [ ] Create `src/cli/compiler/stages/load.ts` — load catalog + selected adapter
- [ ] Write failing test: `compiler.test.ts` — compile() throws "not implemented"
- [ ] Run test: verify it fails with expected error
- [ ] Implement minimal pipeline stub that returns empty CompiledAssets
- [ ] Run tests: verify pipeline stub works
- [ ] Commit

### Task 2: Implement Transform stage

- [ ] Create `src/cli/compiler/templates/renderer.ts` — minimal Jinja2-like renderer with `{{ }}` interpolation, `{% for %}`, `{% if %}`
- [ ] Create `src/cli/compiler/templates/helpers.ts` — built-ins: `detect_packages`, `detect_patterns`, `npm_scripts`
- [ ] Implement `transform.ts` — for each module with a capability, generate outputs using adapter's capabilityProjection rules
- [ ] Write test: capability with template renders correctly
- [ ] Run test: verify rendering
- [ ] Commit

### Task 3: Implement Emit stage

- [ ] Implement `src/cli/compiler/stages/emit.ts` — write CompiledAssets to `generated/runtime-assets/<platform>/`
- [ ] Implement checksum calculation for each asset
- [ ] Write test: emit writes files and calculates checksums
- [ ] Run test: verify files written
- [ ] Commit

### Task 4: Implement Resolve stage (dependency ordering)

- [ ] Implement `src/cli/compiler/stages/resolve.ts` — topologically sort modules by dependencies
- [ ] Detect circular dependencies and error
- [ ] Write test: resolves correct order, detects cycles
- [ ] Run tests: verify
- [ ] Commit

### Task 5: Wire compiler into CLI

- [ ] Create `scripts/build-catalog.mjs` — runs full compilation for all platforms
- [ ] Add `cbx catalog build` command to CLI core
- [ ] Add `cbx catalog build --platform <id>` for single platform
- [ ] Run `cbx catalog build` and verify `generated/runtime-assets/` is populated
- [ ] Commit

---

## Verification

- `npm run test:cli` — all tests pass
- `cbx catalog build` — exits 0, generates assets for all 5 platforms
- `ls generated/runtime-assets/claude/` — contains generated files
- `npm run check` — CLI still works
