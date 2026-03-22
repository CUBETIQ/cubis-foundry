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

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
