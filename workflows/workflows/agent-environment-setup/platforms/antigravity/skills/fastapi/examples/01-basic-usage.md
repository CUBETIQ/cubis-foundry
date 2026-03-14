# Example: Authenticated CRUD API with Pydantic v2

## Scenario

A team is building a task management API with FastAPI. They need user registration, JWT-based login, and CRUD operations for tasks. Tasks belong to the authenticated user. All endpoints must have proper Pydantic v2 models for request validation and response serialization, and the OpenAPI schema must accurately reflect the API contract.

## Prompt

"Create a FastAPI task management API. Users can register, log in with JWT, and manage their tasks. Tasks have a title, description, status (todo, in_progress, done), and priority. Use Pydantic v2 models with proper validation, Depends() for auth, and response_model on all endpoints."

## Expected Output

### Pydantic Models

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="User password")
    full_name: str = Field(min_length=1, max_length=100, description="Display name")

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

```python
# app/schemas/task.py
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200, description="Task title")
    description: str | None = Field(default=None, max_length=2000, description="Detailed description")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Current task status")
    priority: int = Field(default=0, ge=0, le=4, description="Priority level 0-4")

class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    priority: int | None = Field(default=None, ge=0, le=4)

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
```

### Authentication Dependency

```python
# app/dependencies/auth.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user

# Reusable annotated type
CurrentUser = Annotated[User, Depends(get_current_user)]
```

### Router

```python
# app/routers/tasks.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser
from app.dependencies.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = select(Task).where(Task.owner_id == current_user.id)
    if status_filter:
        query = query.where(Task.status == status_filter)
    query = query.order_by(Task.priority.desc(), Task.created_at.desc())
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    task = Task(**task_in.model_dump(), owner_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    task = await db.get(Task, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    task = await db.get(Task, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    task = await db.get(Task, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await db.delete(task)
    await db.commit()
```

## Key Decisions

- **Separate request and response models** -- `TaskCreate` excludes `id`, `owner_id`, and timestamps; `TaskResponse` includes them. No internal fields leak to the client.
- **`Annotated` type alias for `CurrentUser`** -- reused across all endpoints, keeping signatures clean and the dependency visible to IDE autocompletion.
- **`model_dump(exclude_unset=True)` for partial updates** -- only patches fields the client explicitly sent, distinguishing between "not sent" and "set to None."
- **Owner scoping in every query** -- tasks are filtered by `owner_id` at the database level, not in application code, preventing authorization bypass.
