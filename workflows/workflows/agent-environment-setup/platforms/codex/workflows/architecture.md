---
command: "/architecture"
description: "Refresh the project backbone docs in PRODUCT.md, ARCHITECTURE.md, ENGINEERING_RULES.md, TECH.md, ROADMAP.md, and ADR scaffolds with explicit structure, design-system, testing, and flow guidance."
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

- Primary coordinator: `the project-planner posture`
- Documentation support: `the documentation-writer posture`
- Research support: `the researcher posture`
- Domain validation: `the backend-specialist posture`, `the frontend-specialist posture`, `the database-architect posture`

## Skill Routing

- Primary skills: `architecture-doc`, `system-design`, `tech-doc`, `frontend-design`
- Supporting skills (optional): `api-design`, `database-design`, `sadd`, `deep-research`
- Load the four primary skills directly for this workflow. Add `api-design` or `database-design` when service or data boundaries are central, `sadd` when tying the architecture update to an active spec pack, and `deep-research` only when outside evidence is required.

## Workflow steps

1. Inspect the repo first and read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order if they exist.
2. Determine the current product surfaces, architecture style, module boundaries, design-system source of truth, roadmap themes, and testing strategy from the codebase.
3. Update the managed backbone sections in `PRODUCT.md`, `ARCHITECTURE.md`, `ENGINEERING_RULES.md`, `TECH.md`, and `ROADMAP.md`.
4. Add or refresh Mermaid diagrams and flow narratives inside `ARCHITECTURE.md` or `TECH.md` when they clarify system behavior.
5. Seed or refresh `docs/adr/README.md` and keep ADR linkage explicit when decisions should be durable.
6. Record whether the update was driven by a broader spec and whether future implementation must follow newly declared rules.

## Context notes

- This workflow is route-fixed and skill-fixed: do not start with `route_resolve` or `skill_search`.
- `PRODUCT.md` captures intent, `ARCHITECTURE.md` captures accepted structure, `ENGINEERING_RULES.md` is normative, and `TECH.md` is descriptive. Keep them aligned but not redundant.
- Preserve manual content outside the managed architecture sections.
- Mark non-applicable sections explicitly instead of silently omitting them.

## Verification

- Managed backbone sections exist in the target docs.
- Product intent, architecture style, dependency rules, and design-system guidance are explicit.
- `ARCHITECTURE.md` or `TECH.md` includes flow text and at least one Mermaid diagram when the repo has meaningful flow complexity.
- The update records `doc_impact` and whether future feature work must refresh the docs again.

## Output Contract

```yaml
ARCHITECTURE_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [documentation-writer?, researcher?, backend-specialist?, frontend-specialist?, database-architect?]
  primary_skills: [architecture-doc, system-design, tech-doc, frontend-design]
  supporting_skills: [api-design?, database-design?, sadd?, deep-research?]
  managed_targets:
    product_doc: PRODUCT.md
    architecture_doc: ARCHITECTURE.md
    rules_doc: ENGINEERING_RULES.md
    tech_doc: TECH.md
    roadmap_doc: ROADMAP.md
    adr_dir: docs/adr
  files_updated: [PRODUCT.md, ARCHITECTURE.md, ENGINEERING_RULES.md, TECH.md, ROADMAP.md]
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

> **Codex note:** Prefer native Codex delegation when the host exposes it. Otherwise follow AGENTS.md specialist postures inline while keeping the same routing and verification contract.
