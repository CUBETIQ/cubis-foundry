# Example: Multi-Step Alembic Migration for Production

This example demonstrates a safe migration strategy for adding an enum column and a concurrent index to a large production table.

## Scenario

The `users` table has 500K rows. We need to:
1. Add a `role` enum column (admin, member, viewer) with default `member`.
2. Add a unique index on `(tenant_id, email)` without blocking writes.

## Migration 1: Add the role column

```python
"""add role column to users

Revision ID: a1b2c3d4e5f6
Revises: previous_revision_id
Create Date: 2025-01-15 10:30:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "previous_revision_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type first (Postgres-specific)
    role_enum = sa.Enum("admin", "member", "viewer", name="userrole")
    role_enum.create(op.get_bind(), checkfirst=True)

    # Add column as NOT NULL with server_default so existing rows get 'member'
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("admin", "member", "viewer", name="userrole"),
            server_default="member",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "role")

    # Drop the enum type (Postgres-specific)
    role_enum = sa.Enum(name="userrole")
    role_enum.drop(op.get_bind(), checkfirst=True)
```

## Migration 2: Add concurrent index

```python
"""add unique index on tenant_id and email concurrently

Revision ID: f6e5d4c3b2a1
Revises: a1b2c3d4e5f6
Create Date: 2025-01-15 11:00:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = "f6e5d4c3b2a1"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # CREATE INDEX CONCURRENTLY cannot run inside a transaction.
    # End the Alembic-managed transaction first.
    op.execute("COMMIT")

    op.create_index(
        "ix_users_tenant_email",
        "users",
        ["tenant_id", "email"],
        unique=True,
        postgresql_concurrently=True,
    )


def downgrade() -> None:
    op.execute("COMMIT")

    op.drop_index(
        "ix_users_tenant_email",
        table_name="users",
        postgresql_concurrently=True,
    )
```

## CI validation

```bash
# Run in CI to verify the full migration chain
alembic upgrade head
alembic downgrade base
alembic upgrade head
alembic check  # Verify no model-migration drift
```

## Key patterns demonstrated

- Enum type created explicitly before the column that references it.
- `server_default` used so existing rows are populated without a full table scan UPDATE.
- Concurrent index creation separated into its own migration file.
- Transaction boundary handled explicitly for `CREATE INDEX CONCURRENTLY`.
- Both `upgrade()` and `downgrade()` present in every migration.
- Enum type dropped in downgrade to leave the database clean.
