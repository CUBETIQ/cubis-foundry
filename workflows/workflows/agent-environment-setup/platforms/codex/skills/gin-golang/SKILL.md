---
name: gin-golang
description: "Use when building Gin-based Go services, including routing, middleware chains, request validation, structured errors, context propagation, and deployment hardening."
---
# Gin Web Framework

## Purpose

Production-grade guidance for building robust HTTP APIs using the Gin web framework for Go. Gin provides a martini-like API with radix-tree routing, middleware composition, and built-in request binding and validation, all with performance close to net/http.

## When to Use

- Building REST APIs, CRUD services, or BFF layers with Gin.
- Designing middleware chains for authentication, logging, rate limiting, and recovery.
- Validating request payloads using Gin's binding and `validator/v10` tags.
- Structuring large Gin applications with router groups and modular handler packages.
- Writing integration tests for Gin handlers and middleware.
- Deploying Gin services behind reverse proxies with health checks and graceful shutdown.

## Instructions

1. **Set Gin mode based on environment** -- call `gin.SetMode(gin.ReleaseMode)` in production and `gin.SetMode(gin.DebugMode)` during development. Debug mode logs every request to stdout and enables route debugging, which leaks internal structure and adds overhead in production.

2. **Create the engine with `gin.New()` and add middleware explicitly** -- prefer `gin.New()` over `gin.Default()` so you control exactly which middleware runs. Add `gin.Recovery()` first, then structured logging, then auth. `gin.Default()` silently adds Logger and Recovery, which may not match your production logging format.

3. **Organize routes with `router.Group()` and apply group-level middleware** -- group related endpoints under versioned prefixes (e.g., `/api/v1`) and attach authentication or rate-limiting middleware at the group level. This avoids repeating middleware declarations per route and makes authorization boundaries explicit.

4. **Validate requests with struct binding tags** -- define request structs with `binding:"required"`, `binding:"min=1,max=100"`, and custom validators. Use `c.ShouldBindJSON()` (not `c.BindJSON()`) to avoid automatic 400 responses that bypass your error format. Handle the returned error to produce consistent structured error responses.

5. **Use `c.ShouldBind*` methods consistently, never mix `Bind` and `ShouldBind`** -- `Bind*` methods write a 400 response and abort on failure, removing your control over error formatting. `ShouldBind*` returns the error for you to handle. Pick one convention project-wide to prevent inconsistent error surfaces.

6. **Return structured JSON error responses from a central error handler** -- write a `handleError(c *gin.Context, err error)` helper or use `gin.CustomRecoveryWithWriter` to map errors to a consistent `{"code": ..., "message": ..., "details": ...}` envelope. Register sentinel errors and typed errors for known failure conditions so the handler can assign the right HTTP status.

7. **Pass request-scoped values through `c.Set()` and `c.Get()` or `c.MustGet()`** -- store the authenticated user, request ID, or trace span in the Gin context within middleware. Retrieve with type-safe wrapper functions. Do not use global variables because Gin recycles context objects in its pool.

8. **Write middleware as `gin.HandlerFunc` with explicit `c.Next()` and `c.Abort()`** -- call `c.Next()` to continue the chain and `c.Abort()` to stop it. For timing middleware, record the start time before `c.Next()` and compute duration after. For auth middleware, abort with a 401 JSON response before `c.Next()` if the token is invalid.

9. **Handle panics with `gin.Recovery()` or a custom recovery middleware** -- recovery middleware catches panics and converts them to 500 responses. Place it as the outermost middleware. For custom recovery, use `gin.CustomRecoveryWithWriter(writer, recoveryFunc)` to log stack traces to your structured logger instead of stderr.

10. **Implement graceful shutdown with `http.Server` wrapping the Gin engine** -- create an `http.Server{Handler: router}`, start it in a goroutine, listen for OS signals, then call `server.Shutdown(ctx)` with a deadline context. Do not call `router.Run()` directly in production because it provides no shutdown hook.

11. **Test handlers with `httptest.NewRecorder` and `gin.CreateTestContext`** -- for unit tests, use `gin.CreateTestContext(recorder)` to get an isolated context with full middleware control. For integration tests, register routes on a test engine and use `httptest.NewRequest` with `router.ServeHTTP`. Assert on response status, headers, and decoded JSON body.

12. **Trust proxy headers only from known sources** -- call `router.SetTrustedProxies([]string{"10.0.0.0/8"})` or `router.SetTrustedProxies(nil)` to disable. The default trusts all proxies, which lets attackers spoof `X-Forwarded-For` and bypass IP-based rate limiting or geo-restrictions.

13. **Register custom validators for domain-specific rules** -- get the validator engine with `binding.Validator.Engine().(*validator.Validate)` and call `RegisterValidation("slug", slugValidator)`. Use custom validators for business rules like UUID format, currency codes, or enum membership instead of validating in handler logic.

14. **Configure timeouts and limits on the underlying `http.Server`** -- set `ReadTimeout`, `WriteTimeout`, `IdleTimeout`, and `MaxHeaderBytes`. Gin does not set these by default, and missing timeouts allow slowloris attacks and resource exhaustion under sustained load.

15. **Use `c.Stream()` for server-sent events and large responses** -- for SSE or chunked responses, use `c.Stream(func(w io.Writer) bool { ... })` to write data incrementally. This avoids buffering the entire response in memory and supports real-time data push patterns.

16. **Keep Gin at the boundary -- handlers parse, delegate, format** -- handler functions should call `ShouldBind`, invoke a service-layer function, and call `c.JSON()`. Business logic must not import `gin`. This separation enables unit testing without HTTP context and makes the service layer reusable across transport mechanisms.

## Output Format

Produces Go source files with Gin handler signatures, grouped route registration, binding structs with validation tags, middleware functions, and table-driven handler tests. Includes `go.mod` dependencies and deployment configuration where applicable.

## References

Load only what the current step needs.

| File | Load when |
| --- | --- |
| `references/routing.md` | Route registration, groups, parameter binding, or path patterns need detail. |
| `references/middleware.md` | Middleware authoring, ordering, built-in middleware, or custom recovery is in scope. |
| `references/validation.md` | Request binding, validation tags, custom validators, or error formatting is needed. |
| `references/testing.md` | Handler testing, integration tests, or test context setup is needed. |
| `references/deployment.md` | Graceful shutdown, reverse proxy config, Docker builds, or health checks are in scope. |

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
