---
command: "/spec"
description: "Create or refresh a Git-tracked spec pack for non-trivial work, including acceptance criteria, traceability, architecture impact, and next-route handoff."
triggers:
  [
    "spec",
    "sdd",
    "source of truth",
    "traceability",
    "acceptance criteria",
    "openspec",
    "requirements",
    "architecture impact",
  ]
---

# Spec Workflow

## When to use

Use this for non-trivial work that needs durable planning in Git before implementation: medium or large features, multi-step changes, cross-session work, migrations, risky refactors, or any request that needs explicit acceptance and traceability.

## Routing

- Primary coordinator: `.agent/agents/project-planner`
- Traceability and requirements support: `.agent/agents/researcher`
- Cross-domain coordination: `.agent/agents/orchestrator`
- Documentation and structure support: `.agent/agents/documentation-writer`

## Skill Routing

- Primary skills: `spec-driven-delivery`, `sadd`
- Supporting skills (optional): `system-design`, `architecture-doc`, `deep-research`, `api-design`, `database-design`, `tech-doc`
- Start with `spec-driven-delivery` for the pack structure and handoff contract. Add `sadd` when mining requirements into testable assertions, `system-design` or `architecture-doc` when the spec changes structure, and `deep-research` only when repo-local evidence is insufficient.

## Workflow steps

1. Determine whether the task is non-trivial enough to justify a spec pack.
2. Find an existing `docs/specs/<spec-id>/` pack or create a new stable `spec_id`.
3. Write or refresh the spec pack with brief, acceptance, tasks, traceability, and handoff files.
4. Record `architecture_impact`, `doc_impact`, and any required updates to `PRODUCT.md`, `ARCHITECTURE.md`, `ENGINEERING_RULES.md`, `TECH.md`, or `ROADMAP.md`.
5. Identify the next execution route and hand off without replanning the same work.

## Context notes

- Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist because they define the accepted product direction, architecture contract, and current state.
- Prefer repo evidence first; escalate to `deep-research` only when freshness, public comparison, or explicit research requests require it.
- Keep spec packs lean. Trivial one-step tasks should stay on the lightweight path with no new spec directory.

## Verification

- `spec_id` and `spec_root` are stable and explicit.
- Acceptance criteria are testable and traceable.
- Task dependencies form a valid execution order.
- `architecture_impact`, `doc_impact`, and `traceability_status` are present.

## Output Contract

```yaml
SPEC_WORKFLOW_RESULT:
  primary_agent: project-planner
  supporting_agents: [researcher?, orchestrator?, documentation-writer?]
  primary_skills: [spec-driven-delivery, sadd]
  supporting_skills: [system-design?, architecture-doc?, deep-research?, api-design?, database-design?, tech-doc?]
  spec_id: <string>
  spec_root: docs/specs/<spec-id>
  architecture_impact:
    summary: <string>
    affects_structure: true | false
    affects_design_system: true | false
    affects_testing_strategy: true | false
  doc_impact: none | tech | rules | both
  traceability_status: complete | partial | blocked
  documents:
    created: [<path>] | []
    updated: [<path>] | []
  next_route: </create | /implement-track | /orchestrate | /architecture | direct>
  gaps: [<string>] | []
```

> **Antigravity note:** Use Agent Manager for parallel agent coordination. Workflow files are stored under `.agent/workflows/`.
