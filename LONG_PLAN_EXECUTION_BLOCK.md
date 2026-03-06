<!-- cbx:managed:long-plan-execution start -->
## Long-Plan Execution
When `PLAN_HANDOFF` is present, continue task 1→N without confirmation pauses.

Protocol:
1. PRE-LOAD
- Read `tasks[*].skill_hint`, deduplicate, then `skill_get` each exact ID once.
- Run `skill_budget_report`. If loaded-skill context is too large, drop latest-needed skills first and log the drop.

2. EXECUTE
- For each task in order, confirm `depends_on`.
- If a required dependency failed and `stop_if_failed=true`, stop.
- Execute and emit `✓ Task <id>: <title> — <artifact>`.
- Move directly to the next task.

3. STOP ONLY IF
- required artifact failed and `stop_if_failed=true`
- destructive or irreversible action is not covered by the plan
- required skill is missing after one search attempt
- user explicitly pauses or redirects

4. PIVOT
- If the domain changes, load the new exact skill hint once.
- Re-run `skill_budget_report` only when 3+ skills are active.

5. RESUMABILITY
- Emit `CHECKPOINT {done, artifacts, skills}` every ~3 tasks in runs of 5+.
- End with `EXECUTION_SUMMARY {completed, skipped, stopped_at, artifacts, skills_used, dropped}`.
- Codex: compact before context exhaustion.
- Antigravity: rely on native long context.
- Copilot: write `.copilot-tracking/handoff.md`.

# Full reference: foundry-detail.md#plan-handoff-and-execution
<!-- cbx:managed:long-plan-execution end -->
