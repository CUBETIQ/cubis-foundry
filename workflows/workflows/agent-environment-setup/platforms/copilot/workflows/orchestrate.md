---
command: "/orchestrate"
description: "Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership, validation gates, and repeat-until-good iteration."
triggers: ["orchestrate", "coordinate", "multi-area", "cross-team", "handoff"]
---

# Orchestrate Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps multi-workstream coordination deterministic across regenerated platforms.

# CHANGED: skill routing — added `skill-creator` when orchestration spans canonical skill edits, generator updates, and platform parity work.

# CHANGED: added RUG validation loop — every workstream output is independently validated before integration.

# CHANGED: added researcher and validator agents to routing — pre-implementation research and post-implementation quality gates.

## When to use

Use this when a task spans backend, frontend, data, testing, and release concerns.

## Routing

- Primary coordinator: `@orchestrator`
- Pre-implementation research: `@researcher`
- Architecture decisions: `@backend-specialist`
- Data model/query risk: `@database-architect`
- UX/client behavior: `@frontend-specialist`
- Security review: `@security-auditor`
- Verification strategy: `@test-engineer`
- Post-implementation validation: `@validator`
- Rollout plan: `@devops-engineer`

## Workflow steps

### Phase 1: Research

1. `@researcher` surveys the affected codebase areas and produces structured findings.
2. `@orchestrator` reviews findings and decomposes work into workstreams with acceptance criteria.

### Phase 2: Plan

3. Break workstreams into a DAG — identify which are independent (parallel) and which have dependencies (serial).
4. Assign one primary specialist agent per workstream.
5. Define measurable acceptance criteria for each workstream.

### Phase 3: Execute with validation loop

6. Delegate each workstream to its specialist agent with full context, scope, and acceptance criteria.
7. After each specialist completes, `@validator` independently reviews the output against acceptance criteria.
8. If validation fails: provide specific feedback and re-delegate to the specialist (max 3 iterations per workstream).
9. If validation passes: mark workstream as complete and proceed.

### Phase 4: Integrate

10. Merge validated outputs into a single implementation plan.
11. Resolve cross-workstream conflicts.
12. Run integration validation (build, lint, test suite).

### Phase 5: Report

13. Produce final orchestration result with validation evidence per workstream.
14. List remaining risks and recommended follow-up actions.

## DAG ordering rules

- Workstreams that modify independent files can run in parallel.
- Schema/migration workstreams run before service/API workstreams.
- API contract workstreams run before consumer/frontend workstreams.
- Security review workstream runs after implementation, before deployment.
- Test workstream runs after the code it tests is implemented.

## Context notes

- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.
- Every delegation to a specialist must include: full context, specific scope, acceptance criteria, anti-laziness instructions, and specification adherence constraints.

## Skill Routing

- Primary skills: `skill-creator`
- Supporting skills (optional): `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`
- Use `skill-creator` when coordination spans the skill catalog or generated mirrors. Otherwise pick the single language skill that best matches the dominant code path.

## Verification

- `@validator` performs independent validation after each workstream.
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.
- Integration check: build + lint + test must pass after all workstreams merge.

## Output Contract

```yaml
ORCHESTRATE_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [researcher?, validator?, backend-specialist?, database-architect?, frontend-specialist?, security-auditor?, test-engineer?, devops-engineer?]
  primary_skills: [architecture-designer, skill-creator]
  supporting_skills: [api-designer?, database-skills?, typescript-pro?]
  scope_and_assumptions: [<string>]
  research_summary: <string>
  workstreams:
    - owner: <agent-id>
      deliverable: <string>
      acceptance_criteria: [<string>]
      validation_verdict: PASS | FAIL | PASS_WITH_WARNINGS
      iterations: <number>
  execution_order: [<string>]
  dag_waves:
    - wave: 1
      parallel_tasks: [<workstream-id>]
    - wave: 2
      parallel_tasks: [<workstream-id>]
  gates:
    validation: [<string>]
    test: [<string>]
    rollout: [<string>]
  open_risks: [<string>] | []
  follow_up: [<string>] | []
```
