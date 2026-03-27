# Pydantic v2 Models

## BaseModel Fundamentals

Pydantic v2 uses Rust-based validation (pydantic-core) for a 5-50x speedup over v1. Key API changes from v1:

| v1 API | v2 API |
|--------|--------|
| `class Config:` inner class | `model_config = ConfigDict(...)` |
| `@validator` | `@field_validator` |
| `@root_validator` | `@model_validator` |
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `.parse_obj()` | `.model_validate()` |
| `update_forward_refs()` | `model_rebuild()` |

## Model Definition Patterns

### Request Model

```python
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from datetime import date

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=100, examples=["Jane Doe"])
    date_of_birth: date | None = Field(default=None, description="ISO 8601 date")
```

### Response Model

```python
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    date_of_birth: date | None
    created_at: datetime
```

`from_attributes=True` enables construction from ORM objects: `UserResponse.model_validate(db_user)`.

### Update Model (Partial)

```python
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=100)
    date_of_birth: date | None = None

# Usage: only update fields that were explicitly sent
update_data = user_update.model_dump(exclude_unset=True)
```

`exclude_unset=True` distinguishes "field not sent" from "field set to None."

## Field Configuration

```python
from pydantic import Field
from decimal import Decimal

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=200, description="Product display name")
    sku: str = Field(pattern=r'^[A-Z]{3}-\d{3,6}$', examples=["WDG-001"])
    price: Decimal = Field(gt=0, decimal_places=2, description="Price in USD")
    quantity: int = Field(ge=0, le=999999, default=0)
    tags: list[str] = Field(default_factory=list, max_length=10)
    metadata: dict[str, str] = Field(default_factory=dict)
```

## Validators

### Field Validators

```python
from pydantic import BaseModel, field_validator

class UserCreate(BaseModel):
    username: str
    password: str
    password_confirm: str

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain an uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain a digit')
        return v
```

### Model Validators

```python
from pydantic import model_validator

class DateRange(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode='after')
    def check_date_order(self) -> 'DateRange':
        if self.start_date >= self.end_date:
            raise ValueError('end_date must be after start_date')
        return self

class RawInput(BaseModel):
    data: dict

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, values: dict) -> dict:
        if 'data' in values and isinstance(values['data'], dict):
            values['data'] = {k.lower(): v for k, v in values['data'].items()}
        return values
```

`mode='before'` runs before field validation. `mode='after'` runs after all fields are validated.

## Serialization Customization

```python
from pydantic import BaseModel, field_serializer, computed_field
from datetime import datetime

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_cents: int
    created_at: datetime

    @computed_field
    @property
    def total_dollars(self) -> str:
        return f"${self.total_cents / 100:.2f}"

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        return value.isoformat()
```

`@computed_field` adds fields to the output that are not in the input. They appear in the OpenAPI schema.

## Discriminated Unions

```python
from pydantic import BaseModel, Field
from typing import Literal, Annotated, Union

class EmailNotification(BaseModel):
    type: Literal["email"]
    to: EmailStr
    subject: str

class SmsNotification(BaseModel):
    type: Literal["sms"]
    phone: str
    message: str

class PushNotification(BaseModel):
    type: Literal["push"]
    device_token: str
    title: str

NotificationType = Annotated[
    Union[EmailNotification, SmsNotification, PushNotification],
    Field(discriminator="type"),
]

class NotificationRequest(BaseModel):
    notifications: list[NotificationType]
```

Discriminated unions use the `type` field to determine which model to validate against. This is significantly faster than trying each union member.

## Settings Management

```python
from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="APP_",
        case_sensitive=False,
    )

    database_url: str = Field(description="PostgreSQL connection string")
    secret_key: SecretStr = Field(min_length=32)
    debug: bool = Field(default=False)
    allowed_hosts: list[str] = Field(default=["localhost"])
    redis_url: str = Field(default="redis://localhost:6379")

# Usage
settings = Settings()  # Reads from environment variables prefixed with APP_
```

`SecretStr` masks the value in logs and repr. Access with `settings.secret_key.get_secret_value()`.

## Generic Response Wrapper

```python
from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool

# Usage in endpoint
@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(...):
    ...
```

## Common Pitfalls

| Pitfall | Consequence | Fix |
|---------|------------|-----|
| Using `dict` instead of model for response | No validation, no OpenAPI schema | Define a response model |
| Missing `from_attributes=True` | Cannot construct from ORM objects | Add to `model_config` |
| Using `Optional[str]` without `= None` | Field becomes required in JSON | Always set `= None` for optional |
| Using `@validator` (v1 syntax) | `PydanticUserError` at import time | Use `@field_validator` |
| Returning model instance directly | FastAPI serializes with `model_dump()` | Works correctly; just be aware |
