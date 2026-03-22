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

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
