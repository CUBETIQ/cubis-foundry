# Migrations

## Migration Rules

- Increment `schemaVersion` every time persisted structure changes.
- Use `onCreate` for first-install setup only.
- Use `onUpgrade` for stepwise migrations from older versions.
- Backfill new required columns safely with defaults or staged rollout.
- Enable pragmas such as foreign keys intentionally in `beforeOpen`.

## Safe Upgrade Checklist

- Existing rows stay readable after upgrade.
- New nullable columns start nullable unless a safe default exists.
- New indexes are created during migration or through `createAll` only when safe.
- Data transforms are deterministic and reversible enough for debugging.

## Tests

- Test opening a fresh database.
- Test upgrading from the last production schema.
- Test representative old data through the upgrade path.
