# Workflow Prompt: /onboard

Codebase onboarding workflow: explore and understand an unfamiliar codebase, create a plan for working in it, and generate developer documentation.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `deep-research`, `system-design`, `tech-doc`, `architecture-doc`.
- Local skill file hints if installed: `.github/skills/deep-research/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/tech-doc/SKILL.md`, `.github/skills/architecture-doc/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Onboard Workflow

## When to use

Use when working with an unfamiliar codebase for the first time. Produces a comprehensive understanding and developer documentation.

## Agent Chain

`explorer` → `planner` → `docs-writer`

## Routing

1. **Explore**: `@explorer` performs a deep codebase survey — directory structure, architecture, key files, patterns, dependencies.
2. **Plan**: `@planner` organizes findings into a working knowledge model — how to build, test, deploy, and contribute.
3. **Document**: `@docs-writer` produces a developer onboarding guide.

## Skill Routing

- Primary skills: `deep-research`, `system-design`
- Supporting skills (optional): `tech-doc`, `architecture-doc`

## Context notes

- Provide the project directory or repository to onboard to.
- The onboarding guide targets developers new to the codebase.

## Workflow steps

1. Explorer surveys: directory tree, package manifests, entry points, config files, README.
2. Explorer traces key paths: request handling, data flow, build pipeline.
3. Planner organizes findings: project purpose, architecture, key patterns, dev workflow.
4. Docs-writer produces an onboarding guide: setup, dev commands, code organization, key patterns.

## Verification

- Onboarding guide covers: setup, build, test, deploy, and code navigation.
- All referenced paths and commands verified against the codebase.
- A new developer can follow the guide to get productive.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: docs-writer
  supporting_agents: [explorer, planner]
  onboarding_guide: <path>
  sections_covered: [setup, build, test, deploy, navigation]
  accuracy_verified: <boolean>
  follow_up_items: [<string>] | []
```
