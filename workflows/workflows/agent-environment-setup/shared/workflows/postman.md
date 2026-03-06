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
- Prefer MCP tools (`postman.*` or `postman_*`) over manual JSON/CLI fallback unless fallback is explicitly requested by the user.

## Skill Routing
- Primary skills: `postman`
- Supporting skills (optional): `api-designer`, `test-master`

## Workflow steps
1. Load Postman skill and check integration status (`postman_get_status`).
2. Resolve workspace ID (user-provided, configured default, or explicit selection).
3. Execute required MCP operations (list/create/update/run) with explicit IDs.
4. Summarize outcomes, failures, and next actions with exact object identifiers.

## Verification
- Confirm requested Postman action completed successfully.
- Validate response status and key result fields (IDs, counts, failures).
- Note any skipped steps and required follow-up.

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
