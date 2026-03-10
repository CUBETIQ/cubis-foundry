# Query Patterns

## Table Design

- Use stable IDs with clear ownership rules.
- Add indexes for foreign keys, frequent filters, and common sort columns.
- Keep sync-related columns explicit when offline behavior exists.

## DAO Design

- Expose streams for UI-facing reactive reads.
- Expose one-shot reads for detail fetches or background work.
- Keep write methods small and composable.
- Return typed data or typed companions, not maps.

## Repository Integration

- Read flow: local-first, then optional remote refresh.
- Write flow: persist locally first, then reconcile sync policy.
- Mapper code belongs in the data layer, not in widgets.

## Use Raw SQL Only When

- a partial index or special SQLite feature needs it,
- a complex query is materially clearer in SQL,
- Drift's typed API cannot express the operation cleanly.
