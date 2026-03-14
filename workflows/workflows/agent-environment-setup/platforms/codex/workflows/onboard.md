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

- Primary specialist: `the researcher posture`
- Architecture mapping: `the code-archaeologist posture`
- Domain specialists as needed: `the backend-specialist posture`, `the frontend-specialist posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Provide the repo URL, focus areas, and any specific questions to answer during onboarding.

## Skill Routing

- Primary skills: `architecture-doc`, `system-design`
- Supporting skills (optional): `system-design`, `database-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`
- Start with `architecture-doc` for systematic exploration and `system-design` for architecture mapping. Add `system-design` for undocumented systems.

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
  primary_skills: [architecture-doc, system-design]
  supporting_skills: [system-design?, database-design?]
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

> **Codex note:** This workflow runs inside a network-restricted sandbox. Specialists are reasoning postures defined in AGENTS.md, not spawned processes.
