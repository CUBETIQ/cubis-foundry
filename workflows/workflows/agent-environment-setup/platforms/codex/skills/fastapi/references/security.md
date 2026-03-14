# Security

## Authentication Patterns

### OAuth2 Password Flow with JWT

```python
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.secret_key.get_secret_value(), algorithm="HS256")

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
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=["HS256"],
        )
        user_id: int | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user
```

### Login Endpoint

```python
from fastapi import APIRouter
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    return Token(access_token=access_token, token_type="bearer")
```

## API Key Authentication

```python
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(
    api_key: Annotated[str, Depends(api_key_header)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiClient:
    client = await db.execute(
        select(ApiClient).where(ApiClient.key_hash == hash_api_key(api_key))
    )
    client = client.scalar_one_or_none()
    if not client or not client.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key")
    return client
```

## Role-Based Access Control

```python
from functools import wraps

def require_role(*roles: str):
    """Dependency factory that checks user roles."""
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(roles)}",
            )
        return current_user
    return role_checker

AdminUser = Annotated[User, Depends(require_role("admin"))]
ModeratorUser = Annotated[User, Depends(require_role("admin", "moderator"))]

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: AdminUser):
    ...
```

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,       # ["https://example.com"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Request-Id"],
    max_age=600,  # Cache preflight for 10 minutes
)
```

### Common CORS Mistakes

| Mistake | Consequence | Fix |
|---------|------------|-----|
| `allow_origins=["*"]` with `allow_credentials=True` | Browser rejects response | Use explicit origins with credentials |
| Missing `Authorization` in `allow_headers` | Bearer tokens fail in browsers | Add to `allow_headers` |
| No `expose_headers` | Custom headers invisible to JavaScript | List headers to expose |

## HTTPS and Security Headers

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# Redirect HTTP to HTTPS
app.add_middleware(HTTPSRedirectMiddleware)

# Reject requests with unexpected Host headers
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts,
)
```

### Security Headers Middleware

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

## Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

## Input Sanitization

```python
import bleach
from pydantic import field_validator

class CommentCreate(BaseModel):
    content: str = Field(max_length=5000)

    @field_validator("content")
    @classmethod
    def sanitize_html(cls, v: str) -> str:
        return bleach.clean(v, tags=["b", "i", "a", "p", "br"], strip=True)
```

## Security Checklist

| Check | Implementation |
|-------|---------------|
| Password hashing | bcrypt via `passlib` (cost factor >= 12) |
| JWT expiration | Short-lived access tokens (15-30 min) |
| Token refresh | Separate refresh token endpoint |
| CORS | Explicit origins, no wildcard with credentials |
| HTTPS | HTTPSRedirectMiddleware in production |
| Rate limiting | `slowapi` on auth and write endpoints |
| Input validation | Pydantic models on all request bodies |
| SQL injection | SQLAlchemy parameterized queries (never f-strings) |
| XSS | Content-Type-Options, sanitize user HTML |
| CSRF | Not needed for token-based APIs (no cookies) |
