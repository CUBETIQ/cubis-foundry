---
command: "/architecture"
description: "Refresh the core project foundation docs in docs/foundation/PRODUCT.md, docs/foundation/ARCHITECTURE.md, docs/foundation/TECH.md, and ADR scaffolds with explicit structure, product context, testing, and flow guidance."
triggers:
  [
    "architecture",
    "design system",
    "adr",
    "clean architecture",
    "system map",
    "app structure",
    "technical governance",
    "flow diagram",
  ]
---

# Architecture Workflow

## When to use

Use this when the task is to declare, refresh, or validate the project backbone docs, especially after structure changes, scale changes, design-system changes, migrations, product-direction shifts, or major feature additions.

## Routing

- Primary coordinator: `.agent/agents/project-planner`
- Documentation support: `.agent/agents/documentation-writer`
- Research support: `.agent/agents/researcher`
- Domain validation: `.agent/agents/backend-specialist`, `.agent/agents/frontend-specialist`, `.agent/agents/database-architect`

## Skill Routing

- Primary skills: `architecture-doc`, `system-design`, `tech-doc`, `frontend-design`
- Supporting skills (optional): `api-design`, `database-design`, `sadd`, `deep-research`
- Load the four primary skills directly for this workflow. Add `api-design` or `database-design` when service or data boundaries are central, `sadd` when tying the architecture update to an active spec pack, and `deep-research` only when outside evidence is required.

## Workflow steps

1. Inspect the repo first and derive the current product surfaces, architecture style, module boundaries, technical constraints, and testing strategy from the codebase itself.
2. Read concrete repo anchors before drafting: root README/manifests, main entrypoints, the primary app roots, existing `docs/specs/`, and representative source folders for each major surface.
3. Read `docs/foundation/PRODUCT.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order if they exist.
4. Update the managed foundation sections in `docs/foundation/PRODUCT.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md`.
5. Add or refresh Mermaid diagrams and flow narratives inside `docs/foundation/ARCHITECTURE.md` or `docs/foundation/TECH.md` when they clarify system behavior.
6. Seed or refresh `docs/foundation/adr/README.md` and `docs/foundation/adr/0000-template.md`, and keep ADR linkage explicit when decisions should be durable.
7. Record whether the update was driven by a broader spec and whether future implementation must follow newly declared structure or product constraints.

## Context notes

- This workflow is route-fixed and skill-fixed: do not start with `route_resolve` or `skill_search`.
- `docs/foundation/PRODUCT.md` captures intent, `docs/foundation/ARCHITECTURE.md` captures accepted structure, and `docs/foundation/TECH.md` is the developer-facing technical map. Keep them aligned but not redundant.
- Favor a lean arc42/C4 style: clear scope, boundaries, building blocks, runtime flows, deployment/testing notes, and only diagrams that add real value.
- Preserve manual content outside the managed foundation sections.
- Mark non-applicable sections explicitly instead of silently omitting them.

## Verification

- Managed foundation sections exist in the target docs under `docs/foundation/`.
- Product intent, architecture style, dependency rules, and technical guidance are explicit.
- `docs/foundation/ARCHITECTURE.md` or `docs/foundation/TECH.md` includes flow text and at least one Mermaid diagram when the repo has meaningful flow complexity.
- The update records `doc_impact` and whether future feature work must refresh the docs again.

## Output Contract

```yaml
ARCHITECTURE_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [documentation-writer?, researcher?, backend-specialist?, frontend-specialist?, database-architect?]
  primary_skills: [architecture-doc, system-design, tech-doc, frontend-design]
  supporting_skills: [api-design?, database-design?, sadd?, deep-research?]
  managed_targets:
    product_doc: docs/foundation/PRODUCT.md
    architecture_doc: docs/foundation/ARCHITECTURE.md
    tech_doc: docs/foundation/TECH.md
    adr_dir: docs/foundation/adr
  files_updated: [docs/foundation/PRODUCT.md, docs/foundation/ARCHITECTURE.md, docs/foundation/TECH.md]
  architecture_contract:
    style: <string>
    dependency_rules: [<string>]
    design_system_source: <string>
  technical_snapshot:
    topology: [<string>]
    flows: [<string>]
    diagrams: [<string>] | []
  doc_impact: rules | tech | both
  next_actions: [<string>] | []
```

> **Antigravity note:** Use Agent Manager for parallel agent coordination. Workflow files are stored under `.agent/workflows/`.
