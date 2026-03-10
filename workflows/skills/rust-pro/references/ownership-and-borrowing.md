# Ownership and Borrowing Patterns

## Ownership Transfer

```rust
// Prefer moving into constructors — caller surrenders ownership
struct Service {
    db: DatabasePool,
    cache: CacheClient,
}

impl Service {
    fn new(db: DatabasePool, cache: CacheClient) -> Self {
        Self { db, cache }
    }
}

// Return owned types from factory functions
fn create_config() -> Config {
    Config {
        timeout: Duration::from_secs(30),
        retries: 3,
    }
}
```

## Borrow Scope Tightening

Keep borrows as short as possible. Release them before calling functions that need `&mut self`.

```rust
// BAD — borrow lives across the mutation point
fn process(data: &mut HashMap<String, Vec<u8>>) {
    let entry = data.get("key"); // immutable borrow starts
    if entry.is_some() {
        data.insert("key".into(), vec![1, 2, 3]); // ERROR: mutable borrow while immutable active
    }
}

// GOOD — clone or extract what you need, then release the borrow
fn process(data: &mut HashMap<String, Vec<u8>>) {
    let has_key = data.contains_key("key"); // borrow released immediately
    if has_key {
        data.insert("key".into(), vec![1, 2, 3]); // no conflict
    }
}
```

## When to Use `Cow`

Use `Cow<'_, T>` when a function sometimes allocates and sometimes borrows.

```rust
use std::borrow::Cow;

// Returns borrowed data for ASCII, owned for non-ASCII
fn normalize_name(input: &str) -> Cow<'_, str> {
    if input.is_ascii() {
        Cow::Borrowed(input) // zero allocation
    } else {
        Cow::Owned(input.to_lowercase()) // allocates only when needed
    }
}

// Useful for config values that may come from static strings or environment
fn get_base_url() -> Cow<'static, str> {
    match std::env::var("BASE_URL") {
        Ok(url) => Cow::Owned(url),
        Err(_) => Cow::Borrowed("https://api.example.com"),
    }
}
```

## `Arc` vs Move vs Clone Tradeoffs

| Strategy            | When to use                                                                             | Cost                                |
| ------------------- | --------------------------------------------------------------------------------------- | ----------------------------------- |
| **Move**            | Value has one consumer. Constructor, spawn, channel send.                               | Zero runtime cost                   |
| **Clone**           | Value is cheap to copy (small structs, `Arc`). Each consumer owns independent copy.     | Copy cost, separate lifetimes       |
| **`Arc<T>`**        | Multiple owners need shared read access. Immutable shared state.                        | Atomic ref-count on clone/drop      |
| **`Arc<Mutex<T>>`** | Multiple owners need mutable access. Use only when channel-based design is impractical. | Lock contention risk                |
| **`&T` borrow**     | Caller retains ownership, callee only reads temporarily.                                | Zero cost, adds lifetime constraint |

```rust
// Move into spawned task — cleanest ownership
let config = load_config();
tokio::spawn(async move {
    use_config(config).await; // config moved, no sharing
});

// Arc for shared immutable state across tasks
let shared_config = Arc::new(load_config());
for _ in 0..num_workers {
    let cfg = Arc::clone(&shared_config);
    tokio::spawn(async move {
        use_config(&cfg).await; // shared read, no lock
    });
}

// Channel-based transfer instead of Arc<Mutex>
let (tx, mut rx) = tokio::sync::mpsc::channel(32);
tokio::spawn(async move {
    while let Some(item) = rx.recv().await {
        process(item).await; // exclusive ownership per item
    }
});
```

## Lifetime Annotations — When Required

Only add lifetime annotations when the compiler cannot infer them. Common cases:

```rust
// Struct holding a reference — lifetime required
struct Parser<'input> {
    source: &'input str,
    position: usize,
}

impl<'input> Parser<'input> {
    fn next_token(&mut self) -> &'input str {
        // Returns slice of the original input — same lifetime
        let start = self.position;
        // ... parsing logic
        &self.source[start..self.position]
    }
}

// Function returning a reference to one of its inputs
fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

// AVOID: lifetimes in public API when owned return is cleaner
// BAD — forces caller to manage lifetimes
fn get_name<'a>(user: &'a User) -> &'a str { &user.name }

// GOOD — return owned String if the caller needs independent ownership
fn get_name(user: &User) -> String { user.name.clone() }
```

## Interior Mutability Hierarchy

Choose the lightest tool that satisfies the requirement:

1. **`Cell<T>`** — Single-threaded, `Copy` types. Zero overhead.
2. **`RefCell<T>`** — Single-threaded, runtime borrow checking. Panics on double mutable borrow.
3. **`Mutex<T>`** — Multi-threaded, blocking. Use for rare writes.
4. **`RwLock<T>`** — Multi-threaded, concurrent reads. Use when reads dominate.
5. **`Atomic*`** — Lock-free counters and flags. Use for simple integer/bool state.

```rust
use std::cell::RefCell;
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicU64, Ordering};

// RefCell for single-threaded caches
thread_local! {
    static CACHE: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
}

// RwLock for read-heavy shared config
struct AppState {
    config: RwLock<Config>,         // many readers, rare writes
    request_count: AtomicU64,       // simple counter, lock-free
    sessions: Mutex<HashMap<String, Session>>, // mutation on every request
}
```

## Common Ownership Pitfalls

- **Borrowing across `.await`**: Borrows held across `.await` points make futures `!Send`. Extract owned data before awaiting.
- **Self-referential structs**: Rust doesn't support structs that borrow from themselves. Use indices, `Pin`, or arena allocators instead.
- **Over-cloning**: Cloning to satisfy the borrow checker is a code smell. Restructure ownership or use references.
- **Lifetime variance confusion**: `&'a mut T` is invariant in `'a`. Storing mutable references in containers requires exact lifetime matching.
