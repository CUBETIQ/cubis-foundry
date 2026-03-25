# Foundry V2 — Unified Control Plane Design

**Date:** 2026-03-25
**Status:** Draft
**Approach:** Middle-out, medium-grained modules, pipeline-based compiler, staged-diff installer

---

## 1. Overview

Foundry V2 replaces the split source-of-truth model (canonical sources + checked-in platform mirrors) with a single repo-local canonical control plane that generates runtime assets for five active platforms: **codex, claude, copilot, gemini, antigravity**.

The design is organized around seven explicit subsystems, a YAML-based capability module system, and a build-time generation model that keeps platform mirrors out of the source tree.

**Guiding principles:**
- Canonical sources own truth; generated assets are derived
- No override of user steering files (rules, prompts, configs)
- Capability contracts replace skill enumeration
- AI-context docs (TECH.md, ARCHITECTURE.md, etc.) are generated artifacts, not prose
- Installer uses staged-diff for safe, diff-aware upgrades and removals

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

# Dependencies on other modules
dependencies:
  - frontend-foundations

# Which profiles include this
profiles:
  - developer
  - research

# Capability contract — defines what this module promises to deliver
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

# Test expectations
tests:
  - id: design-quality
    description: Design output passes quality assertions
    coverage: [typography, color-contrast, layout]

# Stability
stability: stable

# Route hints for the agent
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

# Rule application: how rules files are merged
rules:
  mergeStrategy: layered  # layered = user rules win, then profile rules, then core
  userOverride: honor     # never override user-authored steering files
  conflictResolution: user-first

  # Rule file generation
  generate:
    type: skill-merge
    source: foundry/modules/rules-core/rules.yaml
    output: .claude/rules.d/rules.yaml

# Skill projection: how canonical SKILL.md maps to platform skill files
skills:
  projection:
    type: markdown-transform
    transforms:
      - match: "**/*.md"
        pipeline:
          - filter: code-blocks  # remove code blocks not relevant to platform
          - map: frontmatter     # extract and update frontmatter
          - merge: capability    # merge with module.yaml capability data

  # Capability-to-skill generation
  capabilityProjection:
    - capability: design
      output: .claude/skills/design.md
      template: claude-skill.j2
    - capability: frontend-foundations
      output: .claude/skills/frontend-foundations.md

# Workflow projection
workflows:
  projection:
    - source: foundry/modules/workflows/core.yaml
      output: .claude/workflows/core.yaml
      transform: claude-workflow-v1

