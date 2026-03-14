---
command: "/build-feature"
description: "End-to-end feature implementation from requirements through delivery with quality gates at every stage."
triggers: ["build-feature", "build feature", "feature end-to-end", "full feature", "implement feature"]
---

# Build Feature Workflow

## Purpose

Drive a feature from requirements to merged code with structured quality gates that catch problems before they compound. Unlike `/create` (single implementation pass) or `/implement-track` (milestone management), this workflow owns the complete feature lifecycle including planning, implementation, testing, review, and delivery.

## When to use

Use this when a feature needs the full lifecycle: requirements clarification, design, implementation, testing, review, and delivery readiness.

## Routing

- Primary coordinator: `@orchestrator`
- Planning: `@project-planner`
- Implementation: `@backend-specialist`, `@frontend-specialist`, `@mobile-developer`
- Verification: `@test-engineer`, `@validator`
- Review: `@security-auditor`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach feature requirements, acceptance criteria, design references, and target branch or deployment context.

## Skill Routing

- Primary skills: `architecture-designer`, `api-designer`
- Supporting skills (optional): `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `react-expert`, `nextjs-developer`, `testing-patterns`, `webapp-testing`, `security-engineer`, `database-skills`, `ci-cd-pipelines`
- Start with `architecture-designer` for decomposition and `api-designer` for contract definition. Add language and framework skills based on repo signals. Add `testing-patterns` for verification design and `security-engineer` for sensitive features.

## Steps

1. **Requirements gate** — Clarify scope, acceptance criteria, and non-functional requirements. `@project-planner` owns. Gate: written acceptance criteria exist before proceeding.
2. **Design gate** — Define interfaces, data models, and integration points. `@orchestrator` owns. Gate: contracts are stable and reviewed.
3. **Implementation** — Build in smallest coherent increments. `@backend-specialist` / `@frontend-specialist` / `@mobile-developer` own. Gate: each increment compiles and passes lint.
4. **Test gate** — Write unit, integration, and edge-case tests covering acceptance criteria. `@test-engineer` owns. Gate: all tests pass, critical paths covered.
5. **Security gate** — Scan for input validation, auth, secrets exposure, and dependency vulnerabilities. `@security-auditor` owns. Gate: no critical or high findings unaddressed.
6. **Review gate** — Full code review against codebase conventions. `@validator` owns. Gate: review approved with no blocking findings.
7. **Delivery** — Confirm CI passes, changelog drafted, and branch is merge-ready. `@orchestrator` owns.

## Verification

- Acceptance criteria verified with test evidence at step 4.
- Security scan clean at step 5.
- Code review approved at step 6.
- CI pipeline green before marking complete.

## Agents Involved

- @orchestrator — coordinates lifecycle and resolves cross-cutting concerns
- @project-planner — requirements clarification and task decomposition
- @backend-specialist — server-side implementation
- @frontend-specialist — client-side implementation
- @mobile-developer — mobile implementation (when applicable)
- @test-engineer — test design and execution
- @security-auditor — security review
- @validator — final quality validation

## Output

```yaml
BUILD_FEATURE_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [project-planner, backend-specialist?, frontend-specialist?, mobile-developer?, test-engineer, security-auditor, validator]
  primary_skills: [architecture-designer, api-designer]
  supporting_skills: [<language-skill>, testing-patterns?, security-engineer?]
  feature:
    summary: <string>
    acceptance_criteria: [<string>]
  gates:
    requirements: pass | fail
    design: pass | fail
    tests: pass | fail
    security: pass | fail
    review: pass | fail
  implementation:
    changed_artifacts: [<path-or-artifact>]
    tests_written: [<test-file-path>]
  delivery:
    ci_status: pass | fail
    merge_ready: true | false
  follow_up_items: [<string>] | []
```
