# Go Testing

## Table-Driven Tests

The standard Go testing pattern:

```go
func TestParseSize(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int64
        wantErr bool
    }{
        {name: "bytes", input: "100B", want: 100},
        {name: "kilobytes", input: "10KB", want: 10240},
        {name: "megabytes", input: "5MB", want: 5242880},
        {name: "empty string", input: "", wantErr: true},
        {name: "invalid unit", input: "10XB", wantErr: true},
        {name: "negative", input: "-5KB", wantErr: true},
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            got, err := ParseSize(tc.input)

            if tc.wantErr {
                if err == nil {
                    t.Fatalf("ParseSize(%q) expected error, got %d", tc.input, got)
                }
                return
            }

            if err != nil {
                t.Fatalf("ParseSize(%q) unexpected error: %v", tc.input, err)
            }

            if got != tc.want {
                t.Errorf("ParseSize(%q) = %d, want %d", tc.input, got, tc.want)
            }
        })
    }
}
```

### Table Test Conventions

- Use `tc.name` as the subtest name for clear failure output.
- Test both success and error cases in the same table.
- Use `t.Fatalf` for setup failures, `t.Errorf` for assertion failures.
- Include edge cases: empty input, zero values, boundary values, unicode.

## Parallel Tests

```go
func TestUserService(t *testing.T) {
    t.Parallel() // Mark parent as parallel

    tests := []struct {
        name string
        // ...
    }{
        // ...
    }

    for _, tc := range tests {
        tc := tc // capture for parallel
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel() // Each subtest runs in parallel
            // ... test logic ...
        })
    }
}
```

### When NOT to Parallelize

- Tests that use shared state (database, file system).
- Tests that depend on environment variables.
- Tests with external service dependencies (unless isolated).

## HTTP Handler Tests

```go
func TestGetUserHandler(t *testing.T) {
    // Setup
    repo := &MockUserRepo{
        users: map[string]*User{
            "usr_1": {ID: "usr_1", Name: "Alice"},
        },
    }
    handler := NewUserHandler(repo)

    tests := []struct {
        name       string
        method     string
        path       string
        wantStatus int
        wantBody   string
    }{
        {
            name:       "found",
            method:     http.MethodGet,
            path:       "/users/usr_1",
            wantStatus: http.StatusOK,
            wantBody:   `"name":"Alice"`,
        },
        {
            name:       "not found",
            method:     http.MethodGet,
            path:       "/users/usr_999",
            wantStatus: http.StatusNotFound,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            req := httptest.NewRequest(tc.method, tc.path, nil)
            rec := httptest.NewRecorder()

            handler.ServeHTTP(rec, req)

            if rec.Code != tc.wantStatus {
                t.Errorf("status = %d, want %d", rec.Code, tc.wantStatus)
            }

            if tc.wantBody != "" && !strings.Contains(rec.Body.String(), tc.wantBody) {
                t.Errorf("body = %q, want substring %q", rec.Body.String(), tc.wantBody)
            }
        })
    }
}
```

## Test Fixtures and Helpers

### t.Cleanup

```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()

    db, err := sql.Open("postgres", testDSN)
    if err != nil {
        t.Fatalf("open db: %v", err)
    }

    // Runs after the test completes
    t.Cleanup(func() {
        db.Close()
    })

    return db
}
```

### t.Helper

```go
func assertEqual[T comparable](t *testing.T, got, want T) {
    t.Helper() // Marks this as a helper — errors report caller's line number
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}
```

### TestMain for Suite Setup

```go
func TestMain(m *testing.M) {
    // Setup
    pool, err := dockertest.NewPool("")
    if err != nil {
        log.Fatalf("could not connect to docker: %v", err)
    }

    // Start postgres container
    resource, err := pool.Run("postgres", "16", nil)
    if err != nil {
        log.Fatalf("could not start postgres: %v", err)
    }

    // Run tests
    code := m.Run()

    // Teardown
    pool.Purge(resource)

    os.Exit(code)
}
```

## Race Detection

Always run with race detection in CI:

```bash
go test -race -count=1 ./...
```

### Writing Race-Detectable Tests

```go
func TestConcurrentMap(t *testing.T) {
    m := NewSafeMap[string, int]()

    // Spawn multiple goroutines that read and write
    var wg sync.WaitGroup
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            key := fmt.Sprintf("key_%d", n%10)
            m.Set(key, n)
            _, _ = m.Get(key)
        }(i)
    }

    wg.Wait()
}
```

## Benchmarks

```go
func BenchmarkParseJSON(b *testing.B) {
    data := []byte(`{"name":"Alice","age":30,"email":"alice@example.com"}`)

    b.ReportAllocs() // Report memory allocations
    b.ResetTimer()   // Exclude setup time

    for i := 0; i < b.N; i++ {
        var user User
        if err := json.Unmarshal(data, &user); err != nil {
            b.Fatal(err)
        }
    }
}

// Sub-benchmarks for comparing implementations
func BenchmarkParse(b *testing.B) {
    cases := []struct {
        name string
        fn   func([]byte) error
    }{
        {"json.Unmarshal", parseJSON},
        {"easyjson", parseEasyJSON},
        {"sonic", parseSonic},
    }

    data := loadTestData(b)

    for _, bc := range cases {
        b.Run(bc.name, func(b *testing.B) {
            b.ReportAllocs()
            for i := 0; i < b.N; i++ {
                if err := bc.fn(data); err != nil {
                    b.Fatal(err)
                }
            }
        })
    }
}
```

### Running Benchmarks

```bash
# Run benchmarks
go test -bench=. -benchmem ./...

# Compare across commits
go test -bench=. -benchmem -count=10 ./... > old.txt
# (make changes)
go test -bench=. -benchmem -count=10 ./... > new.txt
benchstat old.txt new.txt
```

## Golden File Testing

```go
func TestRender(t *testing.T) {
    got := render(testInput)

    golden := filepath.Join("testdata", t.Name()+".golden")

    if *update {
        os.WriteFile(golden, []byte(got), 0o644)
    }

    want, err := os.ReadFile(golden)
    if err != nil {
        t.Fatalf("read golden file: %v", err)
    }

    if got != string(want) {
        t.Errorf("output mismatch:\n%s", diff(string(want), got))
    }
}

var update = flag.Bool("update", false, "update golden files")
```

## Test Organization

```
mypackage/
  service.go
  service_test.go        # Unit tests (same package)
  testdata/              # Test fixtures (auto-included by go tool)
    input.json
    TestRender.golden
  integration_test.go    # Build-tagged integration tests

// integration_test.go
//go:build integration

package mypackage_test

func TestIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }
    // ...
}
```
