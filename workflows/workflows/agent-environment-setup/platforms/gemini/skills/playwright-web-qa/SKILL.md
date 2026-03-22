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

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
