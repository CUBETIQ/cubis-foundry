---
command: "/architecture"
description: "Refresh the core project foundation docs in docs/foundation/MEMORY.md, docs/foundation/PRODUCT.md, docs/foundation/ARCHITECTURE.md, docs/foundation/TECH.md, docs/foundation/memory/*.md, and ADR scaffolds with explicit structure, product context, testing, and flow guidance."
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

- Primary coordinator: `@project-planner`
- Documentation support: `@documentation-writer`
- Research support: `@researcher`
- Domain validation: `@backend-specialist`, `@frontend-specialist`, `@database-architect`

## Skill Routing

- Primary skills: `architecture-doc`, `system-design`, `tech-doc`, `frontend-design`
- Supporting skills (optional): `api-design`, `database-design`, `sadd`, `deep-research`
- Load the four primary skills directly for this workflow. Add `api-design` or `database-design` when service or data boundaries are central, `sadd` when tying the architecture update to an active spec pack, and `deep-research` only when outside evidence is required.

## Workflow steps

1. Inspect the repo first and derive the current product surfaces, architecture style, module boundaries, technical constraints, and testing strategy from the codebase itself.
2. Read concrete repo anchors before drafting: root README/manifests, main entrypoints, the primary app roots, existing `docs/specs/`, and representative source folders for each major surface.
3. Read `docs/foundation/MEMORY.md` first if it exists, then load `docs/foundation/PRODUCT.md`, `docs/foundation/ARCHITECTURE.md`, `docs/foundation/TECH.md`, `docs/foundation/memory/*.md`, and ADRs on demand.
4. Update the managed foundation sections in `docs/foundation/MEMORY.md`, `docs/foundation/PRODUCT.md`, `docs/foundation/ARCHITECTURE.md`, `docs/foundation/TECH.md`, and `docs/foundation/memory/*.md`.
5. Make `docs/foundation/MEMORY.md` the durable entrypoint: concise project summary, load-on-demand map, exact links to deeper docs, explicit consumer guidance for rules, workflows, agents, and skills, and a strong bias against bloat.
6. Ensure each deeper foundation doc makes it obvious when it should be consulted and by which route families (planning/spec, architecture/refactor, build/test/debug, runtime/integration, or ADR work).
7. Make `docs/foundation/ARCHITECTURE.md` explicitly state the architecture type in use and include a folder-structure guide for the important apps/packages/directories.
8. Add or refresh Mermaid diagrams using fenced ` ```mermaid ` blocks with valid syntax inside `docs/foundation/ARCHITECTURE.md` or `docs/foundation/TECH.md` when they clarify system behavior. Use `sequenceDiagram` for runtime flows and `graph TD` or `C4Context` for structural views.
9. Ensure `docs/foundation/PRODUCT.md` includes a `## Domain Glossary` defining project-specific terms so future agents use consistent vocabulary.
10. Ensure `docs/foundation/ARCHITECTURE.md` includes `## Crosscutting Concerns` (logging, auth, error handling patterns), `## Quality Requirements`, and `## Risks And Tech Debt` sections.
11. Ensure `docs/foundation/TECH.md` includes `## Build And Validation` (exact commands from clean clone to passing CI), `## CI CD Pipeline` (workflow files and triggers), and `## Error Patterns And Debugging` (common errors and resolutions).
12. Ensure the topic docs under `docs/foundation/memory/` stay narrow and task-oriented:
    - `domain.md`
    - `runtime.md`
    - `integrations.md`
    - `debugging.md`
13. Seed or refresh `docs/foundation/adr/README.md` and `docs/foundation/adr/0000-template.md`, and keep ADR linkage explicit when decisions should be durable.
14. Record whether the update was driven by a broader spec and whether future implementation must follow newly declared structure or product constraints.

## Context notes

