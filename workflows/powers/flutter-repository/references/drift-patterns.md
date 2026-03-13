# Drift Patterns

## Local Table Checklist

- stable primary key,
- timestamps when the domain needs ordering or sync,
- `syncStatus` and `operationId` when offline sync exists,
- indexes for common filters or joins.

## DAO Checklist

- `watchAll()` or other reactive streams for UI-facing reads
- detail reads such as `getById`
- insert, update, upsert, and delete helpers
- targeted status updates such as `markSynced` or `markDead` when needed

## Performance Rules

- Prefer `count()` queries over loading whole rows to test emptiness at scale.
- Use batch writes for bulk sync.
- Use transactions for multi-table writes.
