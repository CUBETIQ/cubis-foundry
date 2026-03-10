# Schema And Migration Checklist

Load this when schema work needs a stricter implementation checklist.

## Model shape

- Define entities, ownership, lifecycle, and access patterns first.
- Choose relational vs document structure deliberately.
- Treat indexes as part of the model, not a cleanup pass.

## Keys and pagination

- Choose stable keys that fit access paths and operational constraints.
- Design pagination from real sort and filter patterns.
- Re-check uniqueness, foreign keys, and validation rules explicitly.

## Migration posture

- Plan rollout, backfill, and rollback before implementation.
- Stage destructive or high-risk changes instead of shipping them all at once.
- Keep blast radius visible for large tables or hot write paths.

## Coupling

- Avoid persistence models that leak too directly into public contracts.
- Keep ORM convenience from driving the whole schema.
