# Foundry V2 — Control Plane Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the canonical control plane (`foundry/`) and the `catalog/` subsystem. After this plan, `cbx catalog validate` works and the YAML schemas for `module.yaml` and `adapter.yaml` are enforced.

**Architecture:** The control plane lives in `foundry/` at the repo root. YAML schemas (JSON Schema) validate `package.yaml`, `module.yaml`, and `adapter.yaml`. The `catalog/` subsystem reads, parses, and validates these files using Zod schemas derived from the JSON Schemas.

**Tech Stack:** TypeScript (ESM), Zod for schema validation, JSON Schema for canonical schemas, vitest for testing.

---

## File Map

### New files to create

```
foundry/
  package.yaml                          # Repo-wide metadata
  schemas/
    package.schema.json                  # JSON Schema for foundry/package.yaml
    module.schema.json                   # JSON Schema for foundry/modules/<id>/module.yaml
    adapter.schema.json                 # JSON Schema for foundry/adapters/<platform>.yaml
  modules/
    rules-core/
      module.yaml                       # Placeholder module for rules-core
    agents-core/
      module.yaml                       # Placeholder module for agents-core
    contexts-core/
      module.yaml                       # Placeholder module for contexts-core
      templates/
        tech.md.j2                      # Template for TECH.md
        architecture.md.j2              # Template for ARCHITECTURE.md
        structure.md.j2                  # Template for STRUCTURE.md
        memory.md.j2                    # Template for MEMORY.md
        product.md.j2                   # Template for PRODUCT.md
  adapters/
    claude.yaml
    codex.yaml
    copilot.yaml
    gemini.yaml
    antigravity.yaml

src/cli/catalog/
  index.ts                              # Public API: loadCatalog, validateCatalog, resolveModule, resolveProfile
  types.ts                              # Catalog, Module, Adapter, PackageManifest, Profile types
  schemas.ts                            # Zod schemas derived from JSON Schemas
  loaders/
    index.ts                            # Unified loader entry
    package.ts                          # loadPackage()
    module.ts                            # loadModule(id)
    adapter.ts                           # loadAdapter(platform)
  validators/
    index.ts                            # validateCatalog(), validateModule(), validateAdapter()
    errors.ts                           # ValidationError, CatalogValidationError

vitest.config.ts                        # Root vitest config for CLI tests

scripts/
  validate-catalog.mjs                  # CLI script: cbx catalog validate (runs in parallel with existing checks)
```

### Files to modify

```
package.json                            # Add vitest, add cbx catalog validate script
tsconfig.cli.json                       # Add vitest types, ensure strict mode
src/cli/core.ts                         # Import and expose catalog subsystem (for future wiring)
```

---

## Tasks

### Task 1: Create foundry/ directory structure and package.yaml

- [ ] **Step 1: Create foundry/package.yaml**

Create: `foundry/package.yaml`

```yaml
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
    modules: [rules-core, agents-core, contexts-core]
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
    description: AI-context documents
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

- [ ] **Step 2: Commit**

```bash
git add foundry/package.yaml
git commit -m "feat(foundry): add foundry/package.yaml v1 control plane manifest

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create JSON Schemas for foundry/ YAML files

- [ ] **Step 1: Create foundry/schemas/package.schema.json**

