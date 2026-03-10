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

# Run this when joining a new codebase or helping someone understand an existing project's architecture, conventions, and key paths.

## When to use

Use this when starting work on an unfamiliar codebase, onboarding a new team member, or needing a structured understanding of a project's architecture before making changes.

## Routing

- Primary investigator: `@researcher`
- Architecture analysis: `@code-archaeologist`
- Convention documentation: `@documentation-writer`

## Workflow steps

### Phase 1: Surface scan

1. `@researcher` maps the directory structure and identifies key entry points.
2. Read package.json/pyproject.toml/go.mod for dependencies and scripts.
3. Check for existing documentation (README, CONTRIBUTING, architecture docs).
4. Identify framework and language versions in use.

### Phase 2: Architecture mapping

5. `@code-archaeologist` traces request flow from entry point to response.
6. Identify architectural patterns in use (MVC, hexagonal, microservices, monolith).
7. Map data flow: where data enters, how it transforms, where it persists.
8. List external dependencies and integration points.

### Phase 3: Convention discovery

9. Identify naming conventions (files, variables, functions, components).
10. Document testing patterns and test file locations.
11. Note error handling patterns.
12. Check for code generation or build pipeline artifacts.
13. Identify configuration management approach.

### Phase 4: Report

14. Produce a structured orientation report covering architecture, conventions, key files, and common tasks.

## Context notes

- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach README, architecture diagrams, or known entry points when context is incomplete.
- Focus on actionable understanding — what a new contributor needs to start making changes, not an exhaustive catalog.
- Prefer reading actual code over inferring from file names.

## Skill Routing

- Primary skills: `deep-research`
- Supporting skills (optional): `architecture-designer`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`

## Verification

- Orientation report covers architecture, conventions, key files, and common tasks.
- Entry points and data flow are traced from actual code, not guessed from names.
- Gaps and gotchas are explicitly documented.

## Output Contract

```yaml
ONBOARD_RESULT:
  primary_agent: researcher
  supporting_agents: [code-archaeologist, documentation-writer?]
  project:
    name: <string>
    language: <string>
    framework: <string>
    architecture_pattern: <string>
  entry_points: [<file-path>]
  key_directories:
    - path: <string>
      purpose: <string>
  conventions:
    naming: <string>
    testing: <string>
    error_handling: <string>
  dependencies:
    runtime: [<string>]
    dev: [<string>]
    external_services: [<string>]
  common_tasks:
    build: <command>
    test: <command>
    dev: <command>
    lint: <command>
  documentation_gaps: [<string>] | []
  gotchas: [<string>] | []
```
