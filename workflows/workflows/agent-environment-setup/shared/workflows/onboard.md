---
command: "/onboard"
description: "Survey an unfamiliar codebase, map its architecture, identify patterns and conventions, and produce a structured orientation report for new contributors."
triggers:
  [
    "onboard",
    "explore codebase",
    "understand project",
    "new to this repo",
    "codebase survey",
  ]
---

# Onboard Workflow

## When to use

Use this when joining a new project, exploring an unfamiliar codebase, or preparing orientation material.

## Routing

- Primary specialist: `@researcher`
- Architecture mapping: `@code-archaeologist`
- Domain specialists as needed: `@backend-specialist`, `@frontend-specialist`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Provide the repo URL, focus areas, and any specific questions to answer during onboarding.

## Skill Routing

- Primary skills: `deep-research`, `architecture-designer`
- Supporting skills (optional): `legacy-modernizer`, `database-skills`, `typescript-pro`, `javascript-pro`, `python-pro`
- Start with `deep-research` for systematic exploration and `architecture-designer` for architecture mapping. Add `legacy-modernizer` for undocumented systems. Prefer repo evidence first; use external sources only when setup or dependency behavior cannot be confirmed locally.

## Workflow steps

1. Survey the project structure — directories, entry points, and configuration.
2. Map the architecture — components, data flow, and integration points.
3. Identify patterns — naming conventions, design patterns, and coding standards.
4. Document dependencies — external services, databases, and APIs.
5. Produce orientation report with development setup instructions.

## Verification

- All major components identified and documented.
- Development setup instructions verified (can be followed by a newcomer).
- Architecture diagram or description covers main data flows.
- Key patterns and conventions explicitly documented.

## Output Contract

```yaml
ONBOARD_WORKFLOW_RESULT:
  primary_agent: researcher
  supporting_agents: [code-archaeologist?, backend-specialist?, frontend-specialist?]
  primary_skills: [deep-research, architecture-designer]
  supporting_skills: [legacy-modernizer?, database-skills?]
  project_overview:
    purpose: <string>
    tech_stack: [<string>]
    architecture: <string>
  key_components: [<string>]
  patterns_and_conventions: [<string>]
  development_setup: [<step>]
  dependencies: [<string>]
  knowledge_gaps: [<string>] | []
```
