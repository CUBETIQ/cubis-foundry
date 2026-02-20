# database-skills

Engine-specific database skill pack inspired by `planetscale/database-skills`, expanded for modern production stacks.

## Layout

```text
database-skills/
├── README.md
├── LATEST_VERSIONS.md
├── SKILL.md
└── skills/
    ├── postgres/
    │   ├── SKILL.md
    │   └── references/
    ├── mysql/
    │   ├── SKILL.md
    │   └── references/
    ├── vitess/
    │   ├── SKILL.md
    │   └── references/
    ├── neki/
    │   ├── SKILL.md
    │   └── references/
    ├── mongodb/
    │   ├── SKILL.md
    │   └── references/
    ├── sqlite/
    │   ├── SKILL.md
    │   └── references/
    ├── supabase/
    │   ├── SKILL.md
    │   └── references/
    └── redis/
        ├── SKILL.md
        └── references/
```

## What each engine pack must cover

- Index strategy for real query patterns.
- Pagination strategy (keyset/seek first, offset only when justified).
- Query plan workflow (`EXPLAIN` or engine equivalent).
- Write/read tradeoff notes.
- Safe rollout + rollback notes for schema and operational changes.

## Notes

- Use this package as the single database skill dependency in agents/workflows.
- Keep version-sensitive guidance synced with `LATEST_VERSIONS.md`.
