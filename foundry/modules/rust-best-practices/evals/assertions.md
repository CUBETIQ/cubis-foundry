# Rust Best Practices — Eval Assertions

## Eval 1: Ownership Design (rust-ownership-design)

This eval tests whether the skill correctly designs ownership hierarchies to avoid unnecessary cloning in a data pipeline.

### Assertions

1. **Move semantics between stages** — The response must pass owned data (e.g., `Vec<Record>`) between pipeline stages using moves rather than cloning the entire dataset. Move semantics are zero-cost in Rust and the pipeline's linear data flow naturally supports them.

2. **Shared references for the lookup table** — The read-only lookup table must be accessed via `&self` or `&HashMap<K, V>` rather than being cloned per worker. Read-only shared access is the fundamental borrow checker use case.

3. **Arc for cross-thread sharing** — When the transform stage uses multiple threads/tasks, the lookup table must be wrapped in `Arc<T>` (not `Arc<Mutex<T>>`) because it is read-only and `Arc` provides shared ownership without synchronization overhead for immutable data.

4. **Borrowing for intermediate access** — Within each stage, the code must use borrowed references (`&str`, `&[u8]`, `&Record`) for read-only operations rather than taking ownership when ownership transfer is not needed. This avoids unnecessary moves of data that the stage only inspects.

5. **Explicit ownership rationale** — The response must explain (via comments or prose) why each type is owned vs. borrowed. The skill's value is not just in the code but in teaching the ownership reasoning that informs future design decisions.

## Eval 2: Async Service Implementation (rust-async-service)

This eval tests whether the skill produces a well-structured async HTTP service with proper error handling and shutdown.

### Assertions

1. **Axum Router with extractors** — The response must use axum's `Router`, `Json` extractor for request parsing, and `State` for shared application state (database pool). Axum's extractor pattern is the idiomatic way to decompose HTTP requests in Rust.

2. **Graceful shutdown** — The service must implement shutdown using `tokio::signal` to listen for SIGTERM or using `CancellationToken` from `tokio_util`. The server must drain in-flight requests before exiting rather than dropping connections.

3. **thiserror for library errors, anyhow for main** — Error types in the service layer must use `#[derive(thiserror::Error)]` with named variants. The `main` function should use `anyhow::Result` because application entry points log errors rather than match on them.

4. **sqlx connection pool via State** — The PostgreSQL connection pool must be created with `sqlx::PgPool` and shared with handlers through axum's `State` extractor. The pool must be initialized before the server starts and outlive all requests.

5. **IntoResponse for error conversion** — The response must implement `IntoResponse` (or use axum's error handling mechanisms) to convert domain error types into HTTP responses with appropriate status codes and JSON bodies. Handlers must not manually construct HTTP error responses.
