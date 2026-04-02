# Golang Best Practices — Eval Assertions

## Eval 1: Concurrent Service Design (golang-concurrent-service)

This eval tests whether the skill produces a correctly structured concurrent service with proper cancellation and error propagation.

### Assertions

1. **errgroup with derived context** — The response must use `errgroup.WithContext(ctx)` to get both a group and a derived context. This is critical because when any goroutine in the group returns an error, the derived context is cancelled, which signals the remaining goroutines to stop.

2. **Per-request and overall timeouts** — The response must demonstrate both a per-API-call timeout (e.g., `context.WithTimeout(ctx, 3*time.Second)`) and an overall deadline on the parent context (10 seconds). Layered timeouts prevent both individual stalls and aggregate slowness.

3. **Error wrapping with %w** — Errors returned from goroutines must be wrapped with `fmt.Errorf("fetch %s: %w", apiName, err)` so the caller can use `errors.Is` and `errors.As` to inspect the chain. Unwrapped errors lose origin context.

4. **Structured logging** — The response must use `slog` or an equivalent structured logger with contextual attributes (API name, duration, request ID). String-formatted log messages are not acceptable because they cannot be parsed by log aggregation systems.

5. **Concurrency safety** — The service must be safe to call from multiple goroutines. This means either the struct has no mutable state, or shared state is protected with sync primitives. The response must not have data races.

## Eval 2: Error Handling Patterns (golang-error-handling)

This eval tests whether the skill produces a comprehensive error handling strategy for a REST API.

### Assertions

1. **Custom error type** — The response must define a struct that implements the `error` interface and carries an HTTP status code, a user-safe message, and an internal error. This enables the middleware to produce appropriate HTTP responses while preserving internal debugging context.

2. **Sentinel errors** — The response must define package-level sentinel errors (e.g., `var ErrNotFound = errors.New("not found")`) for common failure modes. Sentinel errors enable callers to match on specific conditions with `errors.Is` without inspecting error strings.

3. **Error middleware with errors.As** — The response must implement middleware (or a wrapper handler) that uses `errors.As` to extract the custom error type and map it to the correct HTTP status code and JSON response. This centralizes error-to-response mapping.

4. **Error-returning handlers** — Handler functions must return `error` values rather than calling `http.Error()` or `w.Write()` directly. This pattern separates business logic from HTTP response formatting and makes handlers testable.

5. **errors.Is for sentinels and %w for wrapping** — The handler logic must demonstrate using `errors.Is` to match sentinel errors and `fmt.Errorf` with `%w` to add context when propagating errors upward. These are the two fundamental operations in Go's error handling model.
