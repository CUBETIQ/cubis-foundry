# Riverpod Testing

## Test What Matters

- initial state,
- success transition,
- empty transition,
- error transition,
- mutation side effects or invalidation behavior.

## Test Tools

- `ProviderContainer` for provider-level tests
- widget tests for UI reactions to provider state
- repository/service fakes or mocks through overrides

## Rules

- dispose the container,
- override dependencies explicitly,
- assert transitions instead of only final values when behavior matters.