- This workflow is route-fixed and skill-fixed: do not start with `route_resolve` or `skill_search`.
- `docs/foundation/MEMORY.md` is the first-stop index for AI agents. It should stay concise, durable, and link outward instead of duplicating every deep detail.
- Keep `docs/foundation/MEMORY.md` under roughly 120 lines when possible. If a section grows beyond a short paragraph or 5-7 bullets, move the detail into a deeper doc and leave only the routing summary behind.
- `docs/foundation/PRODUCT.md` captures intent and domain glossary, `docs/foundation/ARCHITECTURE.md` captures accepted structure and crosscutting concerns, and `docs/foundation/TECH.md` is the developer-facing technical map with build/validation commands. Keep them aligned but not redundant.
- `docs/foundation/MEMORY.md` should tell future rules, workflows, agents, and skills which deeper doc to consult for planning/spec work, architecture/refactors, build/test/debug work, runtime/integration work, and ADR-worthy decisions.
- `docs/foundation/PRODUCT.md` should make it obvious that planning/spec/product routes consult it first; `docs/foundation/ARCHITECTURE.md` should make it obvious that architecture/refactor routes consult it first; `docs/foundation/TECH.md` should make it obvious that build/test/debug/devops routes consult it first.
- Favor a lean arc42/C4 style: clear scope, boundaries, building blocks, runtime flows, crosscutting concerns, quality requirements, risks, deployment/testing notes, and only diagrams that add real value.
- `docs/foundation/ARCHITECTURE.md` should guide future contributors, not just describe the system. Be explicit about architecture style and folder ownership.
- `docs/foundation/TECH.md` should enable an AI agent to start working immediately: exact build commands, environment setup, error patterns, and validation steps.
- Topic docs in `docs/foundation/memory/` should be load-on-demand references rather than duplicated summary docs, and should clearly indicate which runtime, integration, or debugging routes benefit from them.
- Prefer stable section headings over ad hoc prose so future refreshes stay clean and easy to diff.
- All generated markdown must use correct formatting: single H1, proper heading hierarchy, fenced code blocks with language identifiers, valid Mermaid syntax, and tables with header/separator rows.
- Preserve manual content outside the managed foundation sections.
- Mark non-applicable sections explicitly instead of silently omitting them.
- Use relative markdown links between foundation docs: `[ARCHITECTURE.md](docs/foundation/ARCHITECTURE.md)`.

## Verification

- Managed foundation sections exist in the target docs under `docs/foundation/`.
- `docs/foundation/MEMORY.md` exists and points cleanly to the deeper backbone docs and topic docs.
- `docs/foundation/MEMORY.md` includes a clear consumer/load map for rules, workflows, agents, and skills.
- `docs/foundation/MEMORY.md` stays lean and index-like instead of copying large sections from the deeper foundation docs.
- Product intent, architecture style, dependency rules, and technical guidance are explicit.
- `docs/foundation/PRODUCT.md` includes a `## Domain Glossary` with project-specific terms.
- `docs/foundation/ARCHITECTURE.md` includes `## Crosscutting Concerns`, `## Quality Requirements`, and `## Risks And Tech Debt`.
- `docs/foundation/ARCHITECTURE.md` or `docs/foundation/TECH.md` includes flow text and at least one Mermaid diagram when the repo has meaningful flow complexity.
- `docs/foundation/TECH.md` includes `## Build And Validation` with exact commands and `## Error Patterns And Debugging`.
- All Mermaid diagrams use fenced ```mermaid blocks with valid syntax (no rendering errors).
- All markdown files use correct heading hierarchy (single H1, no skipped levels).
- The update records `doc_impact` and whether future feature work must refresh the docs again.

## Output Contract

```yaml
ARCHITECTURE_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [documentation-writer?, researcher?, backend-specialist?, frontend-specialist?, database-architect?]
  primary_skills: [architecture-doc, system-design, tech-doc, frontend-design]
  supporting_skills: [api-design?, database-design?, sadd?, deep-research?]
  managed_targets:
    memory_doc: docs/foundation/MEMORY.md
    product_doc: docs/foundation/PRODUCT.md
    architecture_doc: docs/foundation/ARCHITECTURE.md
    tech_doc: docs/foundation/TECH.md
    memory_topics_dir: docs/foundation/memory
    adr_dir: docs/foundation/adr
  files_updated: [docs/foundation/MEMORY.md, docs/foundation/PRODUCT.md, docs/foundation/ARCHITECTURE.md, docs/foundation/TECH.md, docs/foundation/memory/domain.md, docs/foundation/memory/runtime.md, docs/foundation/memory/integrations.md, docs/foundation/memory/debugging.md]
  architecture_contract:
    style: <string>
    dependency_rules: [<string>]
    design_system_source: <string>
    crosscutting_concerns: [<string>]
    quality_requirements: [<string>]
    risks_and_tech_debt: [<string>]
  technical_snapshot:
    topology: [<string>]
    flows: [<string>]
    diagrams: [<string>] | []
    build_commands: [<string>]
    error_patterns: [<string>] | []
  product_glossary: [<string>] | []
  consumer_guidance:
    memory_routes: [<string>]
    product_routes: [<string>]
    architecture_routes: [<string>]
    tech_routes: [<string>]
  doc_impact: rules | tech | both
  next_actions: [<string>] | []
```
