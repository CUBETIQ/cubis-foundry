# Trait Design Patterns

## Enum vs Trait Object Dispatch

Choose based on whether the type set is closed or open:

| Design          | When to use                                              | Tradeoffs                                          |
| --------------- | -------------------------------------------------------- | -------------------------------------------------- |
| **Enum**        | Known, fixed set of variants                             | Zero-cost dispatch, exhaustive matching, inlinable |
| **`dyn Trait`** | Plugin boundaries, user-extensible types                 | Heap allocation, vtable indirection, no inlining   |
| **Generics**    | Performance-critical, single concrete type per call site | Monomorphized — fast but increases binary size     |

```rust
// ENUM — known set of message types
enum Command {
    Start { task_id: u64 },
    Stop { task_id: u64 },
    Status,
}

fn execute(cmd: Command) {
    match cmd {
        Command::Start { task_id } => start_task(task_id),
        Command::Stop { task_id } => stop_task(task_id),
        Command::Status => print_status(),
    }
}

// TRAIT OBJECT — plugin-style extensibility
trait Processor: Send + Sync {
    fn process(&self, input: &[u8]) -> Vec<u8>;
    fn name(&self) -> &str;
}

struct Pipeline {
    processors: Vec<Box<dyn Processor>>, // open set, unknown at compile time
}
```

## Newtype Pattern

Wrap primitives to prevent type confusion and add domain semantics.

```rust
// Without newtypes — easy to swap arguments
fn transfer(from: u64, to: u64, amount: u64) { ... }
transfer(amount, from_id, to_id); // compiles, but wrong!

// With newtypes — compiler catches mistakes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct AccountId(u64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
struct Money(u64);

fn transfer(from: AccountId, to: AccountId, amount: Money) { ... }
// transfer(amount, from_id, to_id); // won't compile

// Add Display and FromStr for convenience
impl std::fmt::Display for AccountId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "acct-{}", self.0)
    }
}
```

## Trait Design Principles

Keep trait surfaces small. Split large traits into focused capabilities.

```rust
// BAD — monolithic trait forces implementors to provide everything
trait Database {
    fn query(&self, sql: &str) -> Result<Rows>;
    fn execute(&self, sql: &str) -> Result<u64>;
    fn begin_transaction(&self) -> Result<Transaction>;
    fn health_check(&self) -> Result<()>;
    fn migrate(&self) -> Result<()>;
}

// GOOD — focused traits, compose as needed
trait Queryable {
    fn query(&self, sql: &str) -> Result<Rows>;
    fn execute(&self, sql: &str) -> Result<u64>;
}

trait Transactional: Queryable {
    fn begin(&self) -> Result<Transaction>;
}

trait HealthCheckable {
    fn health_check(&self) -> Result<()>;
}

// Implementor only provides what it supports
impl Queryable for ReadReplica { ... }
// ReadReplica doesn't implement Transactional — compile-time safety
```

## `From` / `Into` Conversion Design

```rust
// Implement From for unambiguous, infallible conversions
impl From<CreateUserRequest> for User {
    fn from(req: CreateUserRequest) -> Self {
        User {
            id: Uuid::new_v4(),
            name: req.name,
            email: req.email,
            created_at: Utc::now(),
        }
    }
}

// Use TryFrom for fallible conversions
impl TryFrom<RawConfig> for ValidatedConfig {
    type Error = ConfigError;

    fn try_from(raw: RawConfig) -> Result<Self, Self::Error> {
        if raw.port == 0 {
            return Err(ConfigError::InvalidPort);
        }
        Ok(ValidatedConfig {
            host: raw.host,
            port: raw.port,
        })
    }
}

// Usage
let user: User = request.into();
let config = ValidatedConfig::try_from(raw_config)?;
```

## Extension Traits

Add methods to foreign types without modifying them.

```rust
// Extend Result with domain-specific helpers
trait ResultExt<T> {
    fn or_not_found(self, resource: &str) -> Result<T, ApiError>;
}

impl<T, E: std::fmt::Display> ResultExt<T> for Result<T, E> {
    fn or_not_found(self, resource: &str) -> Result<T, ApiError> {
        self.map_err(|e| ApiError::NotFound(format!("{resource}: {e}")))
    }
}

// Usage
let user = db.find_user(id).or_not_found("user")?;
```

## Builder Pattern with Type State

Use the type system to enforce build step ordering at compile time.

```rust
// Type-state markers
struct NoHost;
struct HasHost(String);
struct NoPort;
struct HasPort(u16);

struct ServerBuilder<H, P> {
    host: H,
    port: P,
}

impl ServerBuilder<NoHost, NoPort> {
    fn new() -> Self {
        ServerBuilder { host: NoHost, port: NoPort }
    }
}

impl<P> ServerBuilder<NoHost, P> {
    fn host(self, host: impl Into<String>) -> ServerBuilder<HasHost, P> {
        ServerBuilder { host: HasHost(host.into()), port: self.port }
    }
}

impl<H> ServerBuilder<H, NoPort> {
    fn port(self, port: u16) -> ServerBuilder<H, HasPort> {
        ServerBuilder { host: self.host, port: HasPort(port) }
    }
}

// build() only available when both host AND port are set
impl ServerBuilder<HasHost, HasPort> {
    fn build(self) -> Server {
        Server {
            host: self.host.0,
            port: self.port.0,
        }
    }
}

// Usage — compile error if host or port is missing
let server = ServerBuilder::new()
    .host("0.0.0.0")
    .port(8080)
    .build();
```

## Async Traits

```rust
// Use async-trait crate or native async fn in traits (Rust 1.75+)
trait Repository: Send + Sync {
    async fn find(&self, id: u64) -> Result<Option<Entity>>;
    async fn save(&self, entity: &Entity) -> Result<()>;
}

// For trait objects, you still need Send bounds on the future:
#[async_trait::async_trait]
trait DynRepository: Send + Sync {
    async fn find(&self, id: u64) -> Result<Option<Entity>>;
}
```

## Derive Macro Hygiene

```rust
// Derive the minimum set of traits needed
#[derive(Debug)]              // Always: needed for error messages and logging
#[derive(Clone)]              // When values are shared or cached
#[derive(PartialEq, Eq)]     // When used as hash map keys or compared
#[derive(Hash)]               // When used in HashSet or HashMap keys
#[derive(serde::Serialize, serde::Deserialize)] // When crossing serialization boundaries

// DON'T derive Serialize/Deserialize on domain types — use separate DTOs
// DON'T derive Clone on types that hold exclusive resources (connections, file handles)
```
