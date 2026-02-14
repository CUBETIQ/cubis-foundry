# Drift DAO/query patterns

## DAO guidelines

- Group by aggregate/root feature, not by screen.
- Keep return types explicit (table row, projection model, or stream).
- Prefer typed expressions over raw SQL unless query complexity requires raw SQL.

## Query patterns

- Use stream queries for live lists needing immediate updates.
- Use one-shot futures for actions/details where live updates are unnecessary.
- Add indexes for columns used in WHERE + ORDER BY.

## Transactions

Use `transaction(() async { ... })` for operations that must commit together:
- receipt + receipt lines,
- stock movement + inventory quantity update,
- shift close summary + cash variance record.
