# Rust Testing

## Test Organization

```
src/
  lib.rs            # Unit tests in #[cfg(test)] mod tests
  parser.rs         # Unit tests at bottom of each module
tests/
  integration.rs    # Integration tests (separate compilation)
  api_tests.rs      # Each file is a separate test crate
examples/
  basic_usage.rs    # Compiled and run with `cargo test --examples`
benches/
  benchmarks.rs     # Criterion benchmarks
```

### Unit Tests (Same Module)

```rust
// src/parser.rs
pub fn parse_number(input: &str) -> Result<i64, ParseError> {
    input.trim().parse::<i64>().map_err(|e| ParseError::InvalidNumber {
        input: input.to_string(),
        source: e,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_number() {
        assert_eq!(parse_number("42").unwrap(), 42);
    }

    #[test]
    fn parses_negative() {
        assert_eq!(parse_number("-7").unwrap(), -7);
    }

    #[test]
    fn trims_whitespace() {
        assert_eq!(parse_number("  100  ").unwrap(), 100);
    }

    #[test]
    fn rejects_non_numeric() {
        let err = parse_number("abc").unwrap_err();
        assert!(matches!(err, ParseError::InvalidNumber { .. }));
    }

    #[test]
    #[should_panic(expected = "out of range")]
    fn panics_on_overflow() {
        parse_number_or_panic("99999999999999999999999");
    }
}
```

### Integration Tests

```rust
// tests/api_tests.rs
// Integration tests can only access the public API

use mylib::{Config, App};

#[tokio::test]
async fn full_request_lifecycle() {
    let app = App::new(Config::test_default()).await;

    let response = app.handle_request(test_request()).await.unwrap();
    assert_eq!(response.status, 200);
    assert!(response.body.contains("success"));
}
```

## Async Testing

```rust
#[tokio::test]
async fn test_fetch_user() {
    let pool = setup_test_db().await;
    let service = UserService::new(pool.clone());

    // Insert test data
    sqlx::query!("INSERT INTO users (name) VALUES ($1)", "Alice")
        .execute(&pool)
        .await
        .unwrap();

    let user = service.get_by_name("Alice").await.unwrap();
    assert_eq!(user.name, "Alice");
}

// With custom runtime configuration
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn test_concurrent_access() {
    // Test with multi-threaded runtime
}
```

## Property-Based Testing with proptest

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn parse_roundtrip(n in any::<i64>()) {
        let s = n.to_string();
        let parsed = parse_number(&s).unwrap();
        prop_assert_eq!(parsed, n);
    }

    #[test]
    fn non_empty_string_has_positive_length(s in "[a-zA-Z]+") {
        prop_assert!(s.len() > 0);
    }

    #[test]
    fn sort_preserves_length(mut v in prop::collection::vec(any::<i32>(), 0..100)) {
        let original_len = v.len();
        v.sort();
        prop_assert_eq!(v.len(), original_len);
    }
}
```

### Custom Strategies

```rust
fn valid_email() -> impl Strategy<Value = String> {
    ("[a-z]{3,10}", "[a-z]{2,5}", "[a-z]{2,3}")
        .prop_map(|(user, domain, tld)| format!("{user}@{domain}.{tld}"))
}

proptest! {
    #[test]
    fn validates_email_format(email in valid_email()) {
        assert!(is_valid_email(&email));
    }
}
```

## Snapshot Testing with insta

```rust
use insta::assert_snapshot;
use insta::assert_json_snapshot;

#[test]
fn test_error_display() {
    let err = AppError::NotFound("user 42".to_string());
    assert_snapshot!(err.to_string());
    // Snapshot stored in tests/snapshots/test_error_display.snap
}

#[test]
fn test_api_response() {
    let response = create_response(test_user());
    assert_json_snapshot!(response);
    // Snapshot stored as JSON for readability
}
```

### Updating Snapshots

```bash
# Review and accept new snapshots
cargo insta review

# Accept all new snapshots
cargo insta accept
```

## Criterion Benchmarks

```rust
// benches/benchmarks.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};

fn bench_parse(c: &mut Criterion) {
    let inputs = vec![
        ("small", "42"),
        ("medium", "1234567890"),
        ("large", "999999999999999"),
    ];

    let mut group = c.benchmark_group("parse_number");

    for (name, input) in inputs {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &input,
            |b, &input| {
                b.iter(|| parse_number(black_box(input)));
            },
        );
    }

    group.finish();
}

fn bench_serialize(c: &mut Criterion) {
    let data = generate_test_data(1000);

    c.bench_function("serialize_1000", |b| {
        b.iter(|| serde_json::to_vec(black_box(&data)));
    });
}

criterion_group!(benches, bench_parse, bench_serialize);
criterion_main!(benches);
```

### Running Benchmarks

```bash
# Run all benchmarks
cargo bench

# Run specific benchmark
cargo bench -- parse_number

# Compare with baseline
cargo bench -- --save-baseline before
# ... make changes ...
cargo bench -- --baseline before

# Generate HTML report
# Open target/criterion/report/index.html
```

## Test Utilities

### Test Fixtures

```rust
struct TestFixture {
    db: PgPool,
    app: App,
}

impl TestFixture {
    async fn new() -> Self {
        let db = PgPool::connect(&test_database_url()).await.unwrap();
        sqlx::migrate!().run(&db).await.unwrap();
        let app = App::new(db.clone());
        Self { db, app }
    }

    async fn seed_user(&self, name: &str) -> User {
        sqlx::query_as!(User, "INSERT INTO users (name) VALUES ($1) RETURNING *", name)
            .fetch_one(&self.db)
            .await
            .unwrap()
    }
}

impl Drop for TestFixture {
    fn drop(&mut self) {
        // Cleanup runs on test completion
    }
}
```

### Test Helpers with Macros

```rust
macro_rules! assert_err {
    ($expr:expr, $pattern:pat) => {
        match $expr {
            Err($pattern) => {}
            Err(other) => panic!("Expected {}, got {:?}", stringify!($pattern), other),
            Ok(val) => panic!("Expected error, got Ok({:?})", val),
        }
    };
}

#[test]
fn test_validation() {
    assert_err!(validate(""), AppError::Validation { .. });
}
```

## Miri for Unsafe Verification

```bash
# Install miri
rustup +nightly component add miri

# Run tests under miri (detects undefined behavior)
cargo +nightly miri test

# With specific flags
MIRIFLAGS="-Zmiri-disable-isolation" cargo +nightly miri test
```

### What Miri Catches

- Use-after-free
- Double-free
- Out-of-bounds memory access
- Uninitialized memory reads
- Data races (with `-Zmiri-disable-isolation`)
- Invalid pointer alignment
- Violations of Stacked Borrows rules

### Miri Limitations

- Cannot test I/O, networking, or FFI
- Slow (10-100x slower than normal tests)
- Only runs on nightly
- Run a subset of tests under miri in CI, not the full suite

## CI Configuration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2

      - name: Run tests
        run: cargo test --all-features

      - name: Run clippy
        run: cargo clippy -- -W clippy::pedantic

      - name: Check formatting
        run: cargo fmt -- --check

  miri:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
        with:
          components: miri

      - name: Run miri
        run: cargo +nightly miri test -- --test-threads=1
```
