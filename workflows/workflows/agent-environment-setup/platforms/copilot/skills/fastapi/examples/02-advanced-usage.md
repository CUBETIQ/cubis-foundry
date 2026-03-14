# Example: Async Background Tasks with Webhook Delivery

## Scenario

A team is building a webhook delivery service with FastAPI. When an event occurs, the API stores it in PostgreSQL using async SQLAlchemy, enqueues delivery via BackgroundTasks, and makes async HTTP POST calls to subscriber URLs using httpx. The service needs proper error handling, retry logic, and async test coverage with dependency overrides.

## Prompt

"Build a FastAPI webhook delivery service. Store webhook events in PostgreSQL with async SQLAlchemy. Use BackgroundTasks to deliver webhooks via httpx POST to subscriber URLs. Include retry logic with exponential backoff, proper error handling, and async tests with httpx.AsyncClient that override the database dependency."

## Expected Output

### Pydantic Models

```python
# app/schemas/webhook.py
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

class WebhookEventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=100, examples=["order.created"])
    payload: dict = Field(description="Event payload to deliver to subscribers")

class WebhookEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    payload: dict
    status: str
    created_at: datetime

class SubscriberCreate(BaseModel):
    url: HttpUrl = Field(description="Webhook delivery URL")
    event_types: list[str] = Field(min_length=1, description="Event types to subscribe to")
    secret: str = Field(min_length=32, max_length=128, description="HMAC signing secret")

class DeliveryAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    subscriber_id: int
    status_code: int | None
    attempt_number: int
    succeeded: bool
    created_at: datetime
```

### Database Session Dependency

```python
# app/dependencies/database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False, pool_size=20, max_overflow=10)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
```

### Webhook Delivery Service

```python
# app/services/delivery.py
import hashlib
import hmac
import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import DeliveryAttempt, Subscriber, WebhookEvent

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BACKOFF_BASE = 2  # seconds

async def deliver_webhook(event_id: int, db_factory) -> None:
    """Background task: deliver webhook event to all matching subscribers."""
    async with db_factory() as db:
        event = await db.get(WebhookEvent, event_id)
        if not event:
            logger.error("Event %d not found for delivery", event_id)
            return

        result = await db.execute(
            select(Subscriber).where(
                Subscriber.event_types.contains([event.event_type])
            )
        )
        subscribers = result.scalars().all()

        async with httpx.AsyncClient(timeout=10.0) as client:
            for subscriber in subscribers:
                await _deliver_to_subscriber(db, client, event, subscriber)

        event.status = "delivered"
        await db.commit()

async def _deliver_to_subscriber(
    db: AsyncSession,
    client: httpx.AsyncClient,
    event: WebhookEvent,
    subscriber: Subscriber,
) -> None:
    payload_bytes = json.dumps(event.payload, sort_keys=True).encode()
    signature = hmac.new(
        subscriber.secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": f"sha256={signature}",
        "X-Webhook-Event": event.event_type,
    }

    for attempt_num in range(1, MAX_RETRIES + 1):
        attempt = DeliveryAttempt(
            event_id=event.id,
            subscriber_id=subscriber.id,
            attempt_number=attempt_num,
        )

        try:
            response = await client.post(
                str(subscriber.url), content=payload_bytes, headers=headers
            )
            attempt.status_code = response.status_code
            attempt.succeeded = 200 <= response.status_code < 300

            db.add(attempt)
            await db.commit()

            if attempt.succeeded:
                return

        except httpx.RequestError as exc:
            logger.warning("Delivery attempt %d failed: %s", attempt_num, exc)
            attempt.succeeded = False
            db.add(attempt)
            await db.commit()

        # Exponential backoff before retry
        if attempt_num < MAX_RETRIES:
            import asyncio
            await asyncio.sleep(BACKOFF_BASE ** attempt_num)

    logger.error(
        "All %d delivery attempts failed for event %d to subscriber %d",
        MAX_RETRIES, event.id, subscriber.id,
    )
```

### Router with BackgroundTasks

```python
# app/routers/webhooks.py
from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser
from app.dependencies.database import get_db, async_session_factory
from app.models.webhook import WebhookEvent
from app.schemas.webhook import WebhookEventCreate, WebhookEventResponse
from app.services.delivery import deliver_webhook

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post(
    "/events",
    response_model=WebhookEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    event_in: WebhookEventCreate,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    event = WebhookEvent(
        event_type=event_in.event_type,
        payload=event_in.payload,
        status="pending",
        created_by=current_user.id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Deliver asynchronously after the response is sent
    background_tasks.add_task(deliver_webhook, event.id, async_session_factory)

    return event

@router.get("/events/{event_id}", response_model=WebhookEventResponse)
async def get_event(
    event_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    event = await db.get(WebhookEvent, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event
```

### Async Tests with Dependency Overrides

```python
# tests/test_webhooks.py
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DATABASE_URL)
TestSessionFactory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

async def override_get_db():
    async with TestSessionFactory() as session:
        yield session

fake_user = type("User", (), {"id": 1, "email": "test@example.com"})()

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = lambda: fake_user

@pytest.mark.anyio
async def test_create_webhook_event():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/webhooks/events",
            json={"event_type": "order.created", "payload": {"order_id": "abc-123"}},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["event_type"] == "order.created"
    assert data["status"] == "pending"
    assert "id" in data

@pytest.mark.anyio
async def test_get_nonexistent_event_returns_404():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/webhooks/events/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"
```

## Key Decisions

- **BackgroundTasks instead of Celery** -- webhook delivery is latency-sensitive but does not need persistence guarantees beyond the database record. BackgroundTasks avoids the operational overhead of a broker.
- **Separate session factory for background tasks** -- the request-scoped session from `Depends(get_db)` is closed after the response, so background tasks create their own session from the factory.
- **HMAC signature on deliveries** -- subscribers can verify the payload was not tampered with by recomputing the signature with their secret.
- **`dependency_overrides` in tests** -- replaces the real database and auth dependencies with test doubles without modifying application code.
- **`ASGITransport` with `httpx.AsyncClient`** -- exercises the full ASGI lifecycle including middleware, dependencies, and background task scheduling.
