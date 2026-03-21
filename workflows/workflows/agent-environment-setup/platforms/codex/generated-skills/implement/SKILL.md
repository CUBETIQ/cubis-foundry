---
name: implement
description: "End-to-end feature implementation: explore, plan, implement, test, review, and optionally run the Stitch UI sequence for design-first screen generation."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "implement"
  platform: "Codex"
  command: "/implement"
compatibility: Codex
---
# Implement Workflow
## When to use

Use for building new features, refactors, documentation refreshes, onboarding tasks, or post-design implementation work that needs the full lifecycle: planning, implementation, testing, and review.

## Agent Chain

`explorer` -> `planner` -> `implementer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` maps the code area and existing patterns when the task is non-trivial.
2. **Plan**: `@planner` reads the requirements and existing code, then produces an implementation plan.
3. **Implement**: `@implementer` executes the plan, writing production-quality code.
4. **Test**: `@tester` writes and runs tests verifying the implementation.
5. **Review**: `@reviewer` performs quality and security review, then approves or requests changes.

## Skill Routing

- Primary skills: `api-design`, `typescript-best-practices`
- Supporting skills (optional): `spec-driven-delivery`, `system-design`, `unit-testing`, `integration-testing`, `playwright-interactive`, `code-review`, `owasp-security-review`, `frontend-design`, `stitch-prompt-enhancement`, `stitch-design-orchestrator`, `stitch-design-system`, `stitch-implementation-handoff`

## Context notes

- Provide the feature requirements, acceptance criteria, and any design constraints.
- Implementer follows existing codebase patterns and conventions.
- Use this workflow for doc-only or refactor-heavy work when you want one coordinated pass instead of separate routes.
- If the task is primarily about shaping a screen, design system, or Stitch prompt, prefer `/design-screen` or `/design-system` first and return here only for implementation/handoff.

## Stitch UI mode

Use `/implement` only after `/design-screen` or `/design-system` resolved the design state and the work now needs implementation or implementation handoff.

1. Load `frontend-design` first, starting with `visual-direction` and `design-tokens`.
2. Load `stitch-prompt-enhancement` before any Stitch tool call.
3. If `docs/foundation/DESIGN.md` is missing, stale, or the work spans multiple screens, run `stitch-design-system` and mirror the result to `.stitch/DESIGN.md`.
4. Verify `stitch_get_status`, `mcp_gateway_status`, and `stitch_list_enabled_tools`.
5. Reuse an existing Stitch project when the work belongs to the same app or feature line. Call `list_projects` before `create_project`, and call `list_screens` before deciding whether the next step is a fresh generation or an edit.
6. Choose the smallest Stitch tool path: `generate_screen_from_text`, `edit_screens`, `generate_variants`, or design-system tools only when the design system itself is the task.
7. Default to `GEMINI_3_1_PRO` for complex or multi-screen UI work. Use `GEMINI_3_FLASH` only for speed-first drafts or narrow edits.
8. Surface Stitch suggestions before retrying. Allow at most two automatic retries with backoff.
9. If a Stitch generation call times out, check `list_screens` before treating it as failed.
10. Fetch the final artifact with `get_screen`, then run `stitch-implementation-handoff` before normal implementation, test, and review.

## Workflow steps

1. Explorer maps the relevant code and patterns when the request is not trivial.
2. Planner analyzes requirements and produces a structured implementation plan.
3. Implementer executes the plan step by step, verifying compilation after each change.
4. Tester writes tests for the new code and runs the relevant test suite.
5. Reviewer evaluates code quality, patterns, correctness, and security.
6. If changes are requested, implementer applies fixes and the cycle repeats from step 4.

## Verification

- All planned changes implemented and code compiles without errors.
- Tests pass and cover the new functionality.
- Code review approved with no critical findings.
- For Stitch UI mode, design context is resolved before generation and the final implementation reuses repo-native components and tokens.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: implementer
  supporting_agents: [explorer, planner, tester, reviewer]
  changed_artifacts: [<path>]
  tests_status: <pass|fail>
  review_status: <approve|request_changes>
  follow_up_items: [<string>] | []
```