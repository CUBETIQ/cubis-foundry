---
name: express-nodejs
description: "Use when building Express.js services on modern Node.js, including Express 5 routing, async middleware, TypeScript integration, security headers, error handling, and production hardening."
---
# Express.js with Modern Node.js

## Purpose

Production-grade guidance for building secure, maintainable HTTP APIs and web applications using Express 5.x on modern Node.js (v20+). Covers async middleware patterns, TypeScript-first development, security hardening, structured error handling, and testing strategies that scale from prototypes to high-traffic services.

## When to Use

- Building REST APIs, BFF layers, or server-rendered applications with Express.
- Composing middleware stacks for authentication, validation, logging, and security headers.
- Integrating Express with TypeScript for type-safe request/response handling.
- Implementing async error handling that does not leak stack traces or swallow failures.
- Hardening Express services with helmet, CORS, rate limiting, and input sanitization.
- Writing integration tests for Express routes and middleware.

## Instructions

1. **Use Express 5.x with native async/await support** -- Express 5 automatically catches rejected promises in route handlers and passes them to the error handler. This eliminates the need for `express-async-errors` or manual try/catch wrappers in every handler. Verify your version with `express --version` and upgrade if still on Express 4.

2. **Write the application in TypeScript with strict mode** -- enable `strict: true` in `tsconfig.json` and type request handlers as `RequestHandler` from `express`. Define typed interfaces for `req.body`, `req.params`, and `req.query` using generics. This catches shape mismatches at compile time instead of runtime.

3. **Separate app creation from server listening** -- export the Express app from `app.ts` and call `app.listen()` only in `server.ts`. This lets tests import the app without binding a port and avoids `EADDRINUSE` errors during parallel test execution.

4. **Structure middleware in explicit order: security, parsing, logging, auth, routes, errors** -- register `helmet()` first for security headers, then `express.json()` for body parsing, then request logging, then authentication middleware, then route handlers, and finally the error handler. Middleware order is the execution order, and misplacing error handlers before routes makes them unreachable.

5. **Validate request bodies with a schema validation library** -- use `zod`, `joi`, or `ajv` to validate `req.body`, `req.params`, and `req.query` in a reusable validation middleware. Return 400 with structured field-level errors. Do not validate manually inside handlers because it scatters validation logic and produces inconsistent error formats.

6. **Implement a centralized error-handling middleware with four parameters** -- define `(err, req, res, next)` as the last middleware. Map known error classes (validation errors, auth errors, not-found errors) to appropriate HTTP status codes and a consistent JSON envelope. Log unexpected errors with stack traces but never send stack traces to the client. Always call `next(err)` in route handlers instead of sending error responses directly.

7. **Create custom error classes that carry HTTP status codes** -- define `AppError`, `NotFoundError`, `ValidationError`, and `UnauthorizedError` extending `Error` with a `statusCode` property. Throw these from service functions and let the centralized handler format the response. This decouples business logic from HTTP response formatting.

8. **Apply Helmet with explicit directives** -- call `app.use(helmet({ contentSecurityPolicy: { directives: { ... } } }))` with directives appropriate for your content model. The defaults are good but may block inline scripts or CDN resources your frontend needs. Review each directive rather than disabling CSP entirely.

9. **Configure CORS with an allow-list, not a wildcard** -- use the `cors` package with `origin` set to an array of allowed origins or a function that checks against a dynamic list. Set `credentials: true` only if you use cookies. A wildcard origin (`*`) disables credential passing and gives every site access to your API responses.

10. **Rate-limit endpoints with `express-rate-limit`** -- apply a global limiter for general protection and stricter per-route limiters for authentication and password-reset endpoints. Use a Redis or Memcached store in production for distributed rate limiting across instances. The default in-memory store does not share state across processes.

11. **Handle async errors by throwing or passing to `next()`** -- in Express 5, async handlers that throw or return rejected promises automatically trigger the error handler. For Express 4 compatibility or explicit control, call `next(err)`. Never swallow errors with empty catch blocks because it produces silent failures that are impossible to debug in production.

12. **Write integration tests with `supertest` and the separated app** -- import the app module, use `supertest(app)` to make requests without starting a server. Assert on status codes, response headers, JSON body shape, and error envelopes. Test both success and error paths for every endpoint. Use `beforeEach` to reset database state or mocks.

13. **Use `express.Router()` to modularize route registration** -- create one router per resource or domain area, register middleware at the router level, and mount routers on the app with `app.use('/api/v1/users', usersRouter)`. This keeps route files focused and lets each module declare its own middleware requirements.

14. **Set security headers beyond Helmet when needed** -- add `Strict-Transport-Security` with `max-age` and `includeSubDomains` for HSTS, `X-Request-Id` for traceability, and `Cache-Control: no-store` on sensitive endpoints. Remove the `X-Powered-By` header with `app.disable('x-powered-by')` or let Helmet handle it.

15. **Implement graceful shutdown that drains connections** -- listen for `SIGTERM` and `SIGINT`, call `server.close()` to stop accepting new connections, drain in-flight requests with a timeout, close database pools and external connections, then exit. This prevents 502 errors during rolling deploys and keeps load balancer health checks accurate.

16. **Sanitize and limit request input** -- set `express.json({ limit: '100kb' })` to prevent large payload attacks. Use `express-mongo-sanitize` or equivalent if using MongoDB to prevent NoSQL injection. Trim and escape string inputs at the validation layer, not in individual handlers.

17. **Use environment-based configuration with validation** -- load configuration from environment variables using a library like `dotenv` for local development and validate required variables at startup with a schema (zod, joi, or envalid). Fail fast with a clear error message if required config is missing, rather than discovering it at runtime when a request hits the missing value.

18. **Log structured JSON with request context** -- use `pino`, `winston`, or a similar structured logger. Attach request ID, user ID, method, path, and response time to every log line. Use a request-logging middleware that creates a child logger with request context and attaches it to `req.log` for use in handlers and services.

## Output Format

Produces TypeScript source files with Express 5.x handler signatures, typed request/response interfaces, router modules, middleware functions, custom error classes, and supertest-based integration tests. Includes `package.json` dependencies and `tsconfig.json` configuration where applicable.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/middleware.md` | Middleware authoring, ordering, composition patterns, or built-in middleware configuration is in scope. |
| `references/error-handling.md` | Centralized error handler, custom error classes, or async error patterns are needed. |
| `references/typescript-integration.md` | TypeScript setup, typed handlers, declaration merging, or strict mode config is needed. |
| `references/security.md` | Helmet, CORS, rate limiting, input sanitization, or HSTS configuration is in scope. |
| `references/testing.md` | Supertest setup, integration tests, mock strategies, or test organization is needed. |

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file: `.gemini/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
