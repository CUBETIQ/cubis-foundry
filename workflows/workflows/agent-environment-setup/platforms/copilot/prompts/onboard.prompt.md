# Workflow Prompt: /onboard

Survey an unfamiliar codebase, map its architecture, identify patterns and conventions, and produce a structured orientation report for new contributors.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `deep-research`, `system-design`, `database-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`.
- Local skill file hints if installed: `.github/skills/deep-research/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
- Read `ENGINEERING_RULES.md` first, then `docs/foundation/TECH.md`, `docs/foundation/PRODUCT.md`, and `docs/foundation/ARCHITECTURE.md` when present so onboarding distinguishes the intended contract from current implementation reality. Use the `## Domain Glossary` in PRODUCT.md to learn project-specific terms, and `## Build And Validation` in TECH.md to set up the local environment.

## Skill Routing

- Primary skills: `deep-research`, `system-design`
- Supporting skills (optional): `legacy-modernizer`, `database-design`, `typescript-pro`, `javascript-pro`, `python-pro`
- Start with `deep-research` for systematic exploration and `system-design` for architecture mapping. Add `legacy-modernizer` for undocumented systems. Prefer repo evidence first; use external sources only when setup or dependency behavior cannot be confirmed locally.

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
  primary_skills: [deep-research, system-design]
  supporting_skills: [legacy-modernizer?, database-design?]
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
