# Outbox Full

## One-Time Infrastructure

- Outbox table persisted in Drift
- Outbox service responsible for dequeue, dispatch, retry, and dead-letter transitions
- Connectivity service that triggers draining when the device comes back online
- Optional app-init seeding for empty local stores

## Repository Write Contract

1. Generate an operation ID.
2. Persist the local change.
3. Enqueue the serialized operation.
4. Trigger a non-blocking drain when online.
5. Return the local result immediately.

## Feature Handler Contract

Each queued feature operation needs a handler that:

- decodes the payload,
- calls the correct API operation,
- marks success or updates retry/dead-letter state,
- applies conflict policy when the server rejects the write semantically.

## Sync Status Contract

Offline-capable records should expose a sync field such as:

- `pendingSync`
- `synced`
- `failed`
- `dead`
- `conflict`

## Conflict Strategies

- `clientWins`
- `serverWins`
- `lastWriteWins`
- `manualResolve`

Pick one per feature. Safety-critical data should not default to silent overwrite.
