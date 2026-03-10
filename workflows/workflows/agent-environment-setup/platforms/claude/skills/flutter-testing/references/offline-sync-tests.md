# Offline Sync Tests

## Cover These Behaviors

- write succeeds locally before network success,
- outbox entry is queued correctly,
- remote sync upserts data idempotently,
- retry count changes on failure,
- dead-letter state appears after retry exhaustion,
- conflict handling follows the declared feature policy.

## Useful Test Shapes

- in-memory Drift database for repository tests
- mocked API and connectivity services
- notifier tests that assert sync-status or dead-letter transitions
