---
name: playwright-web-qa
description: "Use when running charter-driven web QA through Playwright MCP with deterministic evidence, runtime traces, and report-ready browser artifacts."
---

# Playwright Web QA

## Purpose

Provide a runtime-oriented browser QA workflow for validating real user journeys through Playwright MCP. This skill is for live charter execution and evidence review, not broad suite design.

## When to Use

- Running a manual or AI-authored QA charter against a real web app
- Capturing screenshots, DOM state, console logs, network evidence, or accessibility evidence
- Reproducing a bug with deterministic browser artifacts
- Checking whether a page is blocked, broken, or visibly regressed before test-suite authoring

## Instructions

1. Confirm the Playwright MCP server is reachable before planning steps.
2. Require a QA charter with `flow`, `success_criteria`, `base_url`, and `steps`.
3. Start from an explicit URL state and avoid hidden navigation assumptions.
4. Use Playwright MCP as the execution path instead of ad hoc browser scripts.
5. Prefer stable selectors: role or test id first, then text, then CSS as a last resort.
6. Capture baseline evidence before the first destructive action.
7. Persist artifacts under `artifacts/web-qa/` with deterministic filenames.
8. Capture console, network, or accessibility evidence only when the charter asks for it or when a failure needs explanation.
9. Use one controlled retry only, then stop and report evidence.
10. Tie the final verdict to artifact paths, not impressions.

## Output Format

```markdown
## Web QA Charter
- Flow:
- Base URL:
- Start path:
- Success criteria:

## Execution Log
1. [action] -> [observation]
2. [action] -> [observation]

## Assertions
- Passed:
- Failed:
- Blocked:

## Evidence
- Screenshots:
- DOM snapshots:
- Console logs:
- Network evidence:
- Accessibility evidence:

## Risks And Follow-ups
- Risk:
- Recommended fix:
```

## References

| File | Load when |
| --- | --- |
| `../playwright-interactive/SKILL.md` | The task shifts from runtime QA into suite authoring or broader E2E architecture. |
| `../flutter-mobile-qa/SKILL.md` | The task also includes Android/mobile QA and needs the parallel mobile runtime pattern. |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
