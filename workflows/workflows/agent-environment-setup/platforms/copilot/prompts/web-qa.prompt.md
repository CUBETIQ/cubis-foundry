# Workflow Prompt: /web-qa

Run charter-driven web QA through Playwright MCP with deterministic browser evidence and report-ready artifacts.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `playwright-web-qa`, `playwright-interactive`, `integration-testing`, `code-review`.
- Local skill file hints if installed: `.github/skills/playwright-web-qa/SKILL.md`, `.github/skills/playwright-interactive/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/code-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Web QA Workflow

## When to use

Use when validating a real browser flow with Playwright MCP and the main outcome is execution evidence, not authoring a reusable suite.

## Agent Chain

`explorer` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` confirms the base URL, charter inputs, environment access, and Playwright MCP readiness.
2. **Test**: `@tester` runs the web QA charter, captures browser evidence, and records the exact blocked step when execution fails.
3. **Review**: `@reviewer` checks whether the artifacts support the final verdict and whether accessibility/network/console evidence is sufficient.

## Skill Routing

- Primary skills: `playwright-web-qa`
- Supporting skills (optional): `playwright-interactive`, `integration-testing`, `code-review`

## Context notes

- Provide the charter path, base URL, and any required starting route or environment assumption.
- This route is for live QA execution and evidence capture, not generalized suite authoring.
## Runtime contract

- Prefer Playwright MCP as the execution path.
- Save artifacts under `artifacts/web-qa/`.
- Capture deterministic screenshots, DOM snapshots, console logs, network evidence, and accessibility evidence when requested.
- Stop after one controlled retry and report evidence.

## Workflow steps

1. Confirm the charter, base URL, and starting route.
2. Start from the explicit page state and capture baseline evidence.
3. Execute each charter step through Playwright MCP.
4. Persist screenshots, DOM, console, network, and accessibility artifacts as the charter requires.
5. Review the evidence and summarize pass/fail/blocked findings.

## Verification

- The charter ran against the intended URL.
- Evidence exists for baseline state and any failure.
- The final report states the Playwright MCP execution result and artifact paths.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: tester
  supporting_agents: [explorer, reviewer]
  provider_used: <playwright-mcp>
  artifacts: [<path>]
  blocked_reasons: [<string>] | []
  follow_up_items: [<string>] | []
```
