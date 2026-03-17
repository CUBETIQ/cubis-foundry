# Workflow Prompt: /orchestrate

Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership, validation gates, and repeat-until-good iteration.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `system-design`, `api-design`, `database-design`, `deep-research`, `mcp-server-builder`, `tech-doc`, `prompt-engineering`, `skill-creator`.
- Local skill file hints if installed: `.github/skills/system-design/SKILL.md`, `.github/skills/api-design/SKILL.md`, `.github/skills/database-design/SKILL.md`, `.github/skills/deep-research/SKILL.md`, `.github/skills/mcp-server-builder/SKILL.md`, `.github/skills/tech-doc/SKILL.md`, `.github/skills/prompt-engineering/SKILL.md`, `.github/skills/skill-creator/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Orchestrate Workflow

## When to use

Use this when a task spans multiple domains (backend + frontend, security + infrastructure, etc.) and requires coordinated specialist work with validation between steps.

## Routing

- Primary coordinator: `@orchestrator`
- Specialist routing determined by task decomposition — delegates to `@backend-specialist`, `@frontend-specialist`, `@database-architect`, `@security-auditor`, `@devops-engineer`, `@test-engineer`, `@mobile-developer`, or other specialist agents as needed.
- Validation support: `@validator`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach the full task description, constraints, acceptance criteria, and relevant context when starting.
- Read `ENGINEERING_RULES.md` and `docs/foundation/TECH.md` before decomposing non-trivial work. Check `docs/foundation/TECH.md` for build/validation commands and `docs/foundation/PRODUCT.md` for domain glossary. Then reuse any existing `docs/specs/<spec-id>/` pack as the handoff source of truth.

## Skill Routing

- Primary skills: `system-design`, `api-design`
- Supporting skills (optional): `database-design`, `deep-research`, `mcp-server-builder`, `openai-docs`, `prompt-engineering`, `skill-creator`
- Start with `system-design` for system design coordination and `api-design` for integration contracts. Add `deep-research` before implementation when the coordination challenge depends on fresh external facts or public comparison.

## Workflow steps

1. Decompose the task into discrete work items with acceptance criteria.
2. Identify dependencies and determine execution order (DAG).
3. Delegate each task to the best specialist agent with full context.
4. Validate each deliverable against acceptance criteria via independent validation.
5. Iterate on failed validations with specific feedback (max 3 iterations).
6. Surface `doc_impact` when the coordinated work changes architecture, boundaries, scale, or the design system.
7. Integrate outputs, verify cross-task consistency, and report results.

## Verification

- Each task validated independently against its acceptance criteria.
- Cross-task consistency check after integration.
- Run any applicable automated tests or checks.
- Final validation pass on combined result.

## Output Contract

```yaml
ORCHESTRATE_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [<specialist-agents-used>]
  primary_skills: [system-design, api-design]
  supporting_skills: [<supporting-skills-used>]
  spec_id: <string> | null
  spec_root: docs/specs/<spec-id> | null
  task_count: <number>
  completed: <number>
  failed: <number>
  tasks:
    - id: <task-id>
      agent: <agent-name>
      status: completed | failed | skipped
      iterations: <number>
      validation_evidence: <string>
  integration_status: clean | conflicts_resolved | issues_remaining
  doc_impact: none | tech | rules | both
  remaining_risks: [<string>] | []
  follow_up_actions: [<string>] | []
```
