---
command: "/implement-track"
description: "Execute large work in milestones with explicit quality gates and status updates."
triggers: ["track", "milestone", "delivery", "progress", "execution"]
---
# Implement Track Workflow

# CHANGED: routing — added explicit milestone coordination owners — prevents generic fallback and clarifies who runs long execution tracks.
# CHANGED: output contract — converted free-form bullets into structured YAML — keeps milestone state machine-readable for resumability.

## When to use
Use this for medium/large efforts where progress visibility is required.

## Routing
- Primary coordinator: `@orchestrator`
- Milestone planning: `@project-planner`
- Verification gates: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `java-pro`, `csharp-pro`, `kotlin-pro`, `rust-pro`, `php-pro`, `ruby-pro`, `c-pro`, `cpp-pro`, `dart-pro`, `swift-pro`
- Supporting skills (optional): `skill-creator`
- Keep one primary language skill per milestone. Add `skill-creator` only when a milestone is specifically about rebuilding the skill catalog.

## Workflow steps
1. Split into milestone-sized deliverables.
2. Define done criteria per milestone.
3. Execute one milestone at a time.
4. Validate before moving forward.
5. Publish progress and remaining risks.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
IMPLEMENT_TRACK_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [project-planner?, test-engineer?]
  primary_skills: [architecture-designer, skill-creator]
  supporting_skills: [api-designer?, database-skills?, typescript-pro?]
  milestones:
    done: [<string>]
    in_progress: [<string>]
    next: [<string>]
  gate_status: [<string>]
  blockers: [<string>] | []
  dependencies: [<string>] | []
  eta_confidence: <low|medium|high>
  next_handoff:
    plan_handoff: <PLAN_HANDOFF|null>
```
