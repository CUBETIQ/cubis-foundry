# Foundry V2 — Comprehensive Product & Technical Specification

**Date:** 2026-03-25
**Status:** Draft v2
**Approach:** Middle-out, medium-grained modules, pipeline-based compiler, staged-diff installer

---

## Table of Contents

1. [Product Requirements Document (PRD)](#1-product-requirements-document-prd)
2. [Canonical Control Plane](#2-canonical-control-plane)
3. [Subsystem Architecture](#3-subsystem-architecture)
4. [Content System](#4-content-system)
   - 4.1 Capability-Based Skill Model
   - 4.2 Language Skills Enhancement
   - 4.3 Framework Skills Enhancement
   - 4.4 Custom Agents
   - 4.5 Workflows
   - 4.6 Design Stack
5. [Documentation System](#5-documentation-system)
   - 5.1 User Documentation
   - 5.2 Contributor Guide
   - 5.3 Runbooks
   - 5.4 Technical Reference
6. [Build Architect — AI-Actionable Foundation Docs](#6-build-architect--ai-actionable-foundation-docs)
7. [Online Research Integration](#7-online-research-integration)
8. [CLI Command Surface](#8-cli-command-surface)
9. [File Layout](#9-file-layout)
10. [Migration Path](#10-migration-path)
11. [Validation & Testing](#11-validation--testing)
12. [Open Questions](#12-open-questions)

---

## 1. Product Requirements Document (PRD)

### 1.1 Product Vision

**Foundry** is a unified AI agent environment installer that delivers consistent, high-quality skills, workflows, agents, and steering rules to development teams regardless of which AI runtime they use (Claude Code, Codex, Copilot, Gemini CLI, Antigravity).

The core problem Foundry solves: teams want to standardize how AI agents work in their codebase — same skills, same workflows, same guardrails — but different team members use different AI runtimes. Foundry makes that possible.

### 1.2 Target Users

**Primary:**
- Development teams using one or more AI agent runtimes
- Engineering managers establishing team-wide AI coding standards
- Individual developers who work across multiple AI runtimes

**Secondary:**
- AI agent runtime developers building platform integrations
- Tooling vendors creating Foundry-compatible packages

### 1.3 Problems Solved

| Problem | Today | With Foundry V2 |
|---------|-------|----------------|
| Skills drift out of sync across platforms | 64 skills, manually mirrored per platform | Canonical capabilities generate per-platform skills automatically |
| Upgrade is destructive | Overwrites user customizations | Staged-diff with user-override protection |
| No visibility into what changed on upgrade | Silent file replacement | Diff-aware upgrade with explicit change list |
| UI testing and orchestration skills are bloated | Multiple overlapping skills | Capability-backed with explicit runtime contracts |
| Design skills fragmented | 6 design-* skills scattered | Single design capability with preset modes |
| Foundation docs are prose, not AI-actionable | Static templates | Generated, project-aware, managed sections |
| Rules are template stamps | Dumb injection | Smart rules with scope, condition, action, priority |

### 1.4 Success Metrics

- **Time to onboard a new developer** with full AI environment: < 5 minutes (`cbx init`)
- **Upgrade safety**: Zero silent user-override losses across all upgrade cycles
- **Skill parity**: All canonical capabilities generate valid outputs for all 5 platforms
- **Content freshness**: Language/framework skills updated within 30 days of major version releases
- **Build performance**: Full `cbx catalog build` completes in < 30 seconds for all 5 platforms
- **Doctor accuracy**: `cbx doctor` detects drift within 1 second of invocation

### 1.5 Product Principles

1. **Canonical sources own truth** — Generated assets are always derived, never authored
2. **User steering is sacred** — No silent overrides of user-authored files, rules, or configs
3. **Content quality over quantity** — ~20-25 capabilities instead of 64+ loosely related skills
4. **AI-context docs are first-class outputs** — TECH.md, ARCHITECTURE.md, STRUCTURE.md are generated, versioned, and tested
5. **Opinionated where it matters** — FastAPI gets Pydantic v2 guidance, not generic Python tips
6. **Migration is incremental** — V1 compatibility bridge, no big-bang rewrite

---

## 2. Canonical Control Plane

### 2.1 `foundry/package.yaml`

Repo-wide metadata. Lives at repo root.

```yaml
# foundry/package.yaml
schemaVersion: 1
version: 1.0.0
name: foundry
description: Unified AI agent environment installer

supportedRuntimes:
  - id: codex
    label: OpenAI Codex
    since: 1.0.0
  - id: claude
    label: Anthropic Claude Code
    since: 1.0.0
  - id: copilot
    label: GitHub Copilot
    since: 1.0.0
  - id: gemini
    label: Google Gemini CLI
    since: 1.0.0
  - id: antigravity
    label: Antigravity (Gemini)
    since: 1.0.0

installProfiles:
  - id: core
    label: Core
    description: Minimal install for quick setup
    modules: [rules-core, agents-core, context-core]
  - id: developer
    label: Developer
    description: Full developer workflow
    modules: [rules-core, agents-core, workflows-core, skills-core, contexts-core, mcp-core]
  - id: security
    label: Security
    description: Security-focused install
    modules: [rules-core, rules-security, agents-core, contexts-core]
  - id: research
    label: Research
    description: Research and prototyping
    modules: [rules-core, agents-core, research-core]

installComponents:
  - id: rules-core
    label: Core Rules
    description: Steering rules for all platforms
  - id: rules-security
    label: Security Rules
    description: Additional security-focused steering
  - id: agents-core
    label: Core Agents
    description: Shared agent workflows
  - id: workflows-core
    label: Workflows
    description: Common workflow definitions
  - id: skills-core
    label: Skills
    description: Skill catalog
  - id: contexts-core
    label: Context Docs
    description: AI-context documents (TECH.md, ARCHITECTURE.md, etc.)
  - id: mcp-core
    label: MCP Servers
    description: MCP server configurations
  - id: research-core
    label: Research Capabilities
    description: Research-oriented skills and workflows

buildOutputs:
  runtimeAssets: generated/runtime-assets
  cliDist: dist/cli
  docs: docs/generated
```

### 2.2 `foundry/modules/<id>/module.yaml`

Each first-class unit of installable content. Located at `foundry/modules/<id>/module.yaml`.

**Module kinds:**
- `capability` — A capability contract; generates platform-specific skills/rules/workflows at build time
- `skill` — A direct-port of an existing SKILL.md; kept for compatibility
- `rule-pack` — A set of steering rules
- `workflow` — A named workflow
- `specialist` — A specialist agent
- `compat-alias` — A routing shim (e.g., `stitch`)

```yaml
# foundry/modules/design/module.yaml
id: design
kind: capability
label: Design System
description: UI design, typography, color, and layout guidance

dependencies:
  - frontend-foundations

profiles:
  - developer
  - research

capability:
  type: stack
  domains: [design, ui, frontend]
  outputs:
    - type: skill
      path: generated/skills/design.md
      platforms: [codex, claude, copilot, gemini, antigravity]
    - type: rules
      path: generated/rules/design.yaml
      platforms: [codex, claude, copilot, gemini, antigravity]

tests:
  - id: design-quality
    description: Design output passes quality assertions
    coverage: [typography, color-contrast, layout]

stability: stable

routeHints:
  - design
  - ui
  - css
  - typography
  - color
```

### 2.3 `foundry/adapters/<platform>.yaml`

Projection rules per platform in a YAML DSL. Lives at `foundry/adapters/<platform>.yaml`.

```yaml
# foundry/adapters/claude.yaml
platform: claude
label: Claude Code

rules:
  mergeStrategy: layered
  userOverride: honor
  conflictResolution: user-first
  generate:
    type: skill-merge
    source: foundry/modules/rules-core/rules.yaml
    output: .claude/rules.d/rules.yaml

skills:
  projection:
    type: markdown-transform
    transforms:
      - match: "**/*.md"
        pipeline:
          - filter: code-blocks
          - map: frontmatter
          - merge: capability
  capabilityProjection:
    - capability: design
      output: .claude/skills/design.md
      template: claude-skill.j2

workflows:
  projection:
    - source: foundry/modules/workflows/core.yaml
      output: .claude/workflows/core.yaml
      transform: claude-workflow-v1

specialists:
  projection:
    - source: foundry/modules/specialists/*.md
      output: .claude/specialists/
      naming: "{{ id }}.md"

contextDocs:
  enabled: true
  outputDir: docs/foundation
  managedSections: true
  markers:
    prefix: "<!-- cbx:"
    suffix: "-->"
  templates:
    - id: tech-md
      source: foundry/modules/contexts-core/templates/tech.md.j2
      output: docs/foundation/TECH.md
      triggers: [init, sync, build]
```

---

## 3. Subsystem Architecture

### 3.1 `src/cli/catalog/`

**Responsibility:** Reads and validates the canonical control plane (package.yaml, module.yaml, adapter.yaml). Enforces schema and cross-module consistency.

**Public API:**
```typescript
function loadCatalog(root: string): Promise<Catalog>
function validateModule(modulePath: string): ValidationResult
function validateCatalog(catalog: Catalog): CatalogValidationResult
function resolveModule(catalog: Catalog, id: string): Module | null
function resolveProfile(catalog: Catalog, profileId: string): Profile | null
```

### 3.2 `src/cli/compiler/`

**Responsibility:** Transforms canonical sources into platform-specific runtime assets using a pipeline architecture.

**Pipeline stages:** Load → Validate → Resolve → Transform → Emit

**Public API:**
```typescript
async function compile(catalog: Catalog, platform: string): Promise<CompilationResult>
async function compileModule(module: Module, adapter: Adapter, context: CompilationContext): Promise<CompiledAssets>
async function needsRecompile(catalog: Catalog, platform: string, previousState: InstallState): Promise<RecompileReason[]>
```

### 3.3 `src/cli/installer/`

**Responsibility:** Applies compiled assets using staged-diff. Handles install, upgrade, and removal.

**Key design: Staged-diff with user-override protection**

1. **Stage** — Write generated assets to a staging directory
2. **Diff** — Compare staging against current user environment
3. **Conflict detection** — Flag files that differ from generated
4. **Apply** — Merge staging, honoring user overrides
5. **Log** — Record applied assets in install state

**User override protection:**
- Any file with `.user` suffix is never overwritten
- Files in `~/.foundry/user-rules/` are merged, not replaced
- A `~/.foundry/rules.preferences.yaml` tracks user-authored rule snippets

### 3.4 `src/cli/rules/`

**Responsibility:** Manages steering rule authoring, smart rule application, and user-rule protection.

Rules are no longer simple template stamps. Each rule has:
- **Scope** — What file types/paths it applies to
- **Condition** — When to inject (e.g., "whenever a test file is created")
- **Action** — What to inject or modify
- **Priority** — Lower = applied first, user rules always win
- **User-overridable flag** — Whether users can customize this rule

### 3.5 `src/cli/state/`

**Responsibility:** Manages compiled-install state per platform. Reads/writes `~/.foundry/state/<platform>.json`.

### 3.6 `src/cli/doctor/`

**Responsibility:** Validates installed environment against catalog and state.

**Doctor checks:**
1. State integrity
2. Asset presence
3. Catalog drift
4. User override audit
5. Orphaned files
6. Checksum validation
7. Platform-specific checks

### 3.7 `src/cli/mcp/`

**Responsibility:** Manages MCP server configurations from catalog definitions.

---

## 4. Content System

### 4.1 Capability-Based Skill Model

Instead of 64+ individual skill directories, canonical skills are organized as **capabilities**:

```
foundry/modules/
  design/
    module.yaml          # Capability contract
    SKILL.md             # Canonical skill prose
    templates/           # Platform-specific templates
      claude-skill.j2
      codex-skill.j2
    rules/
      design-rules.yaml
  frontend-foundations/
    module.yaml
    SKILL.md
    templates/
  api-design/
    module.yaml
    SKILL.md
  ...
```

**Skill Rationalization:**

| Action | Skills Affected | New Structure |
|--------|-----------------|---------------|
| Merge | `design-arrange`, `design-bolder`, `design-distill`, `design-polish`, `design-typeset` | Single `design` capability with preset modes |
| Demote | `stitch` | `compat-alias` only, removed from default profiles |
| Merge | `playwright-web-qa`, `flutter-mobile-qa`, `ui-testing-harness` | `qa` capability with platform-specific runners |
| Keep | All language skills | Enhanced with online research integration |
| Keep | All framework skills | Enhanced with online research integration |

**Target: ~20-25 canonical capabilities**

### 4.2 Language Skills Enhancement

Language skills (Python, TypeScript, Go, Rust, Java, Kotlin, C#, Swift, etc.) are enhanced with:

**Mandatory per skill:**
- **Version-aware guidance** — Skills explicitly declare which versions they cover, with guidance on version-specific patterns
- **Evals with coverage expectations** — Each skill has test assertions covering critical patterns
- **Online research integration** — Skills pull latest best practices from authoritative sources (official docs, language blogs, RFCs)
- **Anti-pattern catalog** — Explicit "never do this" patterns with rationale

**Enhanced skill structure:**
```
foundry/modules/python/
  module.yaml
  SKILL.md              # Canonical guidance (version-aware)
  evals/
    assertions.md       # Test assertions
    evals.json          # Eval scenarios
  references/
    python312-whatsnew.md
    typing-guide.md
    async-patterns.md
  templates/
    claude-python.j2
```

**Language skills to enhance:**

| Skill | Coverage Gap Today | Enhancement Goal |
|-------|-------------------|------------------|
| `python-best-practices` | Generic Python tips, not 3.12+ | Focus on 3.12+ patterns, async, type safety |
| `typescript-best-practices` | Pre-TypeScript 5.x | TypeScript 5.x decorators, generics, performance |
| `golang-best-practices` | Pre-1.21 | Go 1.21+ structured logging, generics, range loop |
| `rust-best-practices` | Pre-edition-2024 | Rust 2024 edition, async traits, borrow checker |
| `java-best-practices` | Pre-Java 21 | Java 21 virtual threads, pattern matching |
| `kotlin-best-practices` | Pre-Kotlin 2.0 | Kotlin 2.0, K2 compiler, multiplatform |
| `csharp-best-practices` | Pre-C# 12 | C# 12 primary constructors, record types |
| `swift-best-practices` | Pre-Swift 6 | Swift 6 concurrency, typed throws |

### 4.3 Framework Skills Enhancement

Framework skills are enhanced to be **opinionated and version-aware**:

**Enhanced framework skills:**

| Framework | Key Enhancement |
|-----------|-----------------|
| `fastapi` | Already strong — maintain Pydantic v2, async patterns, OpenAPI fidelity |
| `nestjs` | Add GraphQL support, microservices patterns, guards/interceptors |
| `nextjs` | App Router, Server Components, streaming, caching strategies |
| `svelte-sveltekit` | Svelte 5 runes, SvelteKit 2.x patterns |
| `django-drf` | Async support, Pydantic v2 integration, background tasks |
| `spring-boot` | Java 21 patterns, virtual threads, GraalVM native image |
| `flutter-mobile-qa` | Merge into `qa` capability, platform-specific runners |
| `prisma` | v6 support, edge drivers, connection pooling |
| `sqlalchemy` | 2.0 async patterns, SQL expression API |

### 4.4 Custom Agents

The current agents (orchestrator, planner, implementer, reviewer, debugger, tester, explorer) are enhanced:

**Enhanced agent structure:**
```
foundry/modules/agents/
  orchestrator/
    module.yaml
    SKILL.md              # Agent prompt and coordination protocol
    templates/
      claude-orchestrator.j2
  planner/
    module.yaml
    SKILL.md
  ...
```

**Orchestrator enhancements:**
- Better task decomposition with explicit exit criteria
- Improved agent handoff protocol with context passing
- Skill loading contract — when to load skills vs. direct implementation
- Loop detection — when to escalate vs. continue iterating
- Memory management — how to use project memory during orchestration

**Specialist agent enhancements:**
- Each specialist has explicit capability contracts
- Handoff prompts are structured, not freeform
- Specialists can call sub-specialists when appropriate
- Eval coverage per specialist agent

### 4.5 Workflows

Current workflows (plan, implement, review, debug, loop, deploy, test, design-*, mobile-qa, web-qa, ui-testing) are restructured:

**Workflow structure:**
```
foundry/modules/workflows/
  plan/
    module.yaml
    SKILL.md
    templates/
  implement/
    module.yaml
    SKILL.md
    templates/
  ...
```

**Workflow enhancements:**
- Each workflow has explicit input/output contracts
- Steps are versioned with expected outputs
- Error recovery paths are documented
- Eval assertions for workflow completion
- Design workflows merged into single `design` capability with modes

### 4.6 Design Stack

The 6 design-* skills (`design-arrange`, `design-bolder`, `design-distill`, `design-polish`, `design-typeset`, `design-audit`) are merged into a single `design` capability:

**Design capability with preset modes:**

```yaml
# foundry/modules/design/module.yaml
id: design
kind: capability
capability:
  type: stack
  domains: [design, ui, frontend]
  modes:
    - id: arrange
      description: Layout and spatial organization
      triggers: [layout, arrangement, positioning]
    - id: bolder
      description: Visual weight and emphasis
      triggers: [contrast, hierarchy, bold]
    - id: distill
      description: Simplification and clarity
      triggers: [simplify, clarify, reduce]
    - id: polish
      description: Refinement and finishing
      triggers: [polish, finish, refine]
    - id: typeset
      description: Typography and spacing
      triggers: [typography, font, spacing]
    - id: audit
      description: Design quality review
      triggers: [review, audit, critique]
```

---

## 5. Documentation System

### 5.1 User Documentation

**User docs structure:**
```
docs/
  user/
    getting-started.md       # Quick start guide
    install-profiles.md      # Profile comparison (core, developer, security, research)
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
    troubleshooting.md       # Common issues and fixes
    faq.md
```

**Key topics:**
- How to use `cbx init` to set up a new project
- How to choose an install profile
- How to install specific capabilities
- How to upgrade safely without losing customizations
- How to run `cbx doctor` to diagnose issues
- How to use `cbx build architecture` to generate foundation docs
- How to customize rules without breaking upgrades

### 5.2 Contributor Guide

**Contributor docs structure:**
```
docs/
  contributor/
    getting-started.md       # Dev environment setup
    adding-module.md        # How to add a new capability/skill
    adding-platform.md       # How to add a new platform adapter
    skill-authoring.md      # How to write a good SKILL.md
    workflow-authoring.md    # How to create a workflow
    agent-authoring.md      # How to create a specialist agent
    rule-authoring.md       # How to write smart rules
    testing.md              # How to test changes
    release-process.md      # How to cut a release
    coding-standards.md     # TypeScript, YAML, Jinja2 conventions
```

**Key topics:**
- How to create a new module (capability, skill, workflow, agent)
- How to write effective skill guidance with version awareness
- How to add eval assertions to a skill
- How to write a platform adapter
- How to add templates for a new platform
- How to test the compiler pipeline locally
- How to run the full validation suite
- How to cut a release and publish to npm

### 5.3 Runbooks

**Runbook structure:**
```
docs/
  runbooks/
    release.md              # Release process
    hotfix.md               # Emergency hotfix process
    incident-response.md    # What to do when a user reports data loss
    skill-update.md         # How to update a skill after a framework release
    platform-migration.md   # How to migrate when a platform changes its API
    audit-failure.md        # What to do when cbx doctor finds issues
```

**Key runbooks:**
- **Release process** — Step-by-step for cutting a Foundry release
- **Hotfix process** — Emergency fixes without breaking upgrades
- **Incident response** — What to do when a user reports an issue
- **Skill update** — How to update a language/framework skill after a major release
- **Platform migration** — How to handle breaking changes in platform APIs

### 5.4 Technical Reference

**Tech ref structure:**
```
docs/
  tech/
    schemas/
      package-yaml.md       # foundry/package.yaml schema
      module-yaml.md        # foundry/modules/<id>/module.yaml schema
      adapter-yaml.md       # foundry/adapters/<platform>.yaml schema
      install-state.md      # ~/.foundry/state/<platform>.json schema
    apis/
      catalog-api.md        # catalog subsystem public API
      compiler-api.md       # compiler subsystem public API
      installer-api.md      # installer subsystem public API
      rules-api.md          # rules subsystem public API
      state-api.md          # state subsystem public API
      doctor-api.md         # doctor subsystem public API
      mcp-api.md            # mcp subsystem public API
    cli-reference.md        # Full CLI command reference
    build-pipeline.md      # How the compilation pipeline works
    install-flow.md         # How install/upgrade/remove works
    skill-format.md         # SKILL.md format reference
    eval-format.md          # Eval assertions format
    rule-format.md         # Smart rule format
```

---

## 6. Build Architect — AI-Actionable Foundation Docs

### 6.1 What It Does

The existing `cbx build architecture` generates skeleton files. V2 makes these **AI-actionable documents** that genuinely help an AI agent understand and work in the project.

### 6.2 Generated Documents

After `cbx init` or `cbx build architecture`, the following are generated from templates + project context:

| File | Purpose | AI Agent Use |
|------|---------|--------------|
| `docs/foundation/TECH.md` | Tech stack, tooling, patterns | "What tools does this project use?" |
| `docs/foundation/ARCHITECTURE.md` | System structure, key decisions | "How is this codebase organized?" |
| `docs/foundation/STRUCTURE.md` | Directory layout, ownership | "Where should I put this file?" |
| `docs/foundation/MEMORY.md` | Project memories, decisions | "What does this team care about?" |
| `docs/foundation/PRODUCT.md` | Product context, goals | "What is this project trying to achieve?" |

### 6.3 Template System

Templates live in `foundry/modules/contexts-core/templates/` and use project context:

```jinja2
# TECH.md template
# docs/foundation/TECH.md

{{~ for package in detected_packages ~}}
- **{{ package.name }}**: {{ package.version }} ({{ package.purpose }})
{{~ end ~}}

## Build Commands

{{~ for script in npm_scripts ~}}
- `{{ script.name }}`: {{ script.description }}
{{~ end ~}}

## Code Patterns

{{~ for pattern in detected_patterns ~}}
- {{ pattern }}
{{~ end ~}}
```

### 6.4 Managed Sections

Documents use comment-based managed sections:

```
# TECH.md

<!-- cbx:tech:stack:start version=1 -->
[Generated content here]
<!-- cbx:tech:stack:end -->

<!-- cbx:tech:commands:start version=1 -->
[Generated content here]
<!-- cbx:tech:commands:end -->
```

User content **outside** managed sections is preserved. Only managed sections are overwritten on re-generation.

---

## 7. Online Research Integration

### 7.1 Research Strategy

Skills and workflows are enhanced through **periodic research** rather than real-time fetching (to avoid latency, API costs, and external dependencies at runtime).

**Two modes:**

1. **Manual review** (v1) — Contributors update skill references after major releases
2. **Automated research pipeline** (v2 goal) — A scheduled job fetches latest docs, compares with current skill content, and opens PRs for significant changes

### 7.2 Research Pipeline (v2 Goal)

```
.github/
  workflows/
    research.yml        # Scheduled: monthly or after major release
```

**Pipeline steps:**
1. Monitor official documentation sources (Python docs, TypeScript changelog, framework blogs)
2. Fetch release notes for tracked versions
3. Compare against current SKILL.md content
4. Generate diff summary
5. Open PR if significant changes detected (>10% content change or new patterns)

### 7.3 Authoritative Sources

Each language/framework skill declares its authoritative sources:

```yaml
# foundry/modules/python/module.yaml
researchSources:
  - name: Python Documentation
    url: https://docs.python.org/3/
    coverage: [language-reference, tutorial, library-reference]
  - name: Python Release Notes
    url: https://docs.python.org/3/whatsnew/
    coverage: [version-changelog]
  - name: Real Python
    url: https://realpython.com/
    coverage: [tutorials, best-practices]
```

### 7.4 Research Integration Points

| Content Type | Research Integration | Update Frequency |
|--------------|---------------------|------------------|
| Language skills | Major version releases | Within 30 days of release |
| Framework skills | Major/minor releases | Within 30 days of release |
| Tool skills | Breaking changes | On-demand |
| Design system | Trend shifts | Quarterly review |
| Eval assertions | Pattern drift | On-demand |

---

## 8. CLI Command Surface

### 8.1 Preserved End-User Commands

```
cbx init                        # Initialize workspace with foundation docs
cbx workflows install <name>     # Install a workflow/module
cbx workflows remove <name>     # Remove a workflow/module
cbx workflows prune-skills      # Remove untracked skill mirrors
cbx workflows sync-rules        # Re-sync rules from catalog
cbx doctor                       # Run environment health check
```

### 8.2 New Maintainer Commands

```
cbx catalog validate             # Validate foundry/package.yaml and all modules
cbx catalog build                # Run full compilation (generate/runtime-assets)
cbx catalog build --platform claude  # Compile for specific platform
cbx catalog audit --skills       # Audit skill parity across platforms
cbx catalog diff --platform claude   # Show diff between canonical and installed
cbx catalog status               # Show catalog version, installed modules
```

### 8.3 Build Architect Commands

```
cbx build architecture              # Generate/update all foundation docs
cbx build architecture --platform claude  # Platform-specific foundation
cbx build architecture --doc TECH.md      # Generate specific doc
```

---

## 9. File Layout

```
foundry/                    # NEW: Canonical control plane (in repo)
  package.yaml              # Repo-wide metadata
  modules/                  # All first-class modules
    <id>/
      module.yaml           # Module descriptor
      SKILL.md              # Canonical skill prose (if applicable)
      templates/            # Platform-specific templates
        <platform>.j2
      rules/                # Rule definitions
        *.yaml
      tests/                # Test specs
        *.test.yaml
      evals/                # Eval assertions
      references/           # Reference docs
  adapters/                 # Platform projection rules
    <platform>.yaml
  templates/                # Shared templates (context docs, etc.)
    contexts-core/

generated/                 # Generated assets (NOT in source tree)
  runtime-assets/
    codex/
    claude/
    copilot/
    gemini/
    antigravity/
  docs/
    foundation/

src/cli/
  catalog/                  # Catalog loading and validation
  compiler/                 # Pipeline-based asset compilation
  installer/                # Staged-diff installer
  rules/                   # Smart rules engine
  state/                   # Per-platform install state
  doctor/                  # Environment health checks
  mcp/                     # MCP server management
  build/                   # Build architect commands
  init/                    # Init command
  core.ts                  # CLI entry (remainder after subsystem split)

dist/cli/                  # Compiled CLI output

docs/
  user/                    # User documentation
  contributor/             # Contributor guide
  runbooks/                 # Operational runbooks
  tech/                    # Technical reference
    schemas/               # YAML/JSON schemas
    apis/                  # Subsystem APIs

.github/
  workflows/
    research.yml           # Scheduled research pipeline
```

---

## 10. Migration Path

### Phase 1: Control Plane Bootstrap
- Create `foundry/package.yaml`, `foundry/modules/`, `foundry/adapters/`
- Write YAML schemas for module.yaml and adapter.yaml
- Implement `catalog/` subsystem (load + validate)
- Run catalog validate alongside existing generate script

### Phase 2: Compiler Pipeline
- Implement `compiler/` pipeline
- Port first 3-5 capabilities as canonical modules
- Generate assets to `generated/runtime-assets/` (parallel to existing)
- Validate generated outputs match existing platform mirrors

### Phase 3: Capability Migration
- Migrate all skills to capability model
- Remove design-* duplicates, consolidate
- Remove checked-in platform mirrors from source tree

### Phase 4: Installer + State
- Implement `installer/` with staged-diff
- Implement `state/` per-platform JSON state
- Wire `cbx install/remove` to new installer
- Ensure user-override protection works

### Phase 5: CLI Subsystem Split
- Split `core.ts` into explicit subsystem modules
- Add new maintainer commands (`cbx catalog *`)
- Update `cbx build architecture` to generate AI-actionable docs

### Phase 6: Documentation System
- Write user documentation
- Write contributor guide
- Write runbooks
- Write technical reference

---

## 11. Validation & Testing

### 11.1 Schema Validation
- Every `module.yaml` validates against JSON Schema
- Every `adapter.yaml` validates against JSON Schema
- Every `package.yaml` validates against JSON Schema
- Install state JSON files validate against schema

### 11.2 Golden File Tests
- For each platform, generated output is compared against golden files
- If a capability's output changes, golden files are updated via `--update-golden`
- PRs require golden file updates to be reviewed separately

### 11.3 Installer Tests
Per platform:
- **Apply** — Fresh install produces correct files with correct checksums
- **Upgrade** — Upgrading preserves user overrides, applies new assets
- **Remove** — Removing uninstalls all assets, leaves user files intact
- **Doctor** — Doctor correctly identifies drift, missing files, conflicts

### 11.4 User Override Tests
- User-created `.user` files are never overwritten
- User rules in `~/.foundry/user-rules/` are merged, not replaced
- `rules.preferences.yaml` correctly tracks user-authored snippets

### 11.5 Capability Contract Tests
- Each capability's declared outputs are generated
- Outputs pass capability-specific assertions
- Eval assertions in `evals/assertions.md` pass against generated content

---

## 12. Open Questions (Resolved)

1. **V1 compatibility bridge** — **Decision: No bridge.** Complete migration to V2. The old `workflows/` sources are deprecated and removed in Phase 3. No dual-maintenance period.

2. **Research pipeline** — **Decision: Automated pipeline.** Implement the monthly research workflow in `.github/workflows/research.yml`. Manual review is insufficient given the scope of language/framework coverage. Pipeline opens PRs when significant changes detected.

3. **Eval schedule** — **Decision: CI on every PR for changed capabilities.** Evals run in CI on affected capabilities only (detected via git diff). Full eval suite runs weekly on a schedule.
