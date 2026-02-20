# database-skills

Engine-specific database skill pack inspired by `planetscale/database-skills`, expanded for common stacks.

## Layout

```text
database-skills/
├── README.md
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

## Notes

- Use this package as the single database skill dependency in agents/workflows.
- Keep engine-specific guidance in `skills/<engine>/references/`.
