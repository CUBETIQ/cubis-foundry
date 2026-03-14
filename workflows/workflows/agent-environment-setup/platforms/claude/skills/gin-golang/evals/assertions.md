# Gin Golang Eval Assertions

## Eval 1: CRUD API with Validation

### gin-new-explicit-middleware
Verifies the engine is created with `gin.New()` rather than `gin.Default()`, giving the developer full control over which middleware runs and in what order. Recovery must be first (to catch panics in all subsequent middleware), logging must come next, and authentication should only apply to the protected route group. This catches responses that use `gin.Default()` without understanding its implicit middleware or that apply auth globally.

### binding-validation-tags
Verifies request structs use Gin's binding tag system with `binding:"required"` and range constraints, plus a custom validator for the slug field registered through the validator engine. The response must use `c.ShouldBindJSON()` instead of `c.BindJSON()` to retain control over error formatting. This assertion catches responses that skip validation, use the wrong bind method, or validate manually in the handler body.

### structured-error-response
Verifies error responses follow a consistent JSON structure across the entire API surface. The central handler must distinguish between validation errors (which produce field-level detail), sentinel business errors (which map to specific status codes), and unexpected errors (which produce 500 without leaking internals). This tests for production-grade error consistency rather than ad-hoc per-handler formatting.

### release-mode-and-proxy
Verifies production hardening is applied: Gin's mode is set to release to suppress debug logging and route dumps, and trusted proxies are explicitly configured to prevent `X-Forwarded-For` spoofing. This catches responses that leave Gin in debug mode or trust all proxies by default, both of which are security concerns in production.

### table-driven-handler-tests
Verifies tests are structured as table-driven subtests covering the three critical paths: valid input producing 201, missing required fields producing 400 with field-level errors, and invalid values producing 400 with validation details. Tests must use `httptest.NewRecorder` with `router.ServeHTTP` for full integration or `gin.CreateTestContext` for isolated unit tests. This catches responses that only test the happy path or lack structured assertions on error shape.

---

## Eval 2: Middleware Integration Testing

### request-id-middleware
Verifies the request ID middleware generates a UUID and propagates it both into the Gin context (for downstream middleware/handlers) and into the response header. The test must check that the `X-Request-Id` header exists and is a valid UUID. This ensures traceability works end-to-end and is verifiable from the client side.

### auth-middleware-test
Verifies the auth middleware correctly extracts and validates tokens, stores the user in context for downstream handlers, and returns a structured 401 error when authentication fails. The test must cover both the success path (request passes through to the handler) and the failure path (request is aborted with proper JSON). This catches middleware that forgets to call `c.Abort()` or returns plain text errors.

### middleware-order-test
Verifies the test suite explicitly validates that middleware runs in the intended order. Request ID must be set before logging runs (so the logger includes it), and auth must run after logging (so rejected requests are still logged). This is tested through response inspection or log output verification. This catches architectures where auth silently drops requests before they are logged.

### rate-limiter-test
Verifies the rate limiter works per-client-IP using a token bucket or similar algorithm, and the test demonstrates the threshold by sending sequential requests and observing the transition from 200 to 429. The response should include a `Retry-After` header or equivalent information. This catches rate limiters that are not actually enforced or that use a global counter instead of per-IP tracking.

### logging-captures-status
Verifies the logging middleware captures the actual response status code by recording it after `c.Next()` returns, not before. The test must demonstrate that when a downstream handler returns 404 or 500, the log entry reflects that status code accurately. This catches a common bug where logging middleware logs the status before the handler has set it, always showing 200.
