# App State Contract

## Expected States

- `loading`
- `data`
- `empty`
- `error`
- `deadLetter`

## Error Contract

Errors should carry enough context for:

- user-facing messaging,
- developer debugging,
- support follow-up through a request or correlation ID.

## Notifier Rules

- Start from a deliberate initial state.
- Map repository/service failures into typed app errors.
- Keep mutation methods thin and consistent with the same error contract.
