# Foundry V2 — CLI Subsystem Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan-by-task.

**Goal:** Split the 16k-line `src/cli/core.ts` into explicit subsystems, add new maintainer commands, and wire everything to the new catalog/compiler/installer/state systems.

---

## File Map

```
src/cli/
  core.ts                    # Slimmed CLI entry (imports subsystems)
  commands/
    catalog-commands.ts      # cbx catalog validate|build|audit|diff|status
    build-commands.ts        # cbx build architecture
    workflow-commands.ts     # cbx workflows install|remove|prune|sync (refactored)
    doctor-commands.ts       # cbx doctor (wires to doctor subsystem)
  subsystems/                # Subsystem wiring (each imports its domain)
    catalog.ts              # Wires catalog subsystem to commands
    compiler.ts             # Wires compiler subsystem to commands
    installer.ts            # Wires installer subsystem to commands
    state.ts                # Wires state subsystem to commands
    rules.ts                # Wires rules subsystem to commands
    doctor.ts               # Wires doctor subsystem to commands
    mcp.ts                  # Wires mcp subsystem to commands
  doctor/
    index.ts               # Public API: doctor(), healthCheck(), autoFix()
    checks.ts              # Individual check implementations
    reporter.ts            # Human-readable report formatting
  mcp/
    index.ts               # Wires MCP server configs
    manifest.ts            # Generate .mcp.json per platform
```

---

## Tasks

### Task 1: Extract doctor subsystem from core.ts

- [ ] Read `src/cli/core.ts` — find existing doctor/harness audit logic
- [ ] Create `src/cli/doctor/checks.ts` — implement 7 checks from the spec (state integrity, asset presence, catalog drift, user override audit, orphaned files, checksum, platform-specific)
- [ ] Create `src/cli/doctor/reporter.ts` — format DoctorReport as human-readable output
- [ ] Create `src/cli/doctor/index.ts` — doctor(), healthCheck(), autoFix()
- [ ] Write tests for doctor checks
- [ ] Commit

### Task 2: Extract mcp subsystem

- [ ] Read existing MCP-related code in core.ts
- [ ] Create `src/cli/mcp/manifest.ts` — generate .mcp.json from catalog's mcp-core module
- [ ] Create `src/cli/mcp/index.ts` — listCatalogServers, generateMcpManifest, applyMcpConfig
- [ ] Commit

### Task 3: Split core.ts into command modules

- [ ] Create `src/cli/commands/catalog-commands.ts` — `cbx catalog validate|build|audit|diff|status`
- [ ] Create `src/cli/commands/build-commands.ts` — `cbx build architecture`
- [ ] Refactor `src/cli/commands/workflow-commands.ts` — wire to new installer
- [ ] Refactor `src/cli/commands/doctor-commands.ts` — wire to new doctor subsystem
- [ ] Slim `src/cli/core.ts` — import and register all command modules
- [ ] Ensure `cbx --help` shows all new commands
- [ ] Run `cbx catalog validate` and `cbx catalog build` manually
- [ ] Commit

---

## Verification

- `npm run build:cli` — compiles without errors
- `cbx --help` — shows all commands including new `catalog *` and `build` commands
- `cbx catalog validate` — exits 0
- `cbx catalog build` — runs without errors
- `cbx doctor` — produces a health report
- `npm run test:cli` — all tests pass
