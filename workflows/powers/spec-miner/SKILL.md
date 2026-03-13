---
name: spec-miner
description: "Use when reverse-engineering legacy or undocumented systems into structured specifications with code-grounded evidence and EARS-format requirements."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Spec Miner

## Purpose

Use when reverse-engineering legacy or undocumented systems into structured specifications with code-grounded evidence and EARS-format requirements.

## When to Use

- Understanding legacy or undocumented systems by extracting behavior from code.
- Creating documentation for existing codebases that lack specifications.
- Onboarding onto unfamiliar projects by mapping structure, data flows, and business logic.
- Planning enhancements or migrations that require understanding current behavior first.
- Extracting implicit requirements from implementations for formal specification.

## Instructions

1. Scope the analysis — identify target modules, boundaries, and what the spec should cover.
2. Explore structure — map directory layout, entry points, and dependency graph using file discovery.
3. Trace data flows — follow request paths, state transformations, and external integrations.
4. Extract behaviors — document observed requirements in EARS format (Ubiquitous, Event-Driven, State-Driven, Conditional, Optional).
5. Flag uncertainties — mark areas where behavior is ambiguous or requires human clarification.
6. Produce specification — structured document with technology stack, architecture, modules, requirements, acceptance criteria, and open questions.

### Baseline standards

- Ground every finding in code evidence with file paths and line references.
- Distinguish facts (observed in code) from inferences (reasonable assumptions).
- Operate with dual mindset: Architecture Hat (structure, data flows) and QA Hat (behaviors, edge cases).
- Document security, authentication, and error handling patterns explicitly.
- Include external integrations, configuration, and environment dependencies.

### Constraints

- Never assume behavior without code evidence.
- Never skip security or error handling paths during analysis.
- Never generate a specification without thorough codebase exploration.
- Always include code locations for every documented behavior.
- Always mark uncertainties and questions separately from confirmed findings.

## Output Format

Save as `specs/{project_name}_reverse_spec.md`:

1. Technology stack and architecture overview
2. Module and directory structure
3. Observed requirements in EARS format
4. Non-functional observations (performance, security, scalability)
5. Inferred acceptance criteria
6. Uncertainties and questions
7. Recommendations for improvement

## References

No additional reference files.

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Reverse-engineer the authentication flow in this legacy codebase"
- "Create a specification document for this undocumented API service"
- "Map the data flows and business logic in this module for onboarding"
