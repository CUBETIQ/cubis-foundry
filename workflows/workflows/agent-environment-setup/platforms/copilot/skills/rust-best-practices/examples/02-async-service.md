# Example: Async HTTP Service with Axum, Tokio, and Graceful Shutdown

## Scenario

Build a production async HTTP service with axum that includes health checks, JSON endpoint, PostgreSQL connection pooling, structured error handling with thiserror, and graceful shutdown via CancellationToken.

## Implementation

```rust
use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::signal;
use tokio_util::sync::CancellationToken;
use tracing::{info, error};

// --- Error types (thiserror for the library layer) ---

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found: {0}")]
    NotFound(String),

    #[error("validation error: {0}")]
    Validation(String),

    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("internal error: {0}")]
    Internal(String),
}

// Convert domain errors into HTTP responses
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Database(_) => {
                error!("Database error: {}", self);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal server error".to_string(),
                )
            }
            AppError::Internal(msg) => {
                error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal server error".to_string(),
                )
            }
        };

        let body = serde_json::json!({ "error": message });
        (status, Json(body)).into_response()
    }
}

// --- Shared application state ---

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub cancel: CancellationToken,
}

// --- Request/Response types ---

#[derive(Debug, Deserialize)]
pub struct CreateItemRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Item {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub db_connected: bool,
}

// --- Handlers ---

async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let db_ok = sqlx::query("SELECT 1")
        .execute(&state.db)
        .await
        .is_ok();

    let resp = HealthResponse {
        status: if db_ok { "healthy" } else { "degraded" },
        db_connected: db_ok,
    };

    let status = if db_ok {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (status, Json(resp))
}

async fn create_item(
    State(state): State<AppState>,
    Json(req): Json<CreateItemRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(AppError::Validation("name cannot be empty".to_string()));
    }

    if req.name.len() > 255 {
        return Err(AppError::Validation("name too long (max 255)".to_string()));
    }

    // Insert into database
    let item = sqlx::query_as!(
        Item,
        r#"
        INSERT INTO items (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description
        "#,
        req.name,
        req.description,
    )
    .fetch_one(&state.db)
    .await?; // ? converts sqlx::Error to AppError via From

    info!(item_id = item.id, name = %item.name, "item_created");

    Ok((StatusCode::CREATED, Json(item)))
}

async fn get_item(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let item = sqlx::query_as!(Item, "SELECT id, name, description FROM items WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("item {id}")))?;

    Ok(Json(item))
}

// --- Router ---

fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/items", post(create_item))
        .route("/items/{id}", get(get_item))
        .with_state(state)
}

// --- Shutdown signal ---

async fn shutdown_signal(cancel: CancellationToken) {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let sigterm = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let sigterm = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => info!("received Ctrl+C"),
        _ = sigterm => info!("received SIGTERM"),
        _ = cancel.cancelled() => info!("cancellation token triggered"),
    }

    info!("initiating graceful shutdown");
}

// --- Entry point (anyhow for the binary layer) ---

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::init();

    // Connect to database
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://localhost/myapp".to_string());

    let db = PgPool::connect(&db_url).await?;
    info!("connected to database");

    // Run migrations
    sqlx::migrate!().run(&db).await?;

    // Create shared state
    let cancel = CancellationToken::new();
    let state = AppState {
        db,
        cancel: cancel.clone(),
    };

    let app = create_router(state);

    // Bind and serve
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    info!(%addr, "starting server");

    let listener = tokio::net::TcpListener::bind(addr).await?;

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal(cancel))
        .await?;

    info!("server stopped");
    Ok(())
}
```

## Key Patterns

1. **`thiserror`** — `AppError` derives `Error` with `#[from]` for automatic `sqlx::Error` conversion.
2. **`IntoResponse`** — maps each error variant to the appropriate HTTP status and JSON body.
3. **`anyhow::Result`** in `main()` — binary entry point logs and exits; no need to match error variants.
4. **`State<AppState>`** — `PgPool` and `CancellationToken` shared with all handlers via axum state.
5. **`with_graceful_shutdown`** — server drains in-flight requests before stopping.
6. **`?` operator** — propagates `sqlx::Error` through `From` impl to `AppError::Database`.
