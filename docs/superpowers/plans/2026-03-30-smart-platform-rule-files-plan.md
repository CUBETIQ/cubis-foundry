# Smart Platform Rule Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current thin project rule files with smarter medium-sized Codex, Claude, and Gemini rule surfaces that align to the current Foundry taxonomy without reintroducing context bloat.

**Architecture:** Keep one shared conceptual structure across the three root rule files, but tailor execution, routing, and delegation notes to each platform. Preserve the managed workflow block and managed MCP block behavior instead of hand-inlining workflow catalogs.

**Tech Stack:** Markdown rule files, Foundry workflow sync, managed MCP rule block generation

---

### Task 1: Write the Smart Shared Structure

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `.gemini/GEMINI.md`
- Reference: `docs/superpowers/specs/2026-03-30-smart-platform-rule-files-design.md`

- [ ] **Step 1: Replace the current thin preambles with the approved smart-router structure**
- [ ] **Step 2: Add cognitive contract, route tree, Foundry surface hierarchy, skill loading, MCP contract, research escalation, and verification sections**
- [ ] **Step 3: Keep all wording aligned to current `v2` surfaces only**

### Task 2: Tailor Platform-Specific Execution Notes

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `.gemini/GEMINI.md`

- [ ] **Step 1: Codex file should emphasize root `AGENTS.md`, native `.codex/agents/*.toml`, sandbox-aware routing, and low-context loading**
- [ ] **Step 2: Claude file should emphasize `CLAUDE.md`, `Task`-tool delegation, and keeping deep scoped policy in `.claude/rules/*.md`**
- [ ] **Step 3: Gemini file should emphasize `.gemini/GEMINI.md`, command-first routing, and MCP-plus-command execution**

### Task 3: Preserve Managed Blocks

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `.gemini/GEMINI.md`

- [ ] **Step 1: Keep the auto-managed workflow routing block intact**
- [ ] **Step 2: Keep the managed MCP block in `AGENTS.md` and `.gemini/GEMINI.md`**
- [ ] **Step 3: Avoid hand-maintaining sections the tooling already owns**

### Task 4: Verify Rule Surfaces

**Files:**
- Verify: `AGENTS.md`
- Verify: `CLAUDE.md`
- Verify: `.gemini/GEMINI.md`

- [ ] **Step 1: Run `node dist/cli/index.js workflows doctor codex --scope project`**
- [ ] **Step 2: Run `node dist/cli/index.js workflows doctor claude --scope project`**
- [ ] **Step 3: Run `node dist/cli/index.js workflows doctor gemini --scope project`**
- [ ] **Step 4: Check `git status --short`**

