---
command: "/architecture"
description: "Refresh the project architecture contract and current-state map in ENGINEERING_RULES.md and TECH.md with explicit structure, design-system, testing, and flow guidance."
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

Use this when the task is to declare, refresh, or validate the project architecture contract and current-state map, especially after structure changes, scale changes, design-system changes, migrations, or major feature additions.

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

1. Inspect the repo first and read `ENGINEERING_RULES.md` followed by `TECH.md` if they exist.
2. Determine the current architecture style, module boundaries, design-system source of truth, and testing strategy from the codebase.
3. Update only the managed architecture sections in `ENGINEERING_RULES.md` and `TECH.md`.
4. Add or refresh Mermaid diagrams and flow narratives inside `TECH.md` when they clarify system behavior.
5. Record whether the update was driven by a broader spec and whether future implementation must follow newly declared rules.

## Context notes

- This workflow is route-fixed and skill-fixed: do not start with `route_resolve` or `skill_search`.
- `ENGINEERING_RULES.md` is normative. `TECH.md` is descriptive. Keep them aligned but not redundant.
- Preserve manual content outside the managed architecture sections.
- Mark non-applicable sections explicitly instead of silently omitting them.

## Verification

- Managed architecture sections exist in both target docs.
- Architecture style, dependency rules, and design-system guidance are explicit.
- `TECH.md` includes flow text and at least one Mermaid diagram when the repo has meaningful flow complexity.
- The update records `doc_impact` and whether future feature work must refresh the docs again.

## Output Contract

```yaml
ARCHITECTURE_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [documentation-writer?, researcher?, backend-specialist?, frontend-specialist?, database-architect?]
  primary_skills: [architecture-doc, system-design, tech-doc, frontend-design]
  supporting_skills: [api-design?, database-design?, sadd?, deep-research?]
  managed_targets:
    rules_doc: ENGINEERING_RULES.md
    tech_doc: TECH.md
  files_updated: [ENGINEERING_RULES.md, TECH.md]
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
