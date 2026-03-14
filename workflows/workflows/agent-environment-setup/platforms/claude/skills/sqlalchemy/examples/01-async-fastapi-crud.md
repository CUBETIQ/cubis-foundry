# Example: Async FastAPI CRUD with SQLAlchemy 2.0

This example demonstrates a complete async CRUD setup for a task management API using FastAPI, SQLAlchemy 2.0 declarative models, and asyncpg.

## Models

```python
# app/models.py
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship,
)

class Base(DeclarativeBase):
    pass

class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    projects: Mapped[list["Project"]] = relationship(back_populates="workspace")

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"))

    workspace: Mapped[Workspace] = relationship(back_populates="projects")
    tasks: Mapped[list["Task"]] = relationship(back_populates="project")

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    is_complete: Mapped[bool] = mapped_column(default=False)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped[Project] = relationship(back_populates="tasks")
```

## Database session

```python
# app/database.py
from sqlalchemy.ext.asyncio import (
    AsyncSession, async_sessionmaker, create_async_engine,
)

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost:5432/taskdb",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False,
)
```

## FastAPI dependency and endpoints

```python
# app/main.py
from collections.abc import AsyncGenerator
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from app.database import async_session
from app.models import Project, Task

app = FastAPI()

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        async with session.begin():
            yield session

@app.get("/projects/{project_id}")
async def get_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(Project)
        .where(Project.id == project_id)
        .options(
            joinedload(Project.workspace),
            selectinload(Project.tasks),
        )
    )
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "workspace": project.workspace.name,
        "tasks": [
            {"id": t.id, "title": t.title, "is_complete": t.is_complete}
            for t in project.tasks
        ],
    }

@app.post("/projects/{project_id}/tasks")
async def create_task(
    project_id: int,
    title: str,
    session: AsyncSession = Depends(get_session),
):
    # Verify project exists
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    task = Task(title=title, project_id=project_id)
    session.add(task)
    await session.flush()
    return {"id": task.id, "title": task.title, "is_complete": False}
```

## Key patterns demonstrated

- Single `Base` class shared across all models.
- `Mapped[]` type annotations for full type checker support.
- `back_populates` for explicit bidirectional relationships.
- `expire_on_commit=False` to prevent MissingGreenlet in async.
- `joinedload` for many-to-one (Project -> Workspace).
- `selectinload` for one-to-many (Project -> Tasks).
- Request-scoped session with automatic commit/rollback via context manager.
