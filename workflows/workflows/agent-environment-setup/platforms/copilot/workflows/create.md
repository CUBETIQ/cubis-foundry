---
command: "/create"
description: "Implement feature work with minimal blast radius and clear verification checkpoints."
triggers: ["create", "build", "implement", "feature", "develop"]
---

# Create Workflow

## When to use

Use this for net-new implementation after design is stable.

## Routing

- Primary coordinator: `@orchestrator`
- Backend implementation: `@backend-specialist`
- Frontend implementation: `@frontend-specialist`
- Mobile implementation: `@mobile-developer`
- Verification support: `@test-engineer`

## Context notes

- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.
- Read `ENGINEERING_RULES.md` first and `TECH.md` next for non-trivial work so new code follows the declared architecture and design-system rules.

## Skill Routing

- Primary skills: `typescript-best-practices`, `javascript-best-practices`, `python-best-practices`, `golang-best-practices`, `java-best-practices`, `csharp-best-practices`, `kotlin-best-practices`, `rust-best-practices`, `php-best-practices`, `php-best-practices`, `rust-best-practices`, `rust-best-practices`, `expo-app`, `swift-best-practices`
- Supporting skills (optional): `api-design`, `api-design`, `javascript-best-practices`, `nestjs`, `fastapi`, `api-design`, `drizzle-orm`, `database-design`, `mcp-server-builder`, `stitch`, `react`, `react`, `nextjs`, `frontend-design`, `frontend-design`, `frontend-design`, `performance-testing`, `skill-creator`, `stripe-integration`, `ci-cd-pipeline`, `frontend-design`
- Pick one primary language skill from repo signals or touched files. Add the narrowest specialist only when the feature is clearly backend or frontend framework-specific.
- If the request references Stitch screens, artifacts, design-to-code, or UI sync, add `stitch` first and route the implementation through the frontend or mobile specialist based on the destination surface.

## Workflow steps

1. Confirm target files and contracts.
2. Implement smallest coherent increment.
3. Validate behavior with focused tests.
4. Capture `doc_impact` when the feature changes architecture, boundaries, scale, or design-system rules.
5. Capture remaining gaps and follow-ups.

## Verification

- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract

```yaml
CREATE_WORKFLOW_RESULT:
  primary_agent: orchestrator
  supporting_agents: [backend-specialist?, frontend-specialist?, mobile-developer?, test-engineer?]
  primary_skills: [<dominant-language-skill>]
  supporting_skills: [stitch?, <framework-specific-skills-used>]
  implemented_scope:
    summary: <string>
    changed_artifacts: [<path-or-artifact>]
  behavioral_impact: [<string>]
  doc_impact: none | tech | rules | both
  verification:
    checks_run: [<command-or-test>]
    evidence: [<string>]
    gaps: [<string>] | []
  follow_up_items: [<string>] | []
```
