# Drift migration checklist

## Before migration

- Identify current schema version.
- List table/column/index changes.
- Decide data backfill/default strategy.

## Safe migration pattern

1. Increment schema version.
2. Apply additive changes first (new nullable/defaulted columns, new tables).
3. Backfill data where needed.
4. Add stricter constraints only after data is valid.
5. Rebuild dependent indexes/views if changed.

## Verification

- Migration test from N-1 to N.
- Data integrity checks for key tables.
- Query regression checks for critical screens.
