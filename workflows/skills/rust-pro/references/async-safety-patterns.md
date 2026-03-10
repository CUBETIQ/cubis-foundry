# Async Safety Patterns

## Cancellation Safety

Every async function must handle being dropped at any `.await` point. State mutations before an `.await` that is never completed leave the system in an inconsistent state.

```rust
// UNSAFE — if the send is cancelled, counter is incremented but work is lost
async fn process(state: &mut State, tx: &Sender<Result>) {
    state.counter += 1;        // mutation happens
    let result = compute().await;  // if dropped here...
    tx.send(result).await.ok();    // ...this never executes
}

// SAFE — defer state mutation until after the fallible await
async fn process(state: &mut State, tx: &Sender<Result>) {
    let result = compute().await;
    state.counter += 1;        // mutation only after successful compute
    tx.send(result).await.ok();
}
```

## `select!` Safety

`tokio::select!` drops the unselected future. Treat every branch as independently cancellable.

```rust
use tokio::select;
use tokio::time::{sleep, Duration};

// SAFE select — each branch is independently safe to cancel
async fn fetch_with_timeout(url: &str) -> Result<Response, Error> {
    select! {
        result = fetch(url) => result,
        _ = sleep(Duration::from_secs(10)) => Err(Error::Timeout),
    }
}

// DANGEROUS — the channel receive buffer may lose a message if the other branch wins
// Solution: use a wrapper that puts the message back on cancellation
async fn process_or_shutdown(
    rx: &mut Receiver<Message>,
    mut shutdown: tokio::sync::watch::Receiver<bool>,
) {
    loop {
        select! {
            msg = rx.recv() => {
                if let Some(msg) = msg {
                    handle(msg).await;
                }
            }
            _ = shutdown.changed() => {
                tracing::info!("shutting down");
                break;
            }
        }
    }
}
```

## Structured Concurrency with `JoinSet`

Prefer `JoinSet` over unbounded `tokio::spawn` for managing groups of tasks.

```rust
use tokio::task::JoinSet;

async fn process_batch(items: Vec<Item>) -> Vec<Result<Output, Error>> {
    let mut set = JoinSet::new();
    let semaphore = Arc::new(Semaphore::new(10)); // bound concurrency

    for item in items {
        let permit = semaphore.clone().acquire_owned().await.unwrap();
        set.spawn(async move {
            let result = process_item(item).await;
            drop(permit); // release before returning
            result
        });
    }

    let mut results = Vec::new();
    while let Some(res) = set.join_next().await {
        match res {
            Ok(output) => results.push(output),
            Err(join_err) => {
                tracing::error!(?join_err, "task panicked");
                results.push(Err(Error::TaskPanic));
            }
        }
    }
    results
}
```

## Backpressure Patterns

Never allow unbounded work queues. Apply backpressure at every boundary.

```rust
// Bounded channel — sender blocks when buffer is full
let (tx, rx) = tokio::sync::mpsc::channel::<Job>(256);

// Semaphore-based concurrency limit
async fn rate_limited_fetch(
    urls: Vec<String>,
    max_concurrent: usize,
) -> Vec<Result<Response, Error>> {
    let semaphore = Arc::new(Semaphore::new(max_concurrent));
    let mut handles = Vec::new();

    for url in urls {
        let sem = semaphore.clone();
        handles.push(tokio::spawn(async move {
            let _permit = sem.acquire().await.unwrap();
            reqwest::get(&url).await.map_err(Into::into)
        }));
    }

    futures::future::join_all(handles)
        .await
        .into_iter()
        .map(|r| r.unwrap_or_else(|e| Err(e.into())))
        .collect()
}
```

## Graceful Shutdown

Use `CancellationToken` or `watch` channels for coordinated shutdown.

```rust
use tokio_util::sync::CancellationToken;

async fn run_server(token: CancellationToken) {
    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();

    loop {
        select! {
            Ok((stream, _)) = listener.accept() => {
                let child_token = token.child_token();
                tokio::spawn(async move {
                    handle_connection(stream, child_token).await;
                });
            }
            _ = token.cancelled() => {
                tracing::info!("server shutting down");
                break;
            }
        }
    }
}

// Main entry: create token, pass to components, cancel on signal
#[tokio::main]
async fn main() {
    let token = CancellationToken::new();
    let server_token = token.clone();

    let server = tokio::spawn(run_server(server_token));

    // Wait for SIGTERM
    tokio::signal::ctrl_c().await.ok();
    token.cancel(); // all child tokens are cancelled

    server.await.ok();
}
```

## Runtime Configuration

```rust
// Explicit runtime builder for production — never rely on defaults
#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() {
    // OR build manually for more control:
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(num_cpus::get())
        .max_blocking_threads(128)
        .enable_all()
        .thread_name("app-worker")
        .build()
        .unwrap();

    runtime.block_on(async {
        start_app().await;
    });
}
```

## `Send` + `Sync` Boundaries

When using trait objects in async contexts, state the bounds explicitly.

```rust
// Trait object that can be sent across threads and stored in Arc
type BoxedService = Box<dyn Service + Send + Sync>;

// Generic function constraining the future to be spawnable
async fn spawn_work<F, T>(f: F) -> T
where
    F: Future<Output = T> + Send + 'static,
    T: Send + 'static,
{
    tokio::spawn(f).await.unwrap()
}

// Common pitfall: holding a non-Send guard across .await
async fn bad_example(data: &std::sync::Mutex<Vec<u8>>) {
    let guard = data.lock().unwrap(); // MutexGuard is !Send
    do_async_work().await;            // ERROR: future is !Send
    drop(guard);
}

// Fix: drop the guard before .await
async fn good_example(data: &std::sync::Mutex<Vec<u8>>) {
    let snapshot = {
        let guard = data.lock().unwrap();
        guard.clone() // extract data, drop guard
    };
    do_async_work().await; // future is Send
}
```

## Common Async Pitfalls

| Pitfall                                     | Symptom                            | Fix                                       |
| ------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| Holding `MutexGuard` across `.await`        | Compile error: future is `!Send`   | Clone data out, drop guard, then `.await` |
| State mutation before `.await` in `select!` | Data inconsistency on cancellation | Defer mutation until after the `.await`   |
| Unbounded `spawn` fan-out                   | Memory exhaustion under load       | Use `JoinSet` + `Semaphore`               |
| Blocking in async context                   | Stalls entire runtime thread       | Use `spawn_blocking` for CPU/IO work      |
| Missing `tokio::signal` handling            | No graceful shutdown               | Use `CancellationToken` + signal handler  |
