---
command: "/postman"
description: "Execute Postman MCP operations for workspaces, collections, environments, and runs."
triggers: ["postman", "collection", "workspace", "environment", "runcollection", "monitor", "mock", "api test"]
---
# Postman Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps workspace/action identifiers machine-readable for follow-on automation.

## When to use
Use this when tasks are primarily about Postman workspaces, collections, environments, monitors, mocks, or collection runs.

## Routing
- Postman operations and execution: `@backend-specialist`
- Security/compliance checks on test data: `@security-auditor`
- Validation quality and assertions: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Resolve and pass workspace IDs explicitly when tools require them.
- Use direct Postman MCP server tools for real Postman actions (`postman.<tool>` or client-wrapped equivalent such as `mcp__postman__<tool>`).
- Reserve Foundry `postman_*` tools for status/mode/config only.
- Prefer direct Postman MCP tools over manual JSON/CLI fallback unless fallback is explicitly requested by the user.
- Support monitor tasks only when the user explicitly asks for monitor-based cloud execution or monitor validation.
- Never auto-fallback from `postman.runCollection` failure into `postman.runMonitor`.
- Recommend Postman CLI as the default secondary path after direct MCP execution fails.

## Skill Routing
- Primary skills: `postman`
- Supporting skills (optional): `api-designer`, `test-master`

## Workflow steps
1. Load Postman skill and check integration status (`postman_get_status` for config/status only).
2. Resolve workspace ID (user-provided, configured default, or explicit selection).
3. Execute required direct Postman MCP operations (list/create/update/run) with explicit IDs.
4. If execution fails, classify the error before suggesting any fallback.
5. Summarize outcomes, failures, and next actions with exact object identifiers.

## Verification
- Confirm requested Postman action completed successfully.
- Validate response status and key result fields (IDs, counts, failures).
- Note any skipped steps and required follow-up.

## Failure classification

- `limitBreachedError` or "breached monitoring usage limit":
  - classify as monitor quota exhaustion
  - do not retry monitor execution
  - recommend Postman CLI
  - direct the user to Postman monitoring usage dashboard
- `429` or rate-limited API response:
  - classify as Postman API rate limiting
  - recommend backoff and lower request burst
- collection-run timeout without quota/rate-limit signal:
  - classify as direct MCP/runtime timeout
  - do not auto-convert to monitor execution
  - recommend Postman CLI or smaller-scope rerun

## Output Contract
```yaml
POSTMAN_WORKFLOW_RESULT:
  primary_agent: backend-specialist
  supporting_agents: [security-auditor?, test-engineer?]
  primary_skills: [postman]
  supporting_skills: [api-designer?, test-master?]
  workspace_context: <string>
  actions_executed:
    - action: <string>
      result_id: <string|null>
  run_summary:
    passed: <bool|null>
    failures: [<string>] | []
  follow_up_steps: [<string>] | []
```
