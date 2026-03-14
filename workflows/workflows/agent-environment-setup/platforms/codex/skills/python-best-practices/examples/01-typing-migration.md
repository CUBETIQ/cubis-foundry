# Example: Migrating a Data Access Layer to Modern Typing

## Scenario

You have a Python 3.10 data access layer with legacy typing idioms. Migrate it to Python 3.13+ using PEP 695 type parameter syntax, union types, and TypeIs narrowing.

## Before (Legacy)

```python
from typing import TypeVar, Optional, Union, Generic, overload
from dataclasses import dataclass

T = TypeVar("T")
ID = TypeVar("ID", int, str)

@dataclass
class User:
    id: int
    name: str
    email: Optional[str] = None

@dataclass
class Product:
    id: int
    sku: str
    price: float

class Repository(Generic[T, ID]):
    def __init__(self) -> None:
        self._store: dict[ID, T] = {}

    def get(self, id: ID) -> Optional[T]:
        return self._store.get(id)

    def save(self, id: ID, entity: T) -> None:
        self._store[id] = entity

    def find_all(self) -> list[T]:
        return list(self._store.values())

def is_valid_entity(value: Union[User, Product, None]) -> bool:
    if value is None:
        return False
    if isinstance(value, User):
        return value.email is not None
    return value.price > 0
```

## After (Python 3.13+)

```python
from typing import TypeIs
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str | None = None

@dataclass
class Product:
    id: int
    sku: str
    price: float

class Repository[T, ID: (int, str)]:
    """Generic repository with type-safe ID constraint."""

    def __init__(self) -> None:
        self._store: dict[ID, T] = {}

    def get(self, id: ID) -> T | None:
        return self._store.get(id)

    def save(self, id: ID, entity: T) -> None:
        self._store[id] = entity

    def find_all(self) -> list[T]:
        return list(self._store.values())

def is_user(value: User | Product | None) -> TypeIs[User]:
    """Narrows both branches: True -> User, False -> Product | None."""
    return isinstance(value, User)

def is_valid_entity(value: User | Product | None) -> bool:
    if value is None:
        return False
    if is_user(value):
        # Type narrowed to User here
        return value.email is not None
    # Type narrowed to Product here
    return value.price > 0
```

## Key Changes Explained

1. **`class Repository[T, ID: (int, str)]`** replaces `Generic[T, ID]` and `ID = TypeVar("ID", int, str)`. The constraint `(int, str)` limits ID to those types.
2. **`T | None`** replaces `Optional[T]` everywhere.
3. **`User | Product | None`** replaces `Union[User, Product, None]`.
4. **`TypeIs[User]`** replaces a boolean return — it narrows both the true and false branches, which `TypeGuard` cannot do.
5. All `TypeVar` declarations and `Generic` import are removed.