Create: `foundry/schemas/package.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Foundry Package Manifest",
  "description": "Schema for foundry/package.yaml",
  "type": "object",
  "required": ["schemaVersion", "version", "name", "supportedRuntimes", "installProfiles", "installComponents", "buildOutputs"],
  "properties": {
    "schemaVersion": { "type": "integer", "const": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "supportedRuntimes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "since"],
        "properties": {
          "id": { "type": "string", "enum": ["codex", "claude", "copilot", "gemini", "antigravity"] },
          "label": { "type": "string" },
          "since": { "type": "string" }
        }
      }
    },
    "installProfiles": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "description", "modules"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "description": { "type": "string" },
          "modules": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "installComponents": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "description"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "buildOutputs": {
      "type": "object",
      "required": ["runtimeAssets", "cliDist", "docs"],
      "properties": {
        "runtimeAssets": { "type": "string" },
        "cliDist": { "type": "string" },
        "docs": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 2: Create foundry/schemas/module.schema.json**

Create: `foundry/schemas/module.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Foundry Module Descriptor",
  "description": "Schema for foundry/modules/<id>/module.yaml",
  "type": "object",
  "required": ["id", "kind", "label", "description", "stability"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
    "kind": {
      "type": "string",
      "enum": ["capability", "skill", "rule-pack", "workflow", "specialist", "compat-alias"]
    },
    "label": { "type": "string" },
    "description": { "type": "string", "minLength": 10 },
    "dependencies": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "profiles": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "stability": {
      "type": "string",
      "enum": ["experimental", "beta", "stable", "deprecated"]
    },
    "capability": {
      "type": "object",
      "required": ["type", "domains", "outputs"],
      "properties": {
        "type": { "type": "string", "enum": ["stack", "tool", "pattern"] },
        "domains": { "type": "array", "items": { "type": "string" } },
        "outputs": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["type", "path", "platforms"],
            "properties": {
              "type": { "type": "string", "enum": ["skill", "rules", "workflow", "specialist", "contextDoc"] },
              "path": { "type": "string" },
              "platforms": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    },
    "tests": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "description"],
        "properties": {
          "id": { "type": "string" },
          "description": { "type": "string" },
          "coverage": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "routeHints": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    }
  }
}
```

- [ ] **Step 3: Create foundry/schemas/adapter.schema.json**

Create: `foundry/schemas/adapter.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Foundry Platform Adapter",
  "description": "Schema for foundry/adapters/<platform>.yaml",
  "type": "object",
  "required": ["platform", "label", "rules", "skills", "workflows", "specialists", "contextDocs"],
  "properties": {
    "platform": { "type": "string" },
    "label": { "type": "string" },
    "rules": {
      "type": "object",
      "required": ["mergeStrategy", "userOverride", "conflictResolution"],
      "properties": {
        "mergeStrategy": { "type": "string", "enum": ["layered", "replace", "merge"] },
        "userOverride": { "type": "string", "enum": ["honor", "ignore", "warn"] },
        "conflictResolution": { "type": "string", "enum": ["user-first", "generated-first", "error"] },
        "generate": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "source": { "type": "string" },
            "output": { "type": "string" }
          }
        }
      }
    },
    "skills": {
      "type": "object",
      "properties": {
        "projection": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "transforms": { "type": "array" }
          }
        },
        "capabilityProjection": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "capability": { "type": "string" },
              "output": { "type": "string" },
              "template": { "type": "string" }
            }
          }
        }
      }
    },
    "workflows": {
      "type": "object",
      "properties": {
        "projection": { "type": "array" }
      }
    },
    "specialists": {
      "type": "object",
      "properties": {
        "projection": { "type": "array" }
      }
    },
    "contextDocs": {
      "type": "object",
      "required": ["enabled", "outputDir", "managedSections", "markers", "templates"],
      "properties": {
        "enabled": { "type": "boolean" },
        "outputDir": { "type": "string" },
        "managedSections": { "type": "boolean" },
        "markers": {
          "type": "object",
          "properties": {
            "prefix": { "type": "string" },
            "suffix": { "type": "string" }
          }
        },
        "templates": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "source", "output", "triggers"],
            "properties": {
              "id": { "type": "string" },
              "source": { "type": "string" },
              "output": { "type": "string" },
              "triggers": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add foundry/schemas/
git commit -m "feat(foundry): add JSON schemas for package, module, adapter YAML

- foundry/schemas/package.schema.json
- foundry/schemas/module.schema.json
- foundry/schemas/adapter.schema.json

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Create initial platform adapters

- [ ] **Step 1: Create foundry/adapters/claude.yaml**

Create: `foundry/adapters/claude.yaml`

```yaml
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
  capabilityProjection: []

workflows:
  projection: []

specialists:
  projection: []

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
    - id: memory-md
      source: foundry/modules/contexts-core/templates/memory.md.j2
      output: docs/foundation/MEMORY.md
      triggers: [init, sync]
    - id: product-md
      source: foundry/modules/contexts-core/templates/product.md.j2
      output: docs/foundation/PRODUCT.md
      triggers: [init, sync]
```

- [ ] **Step 2: Create foundry/adapters/codex.yaml, copilot.yaml, gemini.yaml, antigravity.yaml**

Create the remaining four adapters using the same structure as `claude.yaml`, replacing `platform` and `label` appropriately.

- [ ] **Step 3: Commit**

```bash
git add foundry/adapters/
git commit -m "feat(foundry): add initial platform adapters for all 5 runtimes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Create placeholder module directories

- [ ] **Step 1: Create foundry/modules/rules-core/module.yaml**

Create: `foundry/modules/rules-core/module.yaml`

```yaml
id: rules-core
kind: rule-pack
label: Core Rules
description: Steering rules for all platforms — safety, quality, and collaboration guardrails.
stability: stable
profiles:
  - core
  - developer
  - security
  - research
```

- [ ] **Step 2: Create foundry/modules/agents-core/module.yaml**

Create: `foundry/modules/agents-core/module.yaml`

```yaml
id: agents-core
kind: specialist
label: Core Agents
description: Shared specialist agents — orchestrator, planner, implementer, reviewer, debugger, tester, explorer.
stability: stable
profiles:
  - core
  - developer
```

- [ ] **Step 3: Create foundry/modules/contexts-core/module.yaml and templates**

Create: `foundry/modules/contexts-core/module.yaml`

```yaml
id: contexts-core
kind: capability
label: Context Docs
description: AI-context documents — TECH.md, ARCHITECTURE.md, STRUCTURE.md, MEMORY.md, PRODUCT.md.
stability: stable
profiles:
  - core
  - developer
capability:
  type: tool
  domains: [documentation, context]
  outputs:
    - type: contextDoc
      path: docs/foundation/TECH.md
      platforms: [codex, claude, copilot, gemini, antigravity]
    - type: contextDoc
      path: docs/foundation/ARCHITECTURE.md
      platforms: [codex, claude, copilot, gemini, antigravity]
    - type: contextDoc
      path: docs/foundation/STRUCTURE.md
      platforms: [codex, claude, copilot, gemini, antigravity]
    - type: contextDoc
      path: docs/foundation/MEMORY.md
      platforms: [codex, claude, copilot, gemini, antigravity]
    - type: contextDoc
      path: docs/foundation/PRODUCT.md
      platforms: [codex, claude, copilot, gemini, antigravity]
```

Create stub templates for each context doc:

Create: `foundry/modules/contexts-core/templates/tech.md.j2`
```
# TECH.md

<!-- cbx:tech:stack:start version=1 -->
## Tech Stack

_TODO: auto-generated on `cbx build architecture`_
<!-- cbx:tech:stack:end -->

<!-- cbx:tech:commands:start version=1 -->
## Build Commands

_TODO: auto-generated on `cbx build architecture`_
<!-- cbx:tech:commands:end -->
```

(Create analogous stub templates for architecture.md.j2, structure.md.j2, memory.md.j2, product.md.j2 — each with appropriate `cbx:` section markers.)

- [ ] **Step 4: Commit**

```bash
git add foundry/modules/
git commit -m "feat(foundry): add placeholder modules for rules-core, agents-core, contexts-core

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Build the catalog subsystem (src/cli/catalog/)

- [ ] **Step 1: Create src/cli/catalog/types.ts**

Create: `src/cli/catalog/types.ts`

```typescript
// Core catalog types

export type ModuleKind =
  | 'capability'
  | 'skill'
  | 'rule-pack'
  | 'workflow'
  | 'specialist'
  | 'compat-alias';

export type Stability = 'experimental' | 'beta' | 'stable' | 'deprecated';

export type CapabilityType = 'stack' | 'tool' | 'pattern';

export interface ModuleOutput {
  type: 'skill' | 'rules' | 'workflow' | 'specialist' | 'contextDoc';
  path: string;
  platforms: string[];
}

export interface CapabilityContract {
  type: CapabilityType;
  domains: string[];
  outputs: ModuleOutput[];
}

export interface TestSpec {
  id: string;
  description: string;
  coverage?: string[];
}

export interface Module {
  id: string;
  kind: ModuleKind;
  label: string;
  description: string;
  dependencies: string[];
  profiles: string[];
  stability: Stability;
  capability?: CapabilityContract;
  tests?: TestSpec[];
  routeHints?: string[];
}

export interface Runtime {
  id: string;
  label: string;
  since: string;
}

export interface InstallProfile {
  id: string;
  label: string;
  description: string;
  modules: string[];
}

export interface InstallComponent {
  id: string;
  label: string;
  description: string;
}

export interface BuildOutputs {
  runtimeAssets: string;
  cliDist: string;
  docs: string;
}

export interface PackageManifest {
  schemaVersion: number;
  version: string;
  name: string;
  description: string;
  supportedRuntimes: Runtime[];
  installProfiles: InstallProfile[];
  installComponents: InstallComponent[];
  buildOutputs: BuildOutputs;
}

export interface AdapterRulesConfig {
  mergeStrategy: string;
  userOverride: string;
  conflictResolution: string;
  generate?: {
    type: string;
    source: string;
    output: string;
  };
}

export interface AdapterSkillsConfig {
  projection?: {
    type: string;
    transforms: unknown[];
  };
  capabilityProjection?: Array<{
    capability: string;
    output: string;
    template?: string;
  }>;
}

export interface AdapterWorkflowsConfig {
  projection: unknown[];
}

export interface AdapterSpecialistsConfig {
  projection: unknown[];
}

export interface ContextDocTemplate {
  id: string;
  source: string;
  output: string;
  triggers: string[];
}

export interface AdapterContextDocsConfig {
  enabled: boolean;
  outputDir: string;
  managedSections: boolean;
  markers: {
    prefix: string;
    suffix: string;
  };
  templates: ContextDocTemplate[];
}

export interface Adapter {
  platform: string;
  label: string;
  rules: AdapterRulesConfig;
  skills: AdapterSkillsConfig;
  workflows: AdapterWorkflowsConfig;
  specialists: AdapterSpecialistsConfig;
  contextDocs: AdapterContextDocsConfig;
}

export interface Catalog {
  package: PackageManifest;
  modules: Map<string, Module>;
  adapters: Map<string, Adapter>;
  schemaVersion: number;
}
```

- [ ] **Step 2: Create src/cli/catalog/schemas.ts**

Create: `src/cli/catalog/schemas.ts`
Derives Zod schemas from the JSON Schemas in `foundry/schemas/`. Uses `z.object`, `z.string`, `z.array`, etc. matching the JSON Schema structures.

```typescript
import { z } from 'zod';

// Package manifest Zod schema (mirrors foundry/schemas/package.schema.json)
export const RuntimeSchema = z.object({
  id: z.enum(['codex', 'claude', 'copilot', 'gemini', 'antigravity']),
  label: z.string(),
  since: z.string(),
});

export const InstallProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  modules: z.array(z.string()),
});

export const InstallComponentSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
});

export const BuildOutputsSchema = z.object({
  runtimeAssets: z.string(),
  cliDist: z.string(),
  docs: z.string(),
});

export const PackageManifestSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  supportedRuntimes: z.array(RuntimeSchema),
  installProfiles: z.array(InstallProfileSchema),
  installComponents: z.array(InstallComponentSchema),
  buildOutputs: BuildOutputsSchema,
});

// Module Zod schema (mirrors foundry/schemas/module.schema.json)
export const ModuleOutputSchema = z.object({
  type: z.enum(['skill', 'rules', 'workflow', 'specialist', 'contextDoc']),
  path: z.string(),
  platforms: z.array(z.string()),
});

export const CapabilityContractSchema = z.object({
  type: z.enum(['stack', 'tool', 'pattern']),
  domains: z.array(z.string()),
  outputs: z.array(ModuleOutputSchema),
});

export const TestSpecSchema = z.object({
  id: z.string(),
  description: z.string(),
  coverage: z.array(z.string()).optional(),
});

export const ModuleSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  kind: z.enum(['capability', 'skill', 'rule-pack', 'workflow', 'specialist', 'compat-alias']),
  label: z.string(),
  description: z.string().min(10),
  dependencies: z.array(z.string()).default([]),
  profiles: z.array(z.string()).default([]),
  stability: z.enum(['experimental', 'beta', 'stable', 'deprecated']),
  capability: CapabilityContractSchema.optional(),
  tests: z.array(TestSpecSchema).optional(),
  routeHints: z.array(z.string()).default([]),
});

// Adapter Zod schema (mirrors foundry/schemas/adapter.schema.json)
export const ContextDocTemplateSchema = z.object({
  id: z.string(),
  source: z.string(),
  output: z.string(),
  triggers: z.array(z.string()),
});

export const AdapterSchema = z.object({
  platform: z.string(),
  label: z.string(),
  rules: z.object({
    mergeStrategy: z.enum(['layered', 'replace', 'merge']),
    userOverride: z.enum(['honor', 'ignore', 'warn']),
    conflictResolution: z.enum(['user-first', 'generated-first', 'error']),
    generate: z.object({
      type: z.string(),
      source: z.string(),
      output: z.string(),
    }).optional(),
  }),
  skills: z.object({
    projection: z.object({
      type: z.string(),
      transforms: z.array(z.unknown()),
    }).optional(),
    capabilityProjection: z.array(z.object({
      capability: z.string(),
      output: z.string(),
      template: z.string().optional(),
    })).optional(),
  }),
  workflows: z.object({
    projection: z.array(z.unknown()),
  }),
  specialists: z.object({
    projection: z.array(z.unknown()),
  }),
  contextDocs: z.object({
    enabled: z.boolean(),
    outputDir: z.string(),
    managedSections: z.boolean(),
    markers: z.object({
      prefix: z.string(),
      suffix: z.string(),
    }),
    templates: z.array(ContextDocTemplateSchema),
  }),
});
```

- [ ] **Step 3: Create src/cli/catalog/loaders/package.ts**

Create: `src/cli/catalog/loaders/package.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { join } from 'node:path';
import { PackageManifestSchema } from '../schemas.js';
import type { PackageManifest } from '../types.js';

export async function loadPackage(root: string): Promise<PackageManifest> {
  const filePath = join(root, 'foundry', 'package.yaml');
  const raw = await readFile(filePath, 'utf8');
  const parsed = parseYaml(raw);
  return PackageManifestSchema.parse(parsed);
}
```

(Install `yaml` package if not already present: `import { parse as parseYaml } from 'yaml'` — check package.json first.)

- [ ] **Step 4: Create src/cli/catalog/loaders/module.ts**

Create: `src/cli/catalog/loaders/module.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { ModuleSchema } from '../schemas.js';
import type { Module } from '../types.js';

export async function loadModule(root: string, id: string): Promise<Module | null> {
  const modulePath = join(root, 'foundry', 'modules', id, 'module.yaml');
  try {
    const raw = await readFile(modulePath, 'utf8');
    const parsed = parseYaml(raw);
    return ModuleSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function loadAllModules(root: string): Promise<Map<string, Module>> {
  const modulesDir = join(root, 'foundry', 'modules');
  const entries = await readdir(modulesDir, { withFileTypes: true });
  const modules = new Map<string, Module>();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const module = await loadModule(root, entry.name);
    if (module) {
      modules.set(module.id, module);
    }
  }

  return modules;
}
```

- [ ] **Step 5: Create src/cli/catalog/loaders/adapter.ts**

Create: `src/cli/catalog/loaders/adapter.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { join } from 'node:path';
import { AdapterSchema } from '../schemas.js';
import type { Adapter } from '../types.js';

const PLATFORMS = ['codex', 'claude', 'copilot', 'gemini', 'antigravity'] as const;

export async function loadAdapter(root: string, platform: string): Promise<Adapter | null> {
  const adapterPath = join(root, 'foundry', 'adapters', `${platform}.yaml`);
  try {
    const raw = await readFile(adapterPath, 'utf8');
    const parsed = parseYaml(raw);
    return AdapterSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function loadAllAdapters(root: string): Promise<Map<string, Adapter>> {
  const adapters = new Map<string, Adapter>();

  for (const platform of PLATFORMS) {
    const adapter = await loadAdapter(root, platform);
    if (adapter) {
      adapters.set(platform, adapter);
    }
  }

  return adapters;
}
```

- [ ] **Step 6: Create src/cli/catalog/loaders/index.ts**

Create: `src/cli/catalog/loaders/index.ts`

```typescript
export { loadPackage } from './package.js';
export { loadModule, loadAllModules } from './module.js';
export { loadAdapter, loadAllAdapters } from './adapter.js';
```

- [ ] **Step 7: Create src/cli/catalog/validators/errors.ts**

Create: `src/cli/catalog/validators/errors.ts`

```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CatalogValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ModuleValidationResult {
  valid: boolean;
  moduleId: string;
  errors: ValidationIssue[];
}
```

- [ ] **Step 8: Create src/cli/catalog/validators/index.ts**

Create: `src/cli/catalog/validators/index.ts`

```typescript
import { ZodError } from 'zod';
import type { Catalog, Module } from '../types.js';
import type { CatalogValidationResult, ModuleValidationResult, ValidationIssue } from './errors.js';

export function moduleToIssues(moduleId: string, zodError: ZodError): ValidationIssue[] {
  return zodError.issues.map((issue) => ({
    path: `foundry/modules/${moduleId}/module.yaml`,
    message: `${issue.path.join('.')}: ${issue.message}`,
    severity: 'error' as const,
  }));
}

export function validateModule(module: Module): ModuleValidationResult {
  try {
    return { valid: true, moduleId: module.id, errors: [] };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        valid: false,
        moduleId: module.id,
        errors: moduleToIssues(module.id, err),
      };
    }
    throw err;
  }
}

export function validateCatalog(catalog: Catalog): CatalogValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Check all referenced modules in profiles exist
  for (const profile of catalog.package.installProfiles) {
    for (const moduleId of profile.modules) {
      if (!catalog.modules.has(moduleId)) {
        errors.push({
          path: `foundry/package.yaml`,
          message: `Profile '${profile.id}' references module '${moduleId}' which does not exist`,
          severity: 'error',
        });
      }
    }
  }

  // Check module dependencies exist
  for (const [moduleId, module] of catalog.modules) {
    for (const dep of module.dependencies) {
      if (!catalog.modules.has(dep)) {
        errors.push({
          path: `foundry/modules/${moduleId}/module.yaml`,
          message: `Module '${moduleId}' depends on '${dep}' which does not exist`,
          severity: 'error',
        });
      }
    }
  }

  // Check adapters reference valid platforms
  for (const [platform, adapter] of catalog.adapters) {
    const supported = catalog.package.supportedRuntimes.map((r) => r.id);
    if (!supported.includes(platform as typeof supported[number])) {
      warnings.push({
        path: `foundry/adapters/${platform}.yaml`,
        message: `Adapter platform '${platform}' is not in supportedRuntimes`,
        severity: 'warning',
      });
    }
    if (adapter.platform !== platform) {
      errors.push({
        path: `foundry/adapters/${platform}.yaml`,
        message: `Adapter platform mismatch: file is '${platform}', adapter declares '${adapter.platform}'`,
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

- [ ] **Step 9: Create src/cli/catalog/index.ts**

Create: `src/cli/catalog/index.ts`

```typescript
import { loadPackage, loadAllModules, loadAllAdapters } from './loaders/index.js';
import { validateCatalog, validateModule } from './validators/index.js';
import type { Catalog, Module, Adapter, PackageManifest, CatalogValidationResult, ModuleValidationResult } from './types.js';

export type { Catalog, Module, Adapter, PackageManifest, CatalogValidationResult, ModuleValidationResult };

export async function loadCatalog(root: string): Promise<Catalog> {
  const pkg = await loadPackage(root);
  const modules = await loadAllModules(root);
  const adapters = await loadAllAdapters(root);

  return {
    package: pkg,
    modules,
    adapters,
    schemaVersion: pkg.schemaVersion,
  };
}

export function resolveModule(catalog: Catalog, id: string): Module | undefined {
  return catalog.modules.get(id);
}

export function resolveProfile(catalog: Catalog, profileId: string) {
  return catalog.package.installProfiles.find((p) => p.id === profileId) ?? null;
}

export { validateCatalog, validateModule };
```

- [ ] **Step 10: Commit the catalog subsystem**

```bash
git add src/cli/catalog/
git commit -m "feat(catalog): add catalog subsystem

- Types for Catalog, Module, Adapter, PackageManifest
- Zod schemas derived from foundry/schemas/*.schema.json
- Loaders for package.yaml, module.yaml, adapter.yaml
- Validators with cross-reference checking
- Public API: loadCatalog, resolveModule, resolveProfile, validateCatalog

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Add vitest for CLI tests and write catalog tests

- [ ] **Step 1: Add vitest to package.json**

Modify: `package.json` — add to devDependencies: `"vitest": "^2.0.0"` (or latest compatible)

Add to scripts:
```json
"test:cli": "vitest run",
"test:cli:watch": "vitest",
```

- [ ] **Step 2: Create vitest.config.ts at root**

Create: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

(Or extend the existing MCP vitest config if that makes sense — check with `cat mcp/vitest.config.ts`.)

- [ ] **Step 3: Write src/cli/catalog/catalog.test.ts**

Create: `src/cli/catalog/catalog.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { loadCatalog, resolveModule, resolveProfile, validateCatalog } from './index.js';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../..');

describe('catalog', () => {
  let catalog: Awaited<ReturnType<typeof loadCatalog>>;

  beforeAll(async () => {
    catalog = await loadCatalog(REPO_ROOT);
  });

  describe('loadCatalog', () => {
    it('loads package manifest', () => {
      expect(catalog.package.name).toBe('foundry');
      expect(catalog.package.schemaVersion).toBe(1);
      expect(catalog.package.supportedRuntimes).toHaveLength(5);
    });

    it('loads all 5 adapters', () => {
      expect(catalog.adapters.size).toBe(5);
      expect(catalog.adapters.has('claude')).toBe(true);
      expect(catalog.adapters.has('codex')).toBe(true);
      expect(catalog.adapters.has('copilot')).toBe(true);
      expect(catalog.adapters.has('gemini')).toBe(true);
      expect(catalog.adapters.has('antigravity')).toBe(true);
    });

    it('loads placeholder modules', () => {
      expect(catalog.modules.size).toBeGreaterThanOrEqual(3);
      expect(catalog.modules.has('rules-core')).toBe(true);
      expect(catalog.modules.has('agents-core')).toBe(true);
      expect(catalog.modules.has('contexts-core')).toBe(true);
    });
  });

  describe('resolveModule', () => {
    it('resolves existing module', () => {
      const module = resolveModule(catalog, 'rules-core');
      expect(module).toBeDefined();
      expect(module?.id).toBe('rules-core');
      expect(module?.kind).toBe('rule-pack');
    });

    it('returns undefined for non-existent module', () => {
      expect(resolveModule(catalog, 'non-existent')).toBeUndefined();
    });
  });

  describe('resolveProfile', () => {
    it('resolves developer profile', () => {
      const profile = resolveProfile(catalog, 'developer');
      expect(profile).toBeDefined();
      expect(profile?.id).toBe('developer');
      expect(profile?.modules).toContain('rules-core');
    });

    it('returns null for non-existent profile', () => {
      expect(resolveProfile(catalog, 'non-existent')).toBeNull();
    });
  });

  describe('validateCatalog', () => {
    it('passes validation with current catalog', () => {
      const result = validateCatalog(catalog);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('catches missing module dependency', () => {
      const badCatalog = {
        ...catalog,
        modules: new Map([
          [
            'bad-module',
            {
              id: 'bad-module',
              kind: 'capability' as const,
              label: 'Bad',
              description: 'A module with missing dependencies',
              dependencies: ['non-existent-dep'],
              profiles: [],
              stability: 'stable' as const,
            },
          ],
        ]),
      };
      const result = validateCatalog(badCatalog);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('non-existent-dep'))).toBe(true);
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:cli
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json src/cli/catalog/catalog.test.ts
git commit -m "test(catalog): add vitest config and catalog subsystem tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Wire up cbx catalog validate command

- [ ] **Step 1: Create scripts/validate-catalog.mjs**

Create: `scripts/validate-catalog.mjs`

A standalone Node.js script (ESM) that:
1. Loads the catalog using the compiled catalog subsystem (or re-implements minimal loading if needed)
2. Runs `validateCatalog()`
3. Prints errors/warnings to console
4. Exits 0 if valid, exits 1 if invalid

This script is invoked by `npm run validate:catalog`.

- [ ] **Step 2: Add to package.json scripts**

```json
"validate:catalog": "node scripts/validate-catalog.mjs",
```

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-catalog.mjs package.json
git commit -m "feat(cli): add cbx catalog validate command

Runs catalog validation against foundry/ control plane.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Verification

After completing all tasks:

1. Run `npm run build:cli` — compiles without errors
2. Run `npm run validate:catalog` — exits 0 with no errors
3. Run `npm run test:cli` — all tests pass
4. Run `npm run check` — `cbx --help` shows the CLI still works
