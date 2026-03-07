# TASK_STATUS.md Template

Use this as a shape reference for the project-level status file mentioned in the task envelope.
Do not copy it blindly if the active project already has a status file format.

```markdown
# Task Status

## M1 — Example milestone
- Status: pending
- Deliverable: src/example.ts
- Notes: Waiting on implementation

## M2 — Example milestone
- Status: complete
- Deliverable: src/api/routes.ts
- Completed: 2026-03-07T10:00:00Z
- Notes: Acceptance checks passed

## M3 — Example milestone
- Status: blocked
- Deliverable: src/db/schema.sql
- Blocker: Migration contract not finalized
```
