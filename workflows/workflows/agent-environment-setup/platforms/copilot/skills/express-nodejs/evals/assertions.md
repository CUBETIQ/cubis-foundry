# Express Node.js Eval Assertions

## Eval 1: Secure API with Async Error Handling

### typed-handlers-typescript
Verifies the response uses TypeScript generics on Express request handlers to type `params`, `body`, and `query` separately. The app must be split into `app.ts` (which exports the configured Express app) and `server.ts` (which calls `app.listen()`). This separation is critical for testing with supertest without port binding. The assertion catches responses that use `any` types, skip TypeScript, or combine app creation and listening in a single file.

### security-headers-config
Verifies Helmet is configured with explicit CSP directives rather than accepting defaults blindly. CORS must use a specific origin allow-list (not `*`) with `credentials: true`. The rate limiter must use an external store (Redis) for production correctness across multiple server instances. This catches responses that use permissive defaults, wildcard CORS, or in-memory rate limiting that breaks in clustered deployments.

### zod-validation-middleware
Verifies validation is implemented as a reusable middleware function that takes a zod schema and validates the request before it reaches the handler. Validation errors must be transformed into structured field-level error responses (400) derived from ZodError's `issues` array. This catches responses that validate inside handlers, use manual if-checks instead of schema validation, or return unstructured error strings.

### centralized-error-handler
Verifies custom error classes carry `statusCode` and are caught by a centralized four-parameter error middleware registered as the last middleware. The handler must distinguish between known error types (returning appropriate status codes) and unexpected errors (returning 500 without stack traces). This catches responses that format errors per-handler, leak stack traces, or forget the four-parameter signature that Express requires for error middleware.

### supertest-integration-tests
Verifies tests use supertest with the imported app module (not a running server) and cover three distinct scenarios: successful creation (201), validation failure (400 with field errors), and rate limit exhaustion (429). This ensures the test suite validates both happy and error paths and confirms the security middleware actually enforces limits.

---

## Eval 2: Middleware Composition

### async-timing-middleware
Verifies the timing middleware correctly measures handler duration and sets the `X-Response-Time` header. The critical detail is that the header must be set even when the handler throws an error, which requires try/finally around the `await next()` call or listening to the response `finish` event. This catches implementations where errors cause the timing header to be lost.

### jwt-auth-declaration-merging
Verifies the auth middleware validates JWTs and attaches the decoded payload to `req.user`, with TypeScript declaration merging extending the Express `Request` interface. This is the standard TypeScript pattern for adding custom properties to the request object. The assertion catches responses that use `as any` casts, skip typing entirely, or store the user in a non-standard location.

### role-authorization-factory
Verifies a higher-order function pattern where `authorize('admin', 'editor')` returns a middleware function. The returned middleware checks `req.user.role` against the allowed roles and returns 403 with a structured error for unauthorized access. Tests must verify both allowed and denied scenarios. This catches responses that hardcode roles or skip the factory pattern.

### async-local-storage-logger
Verifies the use of Node.js `AsyncLocalStorage` to propagate a request-scoped logger through the async call stack without explicit parameter threading. A middleware must create the storage context with the request ID, and a `getLogger()` helper must retrieve it anywhere in the async chain. This is a modern Node.js pattern that replaces `cls-hooked`. The test must verify the request ID survives across async boundaries (e.g., after an `await`).

### composed-stack-tests
Verifies the middleware pieces are composed into a reusable stack (array of middleware or a composed function) applied to admin routes, and that end-to-end tests validate the combined behavior. Tests must check: timing header on error responses, expired token handling, role-based rejection, and logger context across async boundaries. This ensures the middleware works together, not just in isolation.
