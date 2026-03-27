# Rust Error Handling

## Error Design Philosophy

Rust uses `Result<T, E>` for recoverable errors and `panic!` for unrecoverable bugs. Libraries should never panic; applications panic only for truly impossible states.

## thiserror for Library Errors

`thiserror` generates `Display`, `Error`, and `From` implementations via derive macros.

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("user not found: {0}")]
    NotFound(String),

    #[error("validation failed: {field} — {message}")]
    Validation { field: String, message: String },

    #[error("database error")]
    Database(#[from] sqlx::Error),

    #[error("serialization error")]
    Serialization(#[from] serde_json::Error),

    #[error("upstream API error: {status}")]
    Upstream { status: u16, body: String },

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}
```

### Key thiserror Features

| Attribute | Effect |
| --- | --- |
| `#[error("...")]` | Generates `Display` implementation |
| `#[from]` | Generates `From<T>` for automatic `?` conversion |
| `#[source]` | Sets the `source()` method without `From` |
| `#[error(transparent)]` | Delegates `Display` and `source()` to the inner error |

### When to Use Which

```rust
// #[from] — when the conversion is always valid and one-to-one
#[error("database error")]
Database(#[from] sqlx::Error),

// #[source] — when you need to add context alongside the source
#[error("failed to load config from {path}")]
ConfigLoad { path: String, #[source] source: std::io::Error },

// No attribute — when the error carries data unrelated to source chaining
#[error("rate limited, retry after {retry_after_secs}s")]
RateLimited { retry_after_secs: u64 },
```

## anyhow for Application Errors

`anyhow::Result` is for binaries and application code where you log errors rather than match on them.

```rust
use anyhow::{Context, Result};

async fn run_app() -> Result<()> {
    let config = load_config()
        .context("failed to load application config")?;

    let db = connect_db(&config.database_url)
        .await
        .context("failed to connect to database")?;

    start_server(db, config)
        .await
        .context("server error")?;

    Ok(())
}

#[tokio::main]
async fn main() {
    if let Err(err) = run_app().await {
        // anyhow prints the full error chain
        eprintln!("Error: {err:?}");
        std::process::exit(1);
    }
}
```

### .context() vs .map_err()

```rust
// .context() adds a string message to the chain
let data = std::fs::read_to_string(path)
    .context("failed to read config file")?;

// .with_context() defers message creation (for expensive formatting)
let data = std::fs::read_to_string(path)
    .with_context(|| format!("failed to read config from {path}"))?;

// .map_err() transforms the error type (use with thiserror)
let data = std::fs::read_to_string(path)
    .map_err(|e| ServiceError::ConfigLoad { path: path.to_string(), source: e })?;
```

## The ? Operator

`?` propagates errors by calling `From::from()` on the error type:

```rust
// This chain works because:
// 1. sqlx::Error -> ServiceError via #[from]
// 2. ServiceError -> anyhow::Error via blanket From impl
async fn get_user(pool: &PgPool, id: i64) -> Result<User, ServiceError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(pool)
        .await?  // sqlx::Error -> ServiceError::Database via From
        .ok_or_else(|| ServiceError::NotFound(format!("user {id}")))?;
    Ok(user)
}
```

## Error Conversion Patterns

### Library to Application Boundary

```rust
// Library defines typed errors
pub enum LibError {
    Parse(ParseError),
    Io(std::io::Error),
}

// Application wraps with anyhow at the boundary
async fn handle_request(req: Request) -> anyhow::Result<Response> {
    let data = lib::process(&req.body)
        .map_err(|e| anyhow::anyhow!("processing failed: {e}"))?;
    // or simply:
    let data = lib::process(&req.body)?; // works if LibError: std::error::Error
    Ok(Response::new(data))
}
```

### HTTP Error Mapping (with axum)

```rust
impl IntoResponse for ServiceError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ServiceError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            ServiceError::Validation { field, message } => (
                StatusCode::BAD_REQUEST,
                format!("{field}: {message}"),
            ),
            ServiceError::Database(e) => {
                tracing::error!("Database error: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error".into())
            }
            ServiceError::Upstream { status, .. } => {
                (StatusCode::BAD_GATEWAY, format!("upstream returned {status}"))
            }
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "internal error".into()),
        };

        let body = serde_json::json!({ "error": message });
        (status, axum::Json(body)).into_response()
    }
}
```

## Result Combinators

```rust
// .map() — transform the Ok value
let length: Result<usize, Error> = read_file(path).map(|s| s.len());

// .map_err() — transform the Err value
let data = std::fs::read(path).map_err(ServiceError::from)?;

// .and_then() — chain fallible operations
let user = find_user(id)
    .and_then(|u| validate_user(u))
    .and_then(|u| enrich_user(u))?;

// .unwrap_or_else() — provide a fallback
let config = load_config().unwrap_or_else(|_| Config::default());

// .ok() — convert Result to Option, discarding the error
let maybe_user: Option<User> = find_user(id).ok();
```

## Panic Discipline

### When to Panic

```rust
// 1. Unreachable code (provably impossible)
fn get_variant(v: &MyEnum) -> &str {
    match v {
        MyEnum::A => "a",
        MyEnum::B => "b",
        // If we KNOW all variants are covered but compiler disagrees
    }
}

// 2. Test code
#[test]
fn test_parse() {
    let result = parse("valid input").unwrap(); // OK in tests
    assert_eq!(result, expected);
}

// 3. Infallible operations with documented reasoning
let regex = Regex::new(r"^\d+$").expect("static regex is always valid");
```

### When NOT to Panic

```rust
// WRONG: library code that panics
pub fn parse(input: &str) -> Config {
    serde_json::from_str(input).unwrap() // panics on invalid input
}

// CORRECT: return Result
pub fn parse(input: &str) -> Result<Config, ParseError> {
    serde_json::from_str(input).map_err(ParseError::from)
}
```

## Error Testing

```rust
#[test]
fn test_not_found_error() {
    let result = get_user(999);
    assert!(result.is_err());

    let err = result.unwrap_err();
    assert!(matches!(err, ServiceError::NotFound(_)));
}

#[test]
fn test_error_display() {
    let err = ServiceError::NotFound("user 42".to_string());
    assert_eq!(err.to_string(), "user not found: user 42");
}

#[test]
fn test_error_source_chain() {
    let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file missing");
    let err = ServiceError::ConfigLoad {
        path: "/etc/config".to_string(),
        source: io_err,
    };

    // Verify the source chain
    use std::error::Error;
    assert!(err.source().is_some());
}
```
