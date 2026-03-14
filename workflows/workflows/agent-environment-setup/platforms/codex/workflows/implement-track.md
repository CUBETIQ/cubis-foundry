---
command: "/implement-track"
description: "Execute large work in milestones with explicit quality gates and status updates."
triggers: ["track", "milestone", "delivery", "progress", "execution"]
---

# Implement Track Workflow

## When to use

Use this for large-scale implementation work that spans multiple sessions or milestones and needs progress tracking with quality gates.

## Routing

- Primary coordinator: `the orchestrator posture`
- Implementation agents: determined by task domain
- Quality gate: `the validator posture`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the implementation plan, milestone definitions, and acceptance criteria per milestone.

## Skill Routing

- Primary skills: `system-design`, `api-design`
- Supporting skills (optional): `database-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `react`, `nextjs`
- Start with `system-design` for milestone planning. Load domain-specific skills per milestone based on implementation needs.

## Workflow steps

1. Review implementation plan and confirm milestone boundaries.
2. Execute current milestone with focused implementation.
3. Run quality gate validation at milestone completion.
4. Update progress tracking and capture status.
5. Adjust remaining plan based on learnings.
6. Proceed to next milestone or report completion.

## Verification

- Each milestone has clear acceptance criteria that are verified.
- Quality gate passed before proceeding to next milestone.
- Progress tracker updated with evidence of completion.
- Remaining milestones adjusted for any scope changes.

## Output Contract

```yaml
IMPLEMENT_TRACK_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [<milestone-agents>]
  primary_skills: [system-design, api-design]
  supporting_skills: [database-design?, typescript-best-practices?, javascript-best-practices?, python-best-practices?, golang-best-practices?, react?, nextjs?]
  milestones:
    - id: <milestone-id>
      description: <string>
      status: completed | in_progress | pending
      acceptance_criteria_met: [<string>]
      validation_evidence: <string>
  overall_progress: <percentage>
  scope_changes: [<string>] | []
  follow_up_items: [<string>] | []
```

> **Codex note:** This workflow runs inside a network-restricted sandbox. Specialists are reasoning postures defined in AGENTS.md, not spawned processes.
