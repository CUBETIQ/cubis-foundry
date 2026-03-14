# Rust Ownership and Borrowing

## Ownership Model

Every value in Rust has exactly one owner. When the owner goes out of scope, the value is dropped. Ownership transfers via moves; data is never implicitly copied (unless the type implements `Copy`).

## Move Semantics

```rust
let s1 = String::from("hello");
let s2 = s1;  // s1 is MOVED into s2 — s1 is no longer valid
// println!("{s1}"); // COMPILE ERROR: value used after move

// Functions take ownership of their arguments
fn consume(s: String) {
    println!("{s}");
} // s is dropped here

let s3 = String::from("world");
consume(s3);
// s3 is no longer valid — it was moved into consume()
```

### When Values Move

- Assignment: `let b = a;`
- Function arguments: `fn foo(x: String)`
- Return values: `fn bar() -> String`
- Struct construction: `MyStruct { field: value }`
- `match` arms that bind by value

## Borrowing Rules

1. You can have **either** one mutable reference `&mut T` **or** any number of immutable references `&T` — never both simultaneously.
2. References must always be valid (no dangling pointers).

```rust
// Immutable borrowing — multiple readers OK
fn length(s: &str) -> usize {
    s.len()
}

let name = String::from("Alice");
let len1 = length(&name); // borrow
let len2 = length(&name); // borrow again — OK
println!("{name} has length {len1}"); // name is still valid

// Mutable borrowing — exclusive access
fn push_exclamation(s: &mut String) {
    s.push('!');
}

let mut greeting = String::from("hello");
push_exclamation(&mut greeting); // exclusive mutable borrow
println!("{greeting}"); // "hello!"
```

### Borrow Checker Patterns

```rust
// PROBLEM: cannot borrow as mutable while immutable borrow exists
let mut v = vec![1, 2, 3];
let first = &v[0];     // immutable borrow
v.push(4);             // ERROR: mutable borrow while `first` is alive
println!("{first}");

// FIX: limit the immutable borrow's scope
let mut v = vec![1, 2, 3];
let first = v[0];      // Copy the value (i32 implements Copy)
v.push(4);             // OK — no outstanding borrows
println!("{first}");
```

## Lifetime Annotations

Lifetimes tell the compiler how long references must remain valid.

```rust
// Explicit lifetime: the return reference lives as long as BOTH inputs
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// Struct with a reference field — must have a lifetime parameter
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn new(text: &'a str) -> Self {
        Self { text }
    }
}
```

### Lifetime Elision Rules

The compiler infers lifetimes when:
1. Each input reference gets its own lifetime parameter.
2. If there is exactly one input lifetime, it is assigned to all output lifetimes.
3. If one of the inputs is `&self` or `&mut self`, the `self` lifetime is assigned to outputs.

```rust
// All of these are equivalent:
fn first_word(s: &str) -> &str { ... }
fn first_word<'a>(s: &'a str) -> &'a str { ... }

// Elision applies here (rule 3):
impl MyStruct {
    fn name(&self) -> &str { &self.name }
    // Equivalent to: fn name<'a>(&'a self) -> &'a str
}
```

## Cow (Clone on Write)

`Cow<'_, T>` defers the cloning decision to runtime:

```rust
use std::borrow::Cow;

fn normalize_path(path: &str) -> Cow<'_, str> {
    if path.contains("//") {
        // Only allocate when modification is needed
        Cow::Owned(path.replace("//", "/"))
    } else {
        // Zero-cost borrow when no modification needed
        Cow::Borrowed(path)
    }
}

// Usage
let clean = normalize_path("/home/user/docs");   // Borrowed — no allocation
let fixed = normalize_path("/home//user//docs");  // Owned — allocated
```

### When to Use Cow

- Functions that sometimes transform a string and sometimes return it unchanged.
- Parsing functions that might need to unescape or decode.
- APIs that accept both `&str` and `String` without unnecessary cloning.

## Ownership Design Patterns

### Newtype for Domain Safety

```rust
// Prevents mixing user IDs with post IDs at the type level
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UserId(pub u64);

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct PostId(pub u64);

// Cannot accidentally pass PostId where UserId is expected
fn get_user(id: UserId) -> User { ... }
```

### Builder Pattern

```rust
pub struct ServerConfig {
    port: u16,
    host: String,
    max_connections: usize,
}

pub struct ServerConfigBuilder {
    port: u16,
    host: String,
    max_connections: usize,
}

impl ServerConfigBuilder {
    pub fn new() -> Self {
        Self {
            port: 8080,
            host: "0.0.0.0".to_string(),
            max_connections: 100,
        }
    }

    pub fn port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    pub fn host(mut self, host: impl Into<String>) -> Self {
        self.host = host.into();
        self
    }

    pub fn build(self) -> ServerConfig {
        ServerConfig {
            port: self.port,
            host: self.host,
            max_connections: self.max_connections,
        }
    }
}
```

### Interior Mutability

When you need mutation through an immutable reference:

```rust
use std::cell::RefCell;
use std::sync::{Arc, Mutex, RwLock};

// Single-threaded: RefCell (runtime borrow checking)
struct Cache {
    data: RefCell<HashMap<String, String>>,
}

impl Cache {
    fn get_or_insert(&self, key: &str, compute: impl FnOnce() -> String) -> String {
        if let Some(val) = self.data.borrow().get(key) {
            return val.clone();
        }
        let val = compute();
        self.data.borrow_mut().insert(key.to_string(), val.clone());
        val
    }
}

// Multi-threaded: Arc<RwLock<T>> for read-heavy, Arc<Mutex<T>> for write-heavy
struct SharedCache {
    data: Arc<RwLock<HashMap<String, String>>>,
}
```

## Smart Pointer Decision Tree

```
Do you need shared ownership?
├── No → Use owned value or reference
└── Yes
    ├── Single thread? → Rc<T>
    │   └── Need mutation? → Rc<RefCell<T>>
    └── Multi-threaded? → Arc<T>
        └── Need mutation?
            ├── Read-heavy? → Arc<RwLock<T>>
            └── Write-heavy? → Arc<Mutex<T>>
```

## From and Into Conversions

```rust
// Implement From for automatic error conversion with ?
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

// Now ? works automatically
async fn get_user(pool: &PgPool, id: i64) -> Result<User, AppError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_one(pool)
        .await?;  // sqlx::Error automatically converted to AppError
    Ok(user)
}

// Use Into for flexible parameter types
fn set_name(&mut self, name: impl Into<String>) {
    self.name = name.into();
}

// Accepts both &str and String without cloning unnecessarily
user.set_name("Alice");           // &str -> String allocation
user.set_name(owned_string);      // String -> String move (no allocation)
```
