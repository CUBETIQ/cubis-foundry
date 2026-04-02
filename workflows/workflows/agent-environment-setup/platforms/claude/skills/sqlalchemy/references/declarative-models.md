# Declarative Models

Load this when designing or refactoring SQLAlchemy 2.0+ model classes, column types, constraints, mixins, or table arguments.

## Base class setup

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, MappedAsDataclass
from sqlalchemy import String, DateTime, func
from datetime import datetime
from uuid import UUID, uuid4

class Base(DeclarativeBase):
    """Single project-wide base. Import everywhere, never duplicate."""
    pass
```

- One `Base` per project. Multiple bases means multiple MetaData registries and Alembic will miss tables.
- If you need dataclass behavior, use `MappedAsDataclass` as a mixin on individual models, not on `Base`.

## Column patterns

### Primary keys

```python
class User(Base):
    __tablename__ = "users"

    # Integer auto-increment (simple, fast joins)
    id: Mapped[int] = mapped_column(primary_key=True)

    # UUID primary key (distributed-safe, no sequence contention)
    id: Mapped[UUID] = mapped_column(default=uuid4, primary_key=True)
```

- Prefer integer PKs unless you need distributed ID generation or client-side ID creation.
- UUID PKs increase index size and reduce cache locality. Use `uuid7` for time-sortable UUIDs if ordering matters.

### Common column types

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    bio: Mapped[str | None]  # nullable, TEXT type inferred
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
    )
```

- `Mapped[str | None]` means nullable. `Mapped[str]` means NOT NULL. The type annotation drives nullability.
- Always use `DateTime(timezone=True)` for timestamps. Naive datetimes cause timezone bugs in production.
- Use `server_default` for columns that must have defaults at the database level (required for Alembic on existing tables).

### Enums

```python
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    role: Mapped[UserRole] = mapped_column(default=UserRole.MEMBER)
```

- Use Python `str, enum.Enum` subclass. SQLAlchemy creates a native database ENUM on Postgres or VARCHAR with CHECK on SQLite.
- Alembic autogenerate handles enum creation but NOT value additions. Add new enum values manually in migrations.

## Relationships

```python
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

class Team(Base):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    members: Mapped[list["User"]] = relationship(back_populates="team")

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"))

    team: Mapped[Team | None] = relationship(back_populates="members")
```

- Always use `back_populates` over `backref`. It is explicit, visible in both models, and type-checker friendly.
- Use `Mapped[list["ChildModel"]]` for one-to-many. Use `Mapped["RelatedModel | None"]` for many-to-one.
- Forward references use quoted strings (`"User"`) to handle circular imports.

## Many-to-many with association table

```python
from sqlalchemy import Table, Column, ForeignKey

user_project = Table(
    "user_project",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("project_id", ForeignKey("projects.id"), primary_key=True),
)

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    members: Mapped[list["User"]] = relationship(
        secondary=user_project, back_populates="projects"
    )
```

- Use an association table for pure M2M. Use an association model (full class) when the join table has extra columns.

## Mixins and common columns

```python
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
```

- Place mixins before `Base` in MRO: `class User(TimestampMixin, Base)`.
- Keep mixins minimal. If a mixin adds relationships, it creates coupling across unrelated models.

## Table arguments

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        UniqueConstraint("tenant_id", "external_id", name="uq_tenant_external"),
        {"schema": "audit"},  # optional: Postgres schema
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[int]
    tenant_id: Mapped[int]
    external_id: Mapped[str] = mapped_column(String(100))
```

- Use `__table_args__` for composite indexes, unique constraints, and schema placement.
- Always name constraints explicitly. Autogenerated names differ across databases and break Alembic.
