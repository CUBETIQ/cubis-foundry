# Rust Async Runtime (Tokio)

## Runtime Model

Tokio uses a work-stealing, multi-threaded scheduler. Each `async fn` compiles to a state machine that yields at `.await` points. The runtime multiplexes many tasks onto a fixed-size thread pool.

### Runtime Setup

```rust
// Binary entry point — #[tokio::main] macro
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // This creates a multi-threaded runtime
    run_app().await
}

// Explicit runtime construction (more control)
fn main() -> anyhow::Result<()> {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()?;

    rt.block_on(run_app())
}

// Libraries should NOT create their own runtime.
// Accept the caller's runtime context.
pub async fn fetch_data(url: &str) -> Result<Data> {
    // runs on whatever runtime the caller uses
    reqwest::get(url).await?.json().await.map_err(Into::into)
}
```

## Structured Concurrency with JoinSet

```rust
use tokio::task::JoinSet;

async fn fetch_all(urls: Vec<String>) -> Vec<Result<Response, Error>> {
    let mut set = JoinSet::new();

    for url in urls {
        set.spawn(async move {
            reqwest::get(&url).await.map_err(Error::from)
        });
    }

    let mut results = Vec::new();
    while let Some(result) = set.join_next().await {
        match result {
            Ok(inner) => results.push(inner),
            Err(join_err) => {
                // Task panicked or was cancelled
                results.push(Err(Error::TaskFailed(join_err.to_string())));
            }
        }
    }

    results
}
```

### JoinSet vs tokio::spawn

| Feature | `JoinSet` | Bare `tokio::spawn` |
| --- | --- | --- |
| Task tracking | Managed collection | Manual handle tracking |
| Cancellation | `set.abort_all()` or drop | Manual `handle.abort()` |
| Result collection | `join_next().await` | Must await each handle |
| Use when | Fan-out with result collection | Background tasks |

## tokio::select! for Racing Futures

```rust
use tokio::time::timeout;

async fn fetch_with_fallback(primary: &str, fallback: &str) -> Result<Data> {
    tokio::select! {
        result = fetch(primary) => {
            match result {
                Ok(data) => Ok(data),
                Err(_) => fetch(fallback).await,
            }
        }
        _ = tokio::time::sleep(Duration::from_secs(3)) => {
            // Primary timed out, try fallback
            fetch(fallback).await
        }
    }
}
```

### select! Cancellation Rules

- When one branch completes, all other branches are **dropped** (cancelled).
- Dropped futures run their destructors but do NOT complete their `.await` points.
- This means: the losing futures' `.await` calls are cancelled mid-execution.

```rust
// SAFE: both futures are cancel-safe
tokio::select! {
    msg = rx.recv() => handle_message(msg),
    _ = shutdown.cancelled() => return,
}

// UNSAFE: recv() on a stream may lose a message if cancelled
// between receiving and processing. Use tokio::pin! to avoid.
```

## CancellationToken for Graceful Shutdown

```rust
use tokio_util::sync::CancellationToken;

struct App {
    cancel: CancellationToken,
}

impl App {
    async fn run(&self) -> anyhow::Result<()> {
        let mut set = JoinSet::new();

        // Spawn workers
        for i in 0..4 {
            let cancel = self.cancel.clone();
            set.spawn(async move {
                worker(i, cancel).await
            });
        }

        // Wait for shutdown signal
        tokio::select! {
            _ = signal::ctrl_c() => {
                tracing::info!("received Ctrl+C, shutting down");
                self.cancel.cancel();
            }
            _ = self.cancel.cancelled() => {}
        }

        // Wait for workers to finish draining
        while let Some(result) = set.join_next().await {
            if let Err(e) = result {
                tracing::error!("worker error: {e}");
            }
        }

        Ok(())
    }
}

async fn worker(id: usize, cancel: CancellationToken) -> anyhow::Result<()> {
    loop {
        tokio::select! {
            _ = cancel.cancelled() => {
                tracing::info!(worker_id = id, "shutting down");
                return Ok(());
            }
            _ = do_work() => {}
        }
    }
}
```

## spawn_blocking for CPU/IO Work

```rust
// WRONG: blocking the async runtime
async fn bad_hash(data: Vec<u8>) -> String {
    // This stalls the tokio worker thread
    sha256::digest(&data)
}

// CORRECT: offload to blocking thread pool
async fn hash(data: Vec<u8>) -> Result<String> {
    tokio::task::spawn_blocking(move || {
        sha256::digest(&data)
    })
    .await
    .map_err(|e| anyhow::anyhow!("hash task failed: {e}"))
}
```

### What Blocks the Runtime

- CPU-intensive computation (hashing, compression, serialization)
- Synchronous I/O (`std::fs`, `std::net`)
- `std::thread::sleep`
- FFI calls to C libraries
- Any operation that takes > 10-50 microseconds without yielding

## Async Streams

```rust
use tokio_stream::{Stream, StreamExt};

// Producing a stream
fn query_stream(pool: &PgPool) -> impl Stream<Item = Result<Row>> + '_ {
    sqlx::query("SELECT * FROM events")
        .fetch(pool) // Returns a Stream
}

// Consuming a stream
async fn process_stream(pool: &PgPool) -> Result<()> {
    let mut stream = query_stream(pool);

    while let Some(row) = stream.try_next().await? {
        process_row(row).await?;
    }

    Ok(())
}

// Buffered stream processing
async fn buffered_fetch(urls: Vec<String>) -> Vec<Result<Response>> {
    tokio_stream::iter(urls)
        .map(|url| async move { reqwest::get(&url).await })
        .buffer_unordered(10) // Up to 10 concurrent fetches
        .collect()
        .await
}
```

## Tower Middleware Pattern

```rust
use tower::{Service, ServiceBuilder, ServiceExt};

// Tower services compose middleware for async request processing
let service = ServiceBuilder::new()
    .timeout(Duration::from_secs(30))
    .rate_limit(100, Duration::from_secs(1))
    .retry(ExponentialBackoff::default())
    .service(MyService::new());
```

## Async Trait Methods (Rust 2024)

```rust
// Before: required async-trait crate
// #[async_trait]
// trait MyTrait {
//     async fn process(&self) -> Result<()>;
// }

// Rust 2024: native async fn in traits (RPITIT)
trait Processor {
    async fn process(&self, input: &[u8]) -> Result<Vec<u8>>;
}

// impl is straightforward
struct JsonProcessor;

impl Processor for JsonProcessor {
    async fn process(&self, input: &[u8]) -> Result<Vec<u8>> {
        let parsed: Value = serde_json::from_slice(input)?;
        let output = transform(parsed).await?;
        Ok(serde_json::to_vec(&output)?)
    }
}
```

### Limitation: dyn Trait

Async fn in traits does not directly support `dyn Trait` because the returned future has no fixed size. Use `trait_variant::make` or box the future manually when dynamic dispatch is needed.