# Specialist projection
specialists:
  projection:
    - source: foundry/modules/specialists/*.md
      output: .claude/specialists/
      naming: "{{ id }}.md"

# Context doc generation (TECH.md, ARCHITECTURE.md, etc.)
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
    - id: architecture-md
      source: foundry/modules/contexts-core/templates/architecture.md.j2
      output: docs/foundation/ARCHITECTURE.md
      triggers: [init, sync, build]
    - id: structure-md
      source: foundry/modules/contexts-core/templates/structure.md.j2
      output: docs/foundation/STRUCTURE.md
      triggers: [init, sync]
```

---

## 3. Subsystem Architecture

### 3.1 `src/cli/catalog/`

**Responsibility:** Reads and validates the canonical control plane (package.yaml, module.yaml, adapter.yaml). Enforces schema and cross-module consistency.

**Public API:**
```typescript
// Load all modules
function loadCatalog(root: string): Promise<Catalog>

// Validate a single module
function validateModule(modulePath: string): ValidationResult

// Validate all modules and adapters
function validateCatalog(catalog: Catalog): CatalogValidationResult

// Resolve module by id
function resolveModule(catalog: Catalog, id: string): Module | null

// Get install profile by id
function resolveProfile(catalog: Catalog, profileId: string): Profile | null
```

**Key types:**
```typescript
interface Catalog {
  package: PackageManifest
  modules: Map<string, Module>
  adapters: Map<string, Adapter>
  schemaVersion: number
}

interface Module {
  id: string
  kind: 'capability' | 'skill' | 'rule-pack' | 'workflow' | 'specialist' | 'compat-alias'
  label: string
  description: string
  dependencies: string[]
  profiles: string[]
  stability: 'experimental' | 'beta' | 'stable' | 'deprecated'
  capability?: CapabilityContract
  source: string  // path to SKILL.md or canonical source
  tests?: TestSpec[]
  routeHints?: string[]
}

interface Adapter {
  platform: string
  rules: RulesConfig
  skills: SkillsProjection
  workflows: WorkflowProjection
  specialists: SpecialistProjection
  contextDocs: ContextDocsConfig
}
```

---

### 3.2 `src/cli/compiler/`

**Responsibility:** Transforms canonical sources into platform-specific runtime assets using a pipeline architecture. Generates assets into `generated/runtime-assets/<platform>/`.

**Pipeline stages:**

1. **Load** — Read canonical sources (catalog, modules, adapters)
2. **Validate** — Schema and cross-reference validation
3. **Resolve** — Dependency resolution across modules
4. **Transform** — Apply capability contracts, generate platform-specific content
5. **Emit** — Write to `generated/runtime-assets/<platform>/`

**Public API:**
```typescript
// Run full compilation
async function compile(catalog: Catalog, platform: string): Promise<CompilationResult>

// Compile single module for a platform
async function compileModule(
  module: Module,
  adapter: Adapter,
  context: CompilationContext
): Promise<CompiledAssets>

// Check if regeneration is needed
async function needsRecompile(
  catalog: Catalog,
  platform: string,
  previousState: InstallState
): Promise<RecompileReason[]>
```

**Key types:**
```typescript
interface CompilationContext {
  platform: string
  catalog: Catalog
  capabilities: Map<string, CompiledCapability>
  timestamps: Map<string, Date>
}

interface CompiledAssets {
  rules: Asset[]
  skills: Asset[]
  workflows: Asset[]
  specialists: Asset[]
  contextDocs: Asset[]
}

interface Asset {
  path: string
  content: string | Buffer
  checksum: string
  platform: string
  moduleId: string
  generatedAt: Date
}
```

---

### 3.3 `src/cli/installer/`

**Responsibility:** Applies compiled assets to user environments using staged-diff. Handles install, upgrade, and removal.

**Key design: Staged-diff with user-override protection**

1. **Stage** — Write generated assets to a staging directory
2. **Diff** — Compare staging against current user environment
3. **Conflict detection** — Flag any file that exists in user environment but differs from generated
4. **Apply** — Merge staging into user environment, honoring user overrides
5. **Log** — Record what was applied in install state

**User override protection:**
- Any file with `.user` suffix is never overwritten
- Files in `~/.foundry/user-rules/` are merged, not replaced
- A `~/.foundry/rules.preferences.yaml` tracks user-authored rule snippets
- During upgrade, if a generated rule would override a user preference, the installer emits a warning and skips

**Public API:**
```typescript
// Apply install
async function applyInstall(
  assets: CompiledAssets,
  target: InstallTarget,
  options: ApplyOptions
): Promise<InstallResult>

// Dry-run apply
async function previewInstall(
  assets: CompiledAssets,
  target: InstallTarget
): Promise<DiffReport>

// Upgrade check
async function checkUpgrade(
  currentState: InstallState,
  newAssets: CompiledAssets
): Promise<UpgradeReport>

// Remove
async function removeInstall(
  state: InstallState,
  target: InstallTarget
): Promise<RemoveResult>

// Doctor
async function doctor(target: InstallTarget): Promise<DoctorReport>
```

**Install state (`~/.foundry/state/<platform>.json`):**
```typescript
interface InstallState {
  schemaVersion: 1
  platform: string
  appliedAt: Date
  appliedCatalogVersion: string
  appliedProfile: string
  appliedModules: string[]
  installedAssets: InstalledAsset[]
  userOverrides: string[]  // files explicitly marked as user-controlled
  orphanedFiles: string[]  // files from previous installs, no longer in catalog
}

interface InstalledAsset {
  path: string
  checksum: string
  moduleId: string
  assetType: 'rules' | 'skills' | 'workflows' | 'specialists' | 'contextDocs'
  appliedAt: Date
}
```

---

### 3.4 `src/cli/rules/`

**Responsibility:** Manages steering rule authoring, smart rule application, and user-rule protection.

**Smart rules system:**

Rules are no longer simple template stamps. Each rule has:
- **Scope** — What file types/paths it applies to
- **Condition** — When to inject (e.g., "whenever a test file is created")
- **Action** — What to inject or modify
- **Priority** — Lower = applied first, user rules have highest priority
- **User-overridable flag** — Whether users can customize this rule

**Rule file structure:**
```yaml
# Example: foundry/modules/rules-core/rules/platform-welcome.yaml
id: platform-welcome
platform: claude
scope:
  - CLAUDE.md
  - .claude/commands.md
condition:
  type: file-present
  paths: [CLAUDE.md]
action:
  type: prepend-content
  content: |
    # Welcome
    ...
priority: 100
userOverrideable: true
```

**Rule application in installer:**
1. Load all applicable rules for the platform
2. Sort by priority (user rules always last)
3. Apply staged rules, skipping any user-overridden scope
4. Merge rather than replace where possible

**Public API:**
```typescript
// Load rules for a platform
function loadRules(catalog: Catalog, platform: string): Rule[]

// Merge user rules with generated rules
function mergeRules(generated: Rule[], user: Rule[]): Rule[]

// Check if a rule is user-overridden
function isUserOverridden(rule: Rule, userOverrides: string[]): boolean

// Compile rules into platform-specific rule files
function compileRules(rules: Rule[], platform: string): CompiledRuleFile[]
```

---

### 3.5 `src/cli/state/`

**Responsibility:** Manages compiled-install state per platform. Reads/writes `~/.foundry/state/<platform>.json`.

**Design: JSON per platform in `~/.foundry/state/`**

- `~/.foundry/state/codex.json`
- `~/.foundry/state/claude.json`
- `~/.foundry/state/gemini.json`
- etc.

Each file is independent, matching the per-platform nature of Foundry.

**State operations:**
```typescript
// Read install state
function readState(platform: string): Promise<InstallState>

// Write install state
function writeState(state: InstallState): Promise<void>

// Update partial state
function patchState(platform: string, patch: Partial<InstallState>): Promise<void>

// List all installed platforms
function listInstalledPlatforms(): Promise<string[]>

// Clear state (for removal)
function clearState(platform: string): Promise<void>
```

---

### 3.6 `src/cli/doctor/`

**Responsibility:** Validates installed environment against catalog and state. Reports drift, missing files, conflicts, and security concerns.

**Doctor checks:**
1. **State integrity** — Does `~/.foundry/state/<platform>.json` exist and parse?
2. **Asset presence** — Are all recorded `installedAssets` files present?
3. **Catalog drift** — Does installed catalog version match current repo?
4. **User override audit** — Are any generated files incorrectly overriding user files?
5. **Orphaned files** — Are there installed files not in current catalog?
6. **Checksum validation** — Do installed files match expected checksums?
7. **Platform-specific checks** — (e.g., for claude: `.claude` directory structure)

**Public API:**
```typescript
// Run full doctor check
async function doctor(target: InstallTarget): Promise<DoctorReport>

// Quick health check
async function healthCheck(platform: string): Promise<HealthStatus>

// Fix common issues
async function autoFix(report: DoctorReport): Promise<FixResult[]>
```

---

### 3.7 `src/cli/mcp/`

**Responsibility:** Manages MCP server configurations for the workspace. Integrates with the catalog system's MCP component definitions.

**MCP in V2:**
- MCP server definitions live in `foundry/modules/mcp-core/servers/`
- Each server has a `server.yaml` descriptor
- The compiler generates `.mcp.json` per platform from these descriptors
- The installer stages and merges MCP configs

**Public API:**
```typescript
// List available MCP servers from catalog
function listCatalogServers(catalog: Catalog): MCPServerConfig[]

// Generate MCP manifest for platform
function generateMcpManifest(
  servers: MCPServerConfig[],
  platform: string
): Promise<McpManifest>

// Apply MCP configuration
async function applyMcpConfig(
  manifest: McpManifest,
  target: InstallTarget
): Promise<void>
```

---

## 4. Capability-Based Skill Model

### 4.1 Capabilities as First-Class Modules

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

### 4.2 Capability-to-Skill Generation

Each capability's `templates/` directory contains Jinja2 templates per platform. The compiler:

1. Loads the capability's `SKILL.md`
2. Merges with `module.yaml` metadata
3. Renders through the platform template
4. Outputs to `generated/runtime-assets/<platform>/skills/<capability>.md`

### 4.3 Skill Rationalization

**Merge design-*** — `design-arrange`, `design-bolder`, `design-distill`, `design-polish`, `design-typeset` become **one** capability: `design` with preset modes.

**Demote stitch** — Keep as `compat-alias` only, not in default profiles.

**Restructure heavy-orchestration skills** — `ui-testing-harness`, `playwright-web-qa`, `flutter-mobile-qa` become `capability`-backed with explicit runtime contracts.

**Result:** ~20-25 canonical capabilities instead of 64+ skill directories.

---

## 5. Build Architect — Enhanced `cbx build architecture`

### 5.1 What It Does

The existing `cbx build architecture` generates skeleton files. V2 makes these **AI-actionable documents** that genuinely help an AI agent understand and work in the project.

### 5.2 Generated Documents

After `cbx init` or `cbx build architecture`, the following are generated from templates + project context:

| File | Purpose | AI Agent Use |
|------|---------|--------------|
| `docs/foundation/TECH.md` | Tech stack, tooling, patterns | "What tools does this project use?" |
| `docs/foundation/ARCHITECTURE.md` | System structure, key decisions | "How is this codebase organized?" |
| `docs/foundation/STRUCTURE.md` | Directory layout, ownership | "Where should I put this file?" |
| `docs/foundation/MEMORY.md` | Project memories, decisions | "What does this team care about?" |
| `docs/foundation/PRODUCT.md` | Product context, goals | "What is this project trying to achieve?" |

### 5.3 Template System

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

### 5.4 Managed Sections

Documents use comment-based managed sections (existing pattern preserved):

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

## 6. CLI Command Surface

### 6.1 Preserved End-User Commands

```
cbx init                        # Initialize workspace with foundation docs
cbx workflows install <name>    # Install a workflow/module
cbx workflows remove <name>     # Remove a workflow/module
cbx workflows prune-skills      # Remove untracked skill mirrors
cbx workflows sync-rules        # Re-sync rules from catalog
cbx doctor                      # Run environment health check
```

### 6.2 New Maintainer Commands

```
cbx catalog validate            # Validate foundry/package.yaml and all modules
cbx catalog build               # Run full compilation (generate/runtime-assets)
cbx catalog build --platform claude  # Compile for specific platform
cbx catalog audit --skills       # Audit skill parity across platforms
cbx catalog diff --platform claude   # Show diff between canonical and installed
cbx catalog status              # Show catalog version, installed modules
```

### 6.3 Build Architect Commands

```
cbx build architecture              # Generate/update all foundation docs
cbx build architecture --platform claude  # Platform-specific foundation
cbx build architecture --doc TECH.md      # Generate specific doc
```

---

## 7. File Layout

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
```

**Key migration note:** The current `workflows/skills/` and `workflows/workflows/agent-environment-setup/platforms/` directories transition to generated outputs. Canonical sources live in `foundry/modules/`.

---

## 8. Migration Path

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

---

## 9. Validation

- Schema validation for every module.yaml and adapter.yaml
- Golden file tests per platform (generated output matches expected)
- Installer tests: apply, upgrade, remove, doctor for each platform
- User-override tests: ensure user files are never silently overwritten
- Capability contract tests: each capability's outputs are tested

---

## 10. Open Questions

1. **V1 compatibility bridge** — How long to keep the old `workflows/` sources valid during migration?
2. **Third-party modules** — Any appetite for `foundry/modules/` to accept external contributions?
3. **IDE integration** — Any need for LSP/language server support for module.yaml?
