# Error Handling Design

## Layered Error Strategy

Use `thiserror` for library error types (public API), `anyhow` for application-level propagation.

```rust
// LIBRARY LAYER — structured error enum with thiserror
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("record not found: {id}")]
    NotFound { id: String },

    #[error("connection failed: {source}")]
    Connection {
        #[source]
        source: tokio_postgres::Error,
    },

    #[error("serialization failed")]
    Serialization(#[from] serde_json::Error),

    #[error("query timeout after {duration:?}")]
    Timeout { duration: Duration },
}

// APPLICATION LAYER — anyhow for aggregating across libraries
use anyhow::{Context, Result};

async fn handle_request(req: Request) -> Result<Response> {
    let user = db.get_user(req.user_id)
        .await
        .context("failed to fetch user")?;     // adds context

    let profile = cache.get_profile(user.id)
        .await
        .context("failed to load profile")?;

    Ok(Response::ok(profile))
}
```

## Error Enum Design Principles

- **One error enum per crate or module boundary.** Do not create a god enum for the whole application.
- **Include context fields**, not just string messages. This makes errors actionable in logs.
- **Use `#[from]` sparingly** — only when the conversion is unambiguous and the source error is always the cause.
- **Derived errors must implement `Display` and `Debug`.** `thiserror` handles this automatically.

```rust
// GOOD — specific variants with context
#[derive(Debug, Error)]
pub enum AuthError {
    #[error("invalid credentials for user {username}")]
    InvalidCredentials { username: String },

    #[error("token expired at {expired_at}")]
    TokenExpired { expired_at: DateTime<Utc> },

    #[error("insufficient permissions: requires {required}, has {actual}")]
    Forbidden { required: String, actual: String },
}

// BAD — stringly-typed errors lose structure
#[derive(Debug, Error)]
pub enum AuthError {
    #[error("{0}")]
    General(String), // useless for programmatic handling
}
```

## Context Chain with `anyhow`

Build error chains that tell the full story of what went wrong and where:

```rust
use anyhow::{bail, ensure, Context, Result};

async fn sync_user_data(user_id: u64) -> Result<()> {
    let user = fetch_user(user_id)
        .await
        .with_context(|| format!("failed to fetch user {user_id}"))?;

    ensure!(!user.is_deleted, "user {user_id} is soft-deleted");

    let external = fetch_external_profile(&user.email)
        .await
        .context("external profile fetch failed")?;

    merge_profiles(&user, &external)
        .context("profile merge failed")?;

    Ok(())
}

// The resulting error chain reads:
// Error: profile merge failed
// Caused by:
//   0: field mapping conflict on 'email'
//   1: source type mismatch: expected String, got Vec<String>
```

## Mapping Foreign Errors at Crate Boundaries

Never expose dependency error types in your public API — they leak implementation details.

```rust
// BAD — leaking sqlx::Error in public API
pub async fn get_user(id: i64) -> Result<User, sqlx::Error> { ... }

// GOOD — map to domain error at the boundary
pub async fn get_user(id: i64) -> Result<User, StorageError> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| StorageError::Connection { source: e })?
        .ok_or(StorageError::NotFound { id: id.to_string() })
}
```

## Result Combinators

```rust
// Use map_err for error transformation
let user = db.find(id)
    .map_err(|e| AppError::Database(e))?;

// Use ok_or / ok_or_else for Option → Result
let config = env::var("API_KEY")
    .ok()
    .ok_or_else(|| AppError::Config("API_KEY not set".into()))?;

// Use and_then for chained fallible operations
let result = parse_input(raw)
    .and_then(|input| validate(input))
    .and_then(|valid| transform(valid));
```

## When to Panic vs Return Error

| Use                       | Panic (`unwrap`, `expect`, `panic!`)         | Error (`Result`, `?`)                       |
| ------------------------- | -------------------------------------------- | ------------------------------------------- |
| **Test code**             | Yes — tests should panic on unexpected state | Also fine                                   |
| **Infallible operations** | Yes — `"constant".parse::<u32>().unwrap()`   | Unnecessary                                 |
| **Programmer bugs**       | Yes — violated invariants, unreachable code  | No                                          |
| **Input validation**      | Never                                        | Yes — return error to caller                |
| **I/O failures**          | Never                                        | Yes — network, disk, external APIs          |
| **Business logic errors** | Never                                        | Yes — not found, invalid state, auth failed |

```rust
// PANIC is correct here — this is a programmer bug if it fails
let regex = Regex::new(r"^\d{4}-\d{2}-\d{2}$").expect("hardcoded regex is valid");

// ERROR is correct here — user input may be invalid
fn parse_date(input: &str) -> Result<NaiveDate, ParseError> {
    NaiveDate::parse_from_str(input, "%Y-%m-%d")
}
```

## Error Logging Best Practices

```rust
use tracing::{error, warn, info, instrument};

#[instrument(skip(db), err)]
async fn process_order(db: &Database, order_id: u64) -> Result<()> {
    let order = db.get_order(order_id)
        .await
        .map_err(|e| {
            error!(order_id, error = %e, "failed to fetch order");
            e
        })?;

    // Use warn for recoverable situations
    if order.items.is_empty() {
        warn!(order_id, "order has no items, skipping");
        return Ok(());
    }

    Ok(())
}
```

## Custom Error with HTTP Status Mapping

```rust
use axum::response::{IntoResponse, Response};
use axum::http::StatusCode;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("not found: {0}")]
    NotFound(String),

    #[error("validation failed: {0}")]
    Validation(String),

    #[error("unauthorized")]
    Unauthorized,

    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            ApiError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized".into()),
            ApiError::Internal(e) => {
                tracing::error!(error = %e, "internal error");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error".into())
            }
        };
        (status, axum::Json(serde_json::json!({ "error": message }))).into_response()
    }
}
```
