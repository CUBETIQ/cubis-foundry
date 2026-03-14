# Gin Middleware

## Middleware Fundamentals

Gin middleware is any `gin.HandlerFunc`. Middleware controls the request lifecycle with `c.Next()` (continue chain) and `c.Abort()` (stop chain). Multiple handlers per route are executed in registration order.

```go
// Basic middleware signature
func myMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Pre-processing (before handler)
        start := time.Now()

        // Continue to next handler
        c.Next()

        // Post-processing (after handler)
        latency := time.Since(start)
        status := c.Writer.Status()
        log.Printf("%d %s %v", status, c.Request.URL.Path, latency)
    }
}
```

## Middleware Execution Order

Middleware is called in registration order. `c.Next()` executes the remaining handlers. `c.Abort()` prevents remaining handlers from running.

```go
router := gin.New()

// Global middleware (runs on every request)
router.Use(gin.Recovery())           // 1. Panic recovery
router.Use(requestIDMiddleware())    // 2. Request ID
router.Use(loggingMiddleware())      // 3. Logging

// Group-level middleware
api := router.Group("/api")
api.Use(authMiddleware())            // 4. Auth (API only)

// Route-level middleware
api.POST("/upload", rateLimitMiddleware(), uploadHandler)
//                   ^ 5. Rate limit (this route only)
```

## Built-in Middleware

### Recovery

Catches panics and returns 500.

```go
// Default recovery writes to stderr
router.Use(gin.Recovery())

// Custom recovery with structured logging
router.Use(gin.CustomRecoveryWithWriter(nil, func(c *gin.Context, err interface{}) {
    slog.Error("panic recovered",
        "error", err,
        "path", c.Request.URL.Path,
        "method", c.Request.Method,
    )
    c.JSON(500, gin.H{
        "code":    "INTERNAL_ERROR",
        "message": "An unexpected error occurred",
    })
}))
```

### Logger

```go
// Default logger
router.Use(gin.Logger())

// Custom logger format
router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
    Formatter: func(param gin.LogFormatterParams) string {
        return fmt.Sprintf("%s | %d | %s | %s %s\n",
            param.TimeStamp.Format(time.RFC3339),
            param.StatusCode,
            param.Latency,
            param.Method,
            param.Path,
        )
    },
    Output:    os.Stdout,
    SkipPaths: []string{"/health", "/metrics"},
}))
```

## Custom Middleware Patterns

### Request ID Middleware

```go
func requestIDMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        id := c.GetHeader("X-Request-Id")
        if id == "" {
            id = uuid.New().String()
        }
        c.Set("requestID", id)
        c.Header("X-Request-Id", id)
        c.Next()
    }
}
```

### Authentication Middleware

```go
func authMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        header := c.GetHeader("Authorization")
        if !strings.HasPrefix(header, "Bearer ") {
            c.AbortWithStatusJSON(401, gin.H{
                "code":    "UNAUTHORIZED",
                "message": "Missing or invalid Authorization header",
            })
            return
        }

        token := strings.TrimPrefix(header, "Bearer ")
        claims, err := validateJWT(token)
        if err != nil {
            code := "UNAUTHORIZED"
            if errors.Is(err, jwt.ErrTokenExpired) {
                code = "TOKEN_EXPIRED"
            }
            c.AbortWithStatusJSON(401, gin.H{
                "code":    code,
                "message": "Invalid token",
            })
            return
        }

        c.Set("user", claims)
        c.Next()
    }
}

// Type-safe accessor
func getUser(c *gin.Context) *UserClaims {
    val, exists := c.Get("user")
    if !exists {
        return nil
    }
    return val.(*UserClaims)
}
```

### Rate Limiting Middleware

```go
func rateLimitMiddleware(max int, window time.Duration) gin.HandlerFunc {
    type client struct {
        count    int
        lastSeen time.Time
    }
    var (
        mu      sync.Mutex
        clients = make(map[string]*client)
    )

    // Cleanup goroutine
    go func() {
        for range time.Tick(window) {
            mu.Lock()
            for ip, cl := range clients {
                if time.Since(cl.lastSeen) > window {
                    delete(clients, ip)
                }
            }
            mu.Unlock()
        }
    }()

    return func(c *gin.Context) {
        ip := c.ClientIP()

        mu.Lock()
        cl, exists := clients[ip]
        if !exists || time.Since(cl.lastSeen) > window {
            clients[ip] = &client{count: 1, lastSeen: time.Now()}
            mu.Unlock()
            c.Next()
            return
        }

        cl.count++
        cl.lastSeen = time.Now()
        count := cl.count
        mu.Unlock()

        if count > max {
            c.AbortWithStatusJSON(429, gin.H{
                "code":    "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests",
            })
            return
        }
        c.Next()
    }
}
```

### Structured Logging Middleware with slog

```go
func structuredLoggingMiddleware(logger *slog.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        query := c.Request.URL.RawQuery

        c.Next()

        latency := time.Since(start)
        status := c.Writer.Status()
        reqID, _ := c.Get("requestID")

        attrs := []slog.Attr{
            slog.String("method", c.Request.Method),
            slog.String("path", path),
            slog.String("query", query),
            slog.Int("status", status),
            slog.Duration("latency", latency),
            slog.String("client_ip", c.ClientIP()),
            slog.Any("request_id", reqID),
            slog.Int("body_size", c.Writer.Size()),
        }

        level := slog.LevelInfo
        if status >= 500 {
            level = slog.LevelError
        } else if status >= 400 {
            level = slog.LevelWarn
        }

        logger.LogAttrs(c.Request.Context(), level, "request", attrs...)
    }
}
```

### Timing Middleware

```go
func timingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        duration := time.Since(start)
        c.Header("X-Response-Time", fmt.Sprintf("%dms", duration.Milliseconds()))
    }
}
```

## Middleware Composition

Combine middleware into reusable stacks.

```go
// Reusable stack for protected API routes
func protectedAPIStack() []gin.HandlerFunc {
    return []gin.HandlerFunc{
        requestIDMiddleware(),
        structuredLoggingMiddleware(logger),
        authMiddleware(),
    }
}

// Reusable stack for admin routes
func adminStack() []gin.HandlerFunc {
    stack := protectedAPIStack()
    return append(stack, adminOnlyMiddleware())
}

// Apply stack to a group
api := router.Group("/api/v1")
api.Use(protectedAPIStack()...)

admin := router.Group("/admin")
admin.Use(adminStack()...)
```

## c.Next() vs c.Abort()

| Method | Behavior |
| --- | --- |
| `c.Next()` | Execute remaining handlers in the chain |
| `c.Abort()` | Stop chain, do not call remaining handlers |
| `c.AbortWithStatus(code)` | Abort and set status code |
| `c.AbortWithStatusJSON(code, obj)` | Abort with status and JSON body |
| `c.IsAborted()` | Check if chain was aborted |

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Calling both `c.Abort()` and `c.Next()` | Pick one based on the middleware's decision |
| Not calling `c.Next()` in pass-through middleware | Always call `c.Next()` unless aborting |
| Writing response after `c.Abort()` | Use `c.AbortWithStatusJSON()` to combine |
| Logging status before `c.Next()` | Read `c.Writer.Status()` after `c.Next()` |
| Global auth on health endpoints | Use group-level middleware instead |
