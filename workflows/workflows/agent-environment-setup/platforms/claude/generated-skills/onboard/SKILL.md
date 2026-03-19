---
name: onboard
description: "Codebase onboarding workflow: explore and understand an unfamiliar codebase, create a plan for working in it, and generate developer documentation."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "onboard"
  platform: "Claude Code"
  command: "/onboard"
compatibility: Claude Code
---
# onboard Workflow
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