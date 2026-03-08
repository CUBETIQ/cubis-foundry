---
command: "/orchestrate"
description: "Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership and handoff."
triggers: ["orchestrate", "coordinate", "multi-area", "cross-team", "handoff"]
---
# Orchestrate Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps multi-workstream coordination deterministic across regenerated platforms.
# CHANGED: skill routing — added `skill-creator` when orchestration spans canonical skill edits, generator updates, and platform parity work.

## When to use
Use this when a task spans backend, frontend, data, testing, and release concerns.

## Routing
- Primary coordinator: `@orchestrator`
- Architecture decisions: `@backend-specialist`
- Data model/query risk: `@database-architect`
- UX/client behavior: `@frontend-specialist`
- Security review: `@security-auditor`
- Verification strategy: `@test-engineer`
- Rollout plan: `@devops-engineer`

## Workflow steps
1. Break the request into workstreams with owners.
2. Request one primary specialist output per workstream.
3. Merge outputs into a single implementation plan.
4. Resolve conflicts before implementation.
5. End with a release-risk summary.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `skill-creator`
- Supporting skills (optional): `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`
- Use `skill-creator` when coordination spans the skill catalog or generated mirrors. Otherwise pick the single language skill that best matches the dominant code path.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
ORCHESTRATE_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [backend-specialist?, database-architect?, frontend-specialist?, security-auditor?, test-engineer?, devops-engineer?]
  primary_skills: [architecture-designer, skill-creator]
  supporting_skills: [api-designer?, database-skills?, typescript-pro?]
  scope_and_assumptions: [<string>]
  workstreams:
    - owner: <agent-id>
      deliverable: <string>
  execution_order: [<string>]
  gates:
    test: [<string>]
    rollout: [<string>]
  open_risks: [<string>] | []
```
