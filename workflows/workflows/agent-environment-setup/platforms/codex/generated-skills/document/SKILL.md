---
name: document
description: "Documentation workflow: explore the codebase, generate accurate documentation, and review it for quality."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "document"
  platform: "Codex"
  command: "/document"
compatibility: Codex
---
# document Workflow
# Document Workflow

## When to use

Use for generating READMEs, API documentation, architecture decision records, changelogs, developer guides, or any documentation task.

## Agent Chain

`explorer` → `docs-writer` → `reviewer`

## Routing

1. **Explore**: `@explorer` reads the codebase area to be documented — maps structure, public APIs, and key patterns.
2. **Write**: `@docs-writer` produces documentation based on exploration findings.
3. **Review**: `@reviewer` verifies documentation accuracy against the actual code.

## Skill Routing

- Primary skills: `tech-doc`, `architecture-doc`
- Supporting skills (optional): `deep-research`, `code-review`

## Context notes

- Specify the documentation type needed (README, API docs, ADR, changelog, guide).
- All documentation must be verified against the actual codebase.

## Workflow steps

1. Explorer maps the relevant code: public APIs, entry points, configuration, patterns.
2. Docs-writer produces documentation matching the project's existing doc style.
3. Reviewer checks every code reference, path, and command against the actual codebase.
4. If inaccuracies are found, docs-writer corrects them.

## Verification

- All code references and file paths verified against the actual codebase.
- Documentation matches the project's existing style and format.
- Commands and examples are runnable.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: docs-writer
  supporting_agents: [explorer, reviewer]
  docs_created: [<path>]
  docs_updated: [<path>]
  accuracy_verified: <boolean>
  follow_up_items: [<string>] | []
```