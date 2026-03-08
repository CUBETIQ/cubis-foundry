# API Contract Checklist

Load this when the root skill is not enough for concrete contract design.

## Contract shape

- Name resources from client-facing domain concepts, not tables or handlers.
- Keep identifiers stable and opaque when public.
- Separate create/update payloads from read models when that reduces accidental coupling.
- Make backward compatibility policy explicit before adding fields or changing error behavior.

## Collections and pagination

- Default to pagination on collections.
- Prefer cursor or keyset pagination when sort order is stable and large lists are realistic.
- Use offset pagination only when simplicity is worth the tradeoff and scale is bounded.
- Keep filtering and sorting parameters explicit and documented.

## Mutations and retries

- Use idempotency where retries are expected or clients can duplicate submissions.
- Make partial success, async acceptance, and long-running operations explicit.
- Keep mutation semantics and side effects understandable from the contract alone.

## Errors and auth

- Keep error envelopes consistent across the surface.
- Document validation, auth, rate-limit, and conflict errors deliberately.
- Make retryable vs non-retryable conditions obvious to clients.
- Treat auth shape as part of the contract, not an afterthought.
