# SQLite Checklist

Load this when SQLite or libSQL-specific behavior matters.

## Workload fit

- Confirm the workload fits embedded or local-first constraints.
- Keep single-writer and file-level concurrency visible.

## Operational choices

- Decide WAL posture explicitly.
- Check checkpoint, backup, and sync behavior when the product depends on them.
- Keep migrations small and recovery-friendly.

## Design

- Model around actual read paths.
- Do not assume server-database scaling or operational patterns.
