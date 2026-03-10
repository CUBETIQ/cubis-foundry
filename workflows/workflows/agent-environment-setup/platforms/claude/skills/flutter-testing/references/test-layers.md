# Test Layers

## Repository Tests

Cover:

- local writes,
- remote sync import,
- outbox enqueue behavior when applicable,
- stream/read correctness.

## Service Tests

Cover:

- business-rule success paths,
- each meaningful failure path,
- edge cases around validation and policy.

## Notifier or Provider Tests

Cover:

- initial state,
- success,
- empty,
- error,
- mutation-triggered refresh or invalidation.

## Widget and Golden Tests

- Widget tests verify state-specific rendering and interaction.
- Golden tests verify stable shared or high-value UI surfaces.
