# Alembic Migrations

Load this when creating, reviewing, or troubleshooting Alembic migration scripts, autogenerate configuration, or migration chain management.

## Alembic setup for async SQLAlchemy

### `alembic/env.py` for async

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from app.models import Base  # Import YOUR Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- Use `NullPool` in Alembic. Migrations are short-lived; connection pooling adds no value.
- Import `Base.metadata` from your models package. If models are not imported, their tables will not appear in metadata.

## Autogenerate workflow

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "add user preferences table"

# Review the generated script (ALWAYS review before applying)
# Fix upgrade() and downgrade() as needed

# Apply migration
alembic upgrade head

# Check for drift (CI step)
alembic check
```

### What autogenerate detects

| Detected | Not detected |
| --- | --- |
| New tables | Table renames (appears as drop + create) |
| New columns | Column renames (appears as drop + add) |
| Column type changes | Data migrations |
| New indexes and constraints | Enum value additions |
| Foreign key changes | Stored procedures and triggers |
| Table removal | Partial index conditions |

- Always review generated scripts. Autogenerate is a starting point, not a finished migration.

## Migration patterns

### Adding a non-nullable column to existing table

```python
"""add email_verified column to users"""

def upgrade() -> None:
    # Step 1: Add as nullable with server default
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    # Step 2 (optional): Remove server default if not wanted long-term
    op.alter_column("users", "email_verified", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "email_verified")
```

- Never add a non-nullable column without `server_default`. It will fail on tables with existing rows.
- On large tables, consider adding nullable first, backfilling, then altering to non-nullable in a separate migration.

### Renaming a column

```python
"""rename user.name to user.display_name"""

def upgrade() -> None:
    op.alter_column("users", "name", new_column_name="display_name")


def downgrade() -> None:
    op.alter_column("users", "display_name", new_column_name="name")
```

- Autogenerate cannot detect renames. It will generate a drop + add, which loses data.

### Adding an index concurrently (Postgres)

```python
"""add index on users.email concurrently"""
from alembic import op

# Must run outside transaction for CREATE INDEX CONCURRENTLY
def upgrade() -> None:
    op.execute("COMMIT")  # End the Alembic transaction
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
        postgresql_concurrently=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
```

- `CREATE INDEX CONCURRENTLY` prevents table locks but cannot run inside a transaction.
- Always use concurrent index creation on production tables with traffic.

### Data migration

```python
"""backfill user slugs from display names"""
from sqlalchemy import text

def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        text(
            "UPDATE users SET slug = lower(replace(display_name, ' ', '-')) "
            "WHERE slug IS NULL"
        )
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("UPDATE users SET slug = NULL"))
```

- Keep data migrations separate from schema migrations. One concern per migration file.
- For large tables, batch the update to avoid long-running transactions.

## Migration chain management

### Checking for multiple heads

```bash
# List current heads
alembic heads

# If multiple heads exist, merge them
alembic merge -m "merge heads" head1 head2

# Verify single head
alembic heads  # Should show exactly one
```

### CI migration checks

```bash
# 1. Check for model-migration drift
alembic check

# 2. Verify migration chain is linear (no unmerged branches)
alembic heads --verbose
# Should show exactly one head

# 3. Test full migration from empty database
alembic upgrade head

# 4. Test downgrade path
alembic downgrade base
alembic upgrade head
```

- Run all four checks in CI. Drift detection alone is not sufficient.
- Migration chain breaks are only discovered at deploy time without CI checks.

## Stamping and manual intervention

```bash
# Mark database as being at a specific revision without running migrations
alembic stamp head

# Useful after manual schema changes or initial setup of Alembic on existing DB
alembic stamp abc123def456
```

## Best practices checklist

- Every migration has both `upgrade()` and `downgrade()`.
- Constraint names are explicit, not autogenerated (autogenerated names differ across databases).
- Large table changes use batched operations or concurrent index creation.
- Data migrations are separate files from schema migrations.
- Migration messages are descriptive: `"add user preferences table"` not `"update"`.
- CI runs `alembic check` to detect drift.
- CI tests full `upgrade head` and `downgrade base` cycle.
- Production deploys run migrations before code deployment (schema must be backward-compatible).
