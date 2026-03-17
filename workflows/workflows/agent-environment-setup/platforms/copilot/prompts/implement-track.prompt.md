# Workflow Prompt: /implement-track

Execute large work in milestones with explicit quality gates and status updates.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `system-design`, `api-design`, `database-design`, `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `react`, `nextjs`.
- Local skill file hints if installed: `.github/skills/system-design/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/typescript-best-practices/SKILL.md`, `.github/skills/javascript-best-practices/SKILL.md`, `.github/skills/python-best-practices/SKILL.md`, `.github/skills/golang-best-practices/SKILL.md`, `.github/skills/react/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Implement Track Workflow

## When to use

Use this for large-scale implementation work that spans multiple sessions or milestones and needs progress tracking with quality gates.

## Routing

- Primary coordinator: `@orchestrator`
- Implementation agents: determined by task domain
- Quality gate: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the implementation plan, milestone definitions, and acceptance criteria per milestone.
- Reuse `docs/specs/<spec-id>/` when present instead of maintaining a separate progress source of truth.
- Read `ENGINEERING_RULES.md` first and `docs/foundation/TECH.md` next before starting milestone execution. Use `## Build And Validation` for the validated build sequence and `## Key Commands` for test/lint commands.

## Skill Routing

- Primary skills: `system-design`, `api-design`
- Supporting skills (optional): `database-design`, `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `react-expert`, `nextjs-developer`
- Start with `system-design` for milestone planning. Load domain-specific skills per milestone based on implementation needs.

## Workflow steps

1. Review implementation plan and confirm milestone boundaries.
2. Execute current milestone with focused implementation.
3. Run quality gate validation at milestone completion.
4. Update progress tracking and capture status.
5. Adjust remaining plan, spec traceability, and doc refresh needs based on learnings.
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
  supporting_skills: [database-design?, typescript-pro?, javascript-pro?, python-pro?, golang-pro?, react-expert?, nextjs-developer?]
  milestones:
    - id: <milestone-id>
      description: <string>
      status: completed | in_progress | pending
      acceptance_criteria_met: [<string>]
      validation_evidence: <string>
  overall_progress: <percentage>
  scope_changes: [<string>] | []
  spec_id: <string> | null
  spec_root: docs/specs/<spec-id> | null
  traceability_status: complete | partial | blocked
  doc_impact: none | tech | rules | both
  follow_up_items: [<string>] | []
```
