# Example: Middleware Integration Testing

## Prompt

> Write integration tests for a Gin middleware stack: request ID, structured logging with slog, JWT auth, and rate limiting. Verify middleware execution order and that logging captures correct status codes from downstream errors.

## Expected Output

The skill should produce a complete middleware test suite:

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

### Structured Logging Middleware

```go
func loggingMiddleware(logger *slog.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path

        c.Next()

        // Capture status AFTER handler execution
        status := c.Writer.Status()
        latency := time.Since(start)
        reqID, _ := c.Get("requestID")

        logger.Info("request",
            "method", c.Request.Method,
            "path", path,
            "status", status,
            "latency_ms", latency.Milliseconds(),
            "request_id", reqID,
            "client_ip", c.ClientIP(),
        )
    }
}
```

### Integration Tests

```go
func TestRequestIDPropagation(t *testing.T) {
    router := gin.New()
    router.Use(requestIDMiddleware())
    router.GET("/test", func(c *gin.Context) {
        id, _ := c.Get("requestID")
        c.JSON(200, gin.H{"request_id": id})
    })

    w := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/test", nil)
    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)

    // Verify header is a valid UUID
    headerID := w.Header().Get("X-Request-Id")
    assert.NotEmpty(t, headerID)
    _, err := uuid.Parse(headerID)
    assert.NoError(t, err, "X-Request-Id should be a valid UUID")

    // Verify handler received the same ID
    var body map[string]string
    json.Unmarshal(w.Body.Bytes(), &body)
    assert.Equal(t, headerID, body["request_id"])
}

func TestRequestIDPreservedFromClient(t *testing.T) {
    router := gin.New()
    router.Use(requestIDMiddleware())
    router.GET("/test", func(c *gin.Context) {
        c.Status(200)
    })

    clientID := "client-supplied-id-123"
    w := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/test", nil)
    req.Header.Set("X-Request-Id", clientID)
    router.ServeHTTP(w, req)

    assert.Equal(t, clientID, w.Header().Get("X-Request-Id"))
}

func TestAuthMiddlewareRejectsInvalidToken(t *testing.T) {
    router := gin.New()
    router.Use(requestIDMiddleware())
    router.Use(authMiddleware(testSecret))
    router.GET("/protected", func(c *gin.Context) {
        c.JSON(200, gin.H{"ok": true})
    })

    tests := []struct {
        name       string
        authHeader string
        wantStatus int
        wantCode   string
    }{
        {"missing header", "", 401, "UNAUTHORIZED"},
        {"invalid format", "NotBearer xyz", 401, "UNAUTHORIZED"},
        {"expired token", "Bearer " + expiredToken, 401, "TOKEN_EXPIRED"},
        {"valid token", "Bearer " + validToken, 200, ""},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            w := httptest.NewRecorder()
            req := httptest.NewRequest("GET", "/protected", nil)
            if tt.authHeader != "" {
                req.Header.Set("Authorization", tt.authHeader)
            }
            router.ServeHTTP(w, req)

            assert.Equal(t, tt.wantStatus, w.Code)
            if tt.wantCode != "" {
                var resp ErrorResponse
                json.Unmarshal(w.Body.Bytes(), &resp)
                assert.Equal(t, tt.wantCode, resp.Code)
            }
            // Request ID header should always be present
            assert.NotEmpty(t, w.Header().Get("X-Request-Id"))
        })
    }
}

func TestRateLimiterTriggersAfterThreshold(t *testing.T) {
    router := gin.New()
    router.Use(rateLimitMiddleware(3, time.Minute)) // 3 requests per minute
    router.GET("/limited", func(c *gin.Context) {
        c.JSON(200, gin.H{"ok": true})
    })

    for i := 0; i < 3; i++ {
        w := httptest.NewRecorder()
        req := httptest.NewRequest("GET", "/limited", nil)
        req.RemoteAddr = "192.168.1.1:1234"
        router.ServeHTTP(w, req)
        assert.Equal(t, 200, w.Code, "request %d should succeed", i+1)
    }

    // 4th request should be rate limited
    w := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/limited", nil)
    req.RemoteAddr = "192.168.1.1:1234"
    router.ServeHTTP(w, req)
    assert.Equal(t, 429, w.Code)
}

func TestLoggingCapturesErrorStatus(t *testing.T) {
    var buf bytes.Buffer
    logger := slog.New(slog.NewJSONHandler(&buf, nil))

    router := gin.New()
    router.Use(loggingMiddleware(logger))
    router.GET("/not-found", func(c *gin.Context) {
        c.JSON(404, gin.H{"error": "not found"})
    })

    w := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/not-found", nil)
    router.ServeHTTP(w, req)

    assert.Equal(t, 404, w.Code)

    // Verify the log entry captured status 404, not 200
    logOutput := buf.String()
    assert.Contains(t, logOutput, `"status":404`)
}
```

## Key Observations

- Request ID middleware runs before logging so the logger can include the ID.
- Auth middleware runs after request ID so rejected requests still have traceability.
- Logging middleware captures `c.Writer.Status()` AFTER `c.Next()` so it reflects the actual response status.
- Rate limiter test sends requests in sequence and verifies the threshold transition.
- All tests use `httptest.NewRecorder` with `router.ServeHTTP` for full-stack integration.
- The logging status test catches the common bug of logging status before the handler sets it.
