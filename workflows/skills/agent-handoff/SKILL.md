---
name: "agent-handoff"
displayName: "Agent Handoff"
description: >
  Load this skill when you are a CUSTOM AGENT spawned by a workflow and have received a task envelope.
  Covers: reading the envelope, cold-start protocol, skill_get without skill_search, writing deliverables,
  returning the result envelope, and what NOT to load into context.
  DO NOT trigger for orchestrator/workflow-level planning — that is the workflow's job.
  ALWAYS trigger when: "task envelope received", "spawned from workflow", "agent executing milestone",
  "result envelope", "handoff".
keywords:
  [
    "agent-handoff",
    "handoff",
    "task envelope",
    "result envelope",
    "cold-start",
    "agent spawn",
    "milestone agent",
    "zero-bloat",
    "workflow agent",
  ]
---

# Agent Handoff Skill
# Zero-bloat protocol for agents spawned from Foundry workflows

## What This Skill Does

You are a custom agent. You were spawned from a workflow with a task envelope.
This skill tells you exactly how to execute without loading unnecessary context.

---

## Step 1 — Read Your Task Envelope

You received a task envelope. It looks like this:
```json
{
  "milestone_id": "M2",
  "milestone_name": "Build API layer",
  "deliverable_path": "src/api/routes.ts",
  "acceptance_criteria": "File exists, tests pass",
  "skill_name": "web-backend",
  "status_file": "TASK_STATUS.md",
  "env_context": ["NODE_ENV", "API_BASE_URL"]
}
```

Fields you MUST use:
- `milestone_id` — your scope identifier
- `deliverable_path` — where to write your output
- `acceptance_criteria` — how to verify completion
- `skill_name` — the skill to load (pre-resolved by orchestrator)
- `status_file` — the task status file to read and update

---

## Step 2 — Orient (Cold-Start, Minimal Read)

Read ONLY `TASK_STATUS.md` — scan for your `milestone_id` status.

```
If your milestone shows "complete" → return result envelope immediately, skip execution.
If your milestone shows "blocked" → surface the block, do not attempt execution.
If your milestone shows "pending" or is absent → proceed to Step 3.
```

**DO NOT read:**
- TASK_SPEC.md (not needed unless acceptance criteria are ambiguous — read only then)
- TASK_PLAN.md (your envelope already has your acceptance criteria)
- Other milestones' files or outputs

---

## Step 3 — Load Skill (No skill_search)

The orchestrator already resolved your skill. Load it directly:

```
skill_get "<skill_name from envelope>"
```

Follow the skill's instructions for executing the work.

If `skill_name` is `"none"` or empty: use direct tool execution — no skill needed.

**Never call `skill_search`** — that's the orchestrator's job. Calling it here wastes tokens.

---

## Step 4 — Execute (Code-Execution Pattern)

Use the code-execution pattern for all data-heavy work:

```
# BAD — each result enters context
call tool → result enters context
call tool → result enters context

# GOOD — process outside context
write code that:
  1. calls tools → stores results in variables
  2. processes data in execution environment
  3. writes output to deliverable_path
  4. returns only pass/fail + summary to context
```

Load only env vars listed in `env_context` — do not scan for or load others.

---

## Step 5 — Verify & Update Status

After execution:
1. Confirm `deliverable_path` exists
2. Run acceptance check (as defined in `acceptance_criteria`)
3. Update `TASK_STATUS.md`:

```markdown
## M2 — Build API layer
- Status: complete
- Deliverable: src/api/routes.ts ✓
- Completed: [timestamp]
```

---

## Step 6 — Return Result Envelope

Return EXACTLY this structure to the calling workflow — nothing more:

```json
{
  "milestone_id": "M2",
  "status": "complete",
  "deliverable": "src/api/routes.ts",
  "verified": true,
  "summary": "Created 4 REST endpoints. All tests pass.",
  "errors": []
}
```

| Field | Rule |
|---|---|
| `status` | One of: `complete`, `failed`, `blocked` |
| `summary` | 1–3 sentences max — what was done, what was produced |
| `errors` | Empty array on success; structured error objects on failure |
| `verified` | Only `true` if acceptance criteria was explicitly checked |

**Never return:** raw stdout, full file contents, intermediate reasoning, test output logs.
If the workflow needs more detail, it will read `deliverable_path` directly.

---

## What You Must Never Do

| Never | Why |
|---|---|
| Call `skill_search` | Wastes tokens — orchestrator already resolved skill |
| Read TASK_SPEC.md / TASK_PLAN.md upfront | Your envelope has what you need |
| Return raw tool output to workflow | Multiplies context cost |
| Write to paths outside your `deliverable_path` | Parallel agent collision risk |
| Load env vars not in your `env_context` | Credential scope leak |
| Pass your context to sub-agents without filtering | Cascading bloat |

---

## If You Need to Spawn a Sub-Agent

If your milestone requires spawning another agent:
1. Build a NEW minimal envelope — do NOT forward your own envelope
2. Include ONLY what the sub-agent needs for its specific task
3. Receive sub-agent result envelope only — do not receive its full context
4. Continue with your milestone after verifying sub-agent result

---

## On Failure

If execution fails:
1. Update `TASK_STATUS.md` with failure details
2. Return result envelope with `"status": "failed"` and structured `errors[]`
3. Do NOT attempt to recover beyond one retry — surface to orchestrator
4. Do NOT continue to the next milestone

---

## Platform-Specific Adaptation

This skill works across all Foundry platforms, but agent spawning differs:

| Platform | How You Were Spawned | Return Method |
|---|---|---|
| **Claude Code** | Via subagent (Agent tool) or `context: fork` | Return result text — orchestrator reads it |
| **Antigravity** | Via Agent Manager | Write to `deliverable_path`, Agent Manager collects |
| **Copilot** | Via custom agent (`.github/agents/`) | Return structured result envelope |
| **Codex** | Via wrapper workflow (`agent-<name>`) | Return structured result envelope |

On **Claude Code**: You may have restricted tool access if spawned with `allowed-tools`.
Only use the tools available to you. If you need a tool not in your allowlist, surface
the need in your result envelope — do not attempt workarounds.

On **Antigravity**: You may be running in parallel with other agents. Strictly respect
your `deliverable_path` — never write outside it.
