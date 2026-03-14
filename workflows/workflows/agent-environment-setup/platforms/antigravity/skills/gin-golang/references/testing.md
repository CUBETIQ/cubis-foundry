# Gin Testing

## Testing Approaches

Gin supports two testing styles: integration tests with `httptest.NewRecorder` and `router.ServeHTTP`, and unit tests with `gin.CreateTestContext`. Use integration tests for full-stack behavior and unit tests for isolated handler logic.

## Integration Tests with httptest

The standard approach registers routes on a test engine and calls `ServeHTTP`.

```go
func setupTestRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    router := gin.New()
    router.Use(gin.Recovery())

    // Register the same middleware and routes as production
    api := router.Group("/api/v1")
    api.Use(authMiddleware())
    {
        api.GET("/products", listProducts)
        api.POST("/products", createProduct)
        api.GET("/products/:id", getProduct)
        api.PUT("/products/:id", updateProduct)
        api.DELETE("/products/:id", deleteProduct)
    }

    return router
}

func TestListProducts(t *testing.T) {
    router := setupTestRouter()

    w := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/api/v1/products", nil)
    req.Header.Set("Authorization", "Bearer "+testToken)

    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)

    var products []Product
    err := json.Unmarshal(w.Body.Bytes(), &products)
    require.NoError(t, err)
    assert.GreaterOrEqual(t, len(products), 0)
}
```

## Table-Driven Tests

Cover multiple scenarios with shared setup.

```go
func TestCreateProduct(t *testing.T) {
    router := setupTestRouter()

    tests := []struct {
        name       string
        body       interface{}
        token      string
        wantStatus int
        wantCode   string
        wantFields []string // expected validation error fields
    }{
        {
            name: "valid product",
            body: CreateProductRequest{
                Name:     "Widget Pro",
                Slug:     "widget-pro",
                Price:    29.99,
                Category: "electronics",
                SKU:      "ABCDEFGHIJ",
            },
            token:      validToken,
            wantStatus: 201,
        },
        {
            name:       "missing required fields",
            body:       map[string]string{},
            token:      validToken,
            wantStatus: 400,
            wantCode:   "VALIDATION_ERROR",
            wantFields: []string{"name", "slug", "price", "category", "sku"},
        },
        {
            name: "invalid slug format",
            body: map[string]interface{}{
                "name": "Widget", "slug": "BAD SLUG!",
                "price": 10, "category": "electronics", "sku": "ABCDEFGHIJ",
            },
            token:      validToken,
            wantStatus: 400,
            wantCode:   "VALIDATION_ERROR",
            wantFields: []string{"slug"},
        },
        {
            name: "price out of range",
            body: map[string]interface{}{
                "name": "Widget", "slug": "widget",
                "price": -5, "category": "electronics", "sku": "ABCDEFGHIJ",
            },
            token:      validToken,
            wantStatus: 400,
            wantCode:   "VALIDATION_ERROR",
            wantFields: []string{"price"},
        },
        {
            name: "invalid category",
            body: map[string]interface{}{
                "name": "Widget", "slug": "widget",
                "price": 10, "category": "invalid", "sku": "ABCDEFGHIJ",
            },
            token:      validToken,
            wantStatus: 400,
            wantCode:   "VALIDATION_ERROR",
            wantFields: []string{"category"},
        },
        {
            name:       "no auth token",
            body:       CreateProductRequest{Name: "Widget"},
            token:      "",
            wantStatus: 401,
            wantCode:   "UNAUTHORIZED",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            bodyBytes, _ := json.Marshal(tt.body)
            w := httptest.NewRecorder()
            req := httptest.NewRequest("POST", "/api/v1/products",
                bytes.NewReader(bodyBytes))
            req.Header.Set("Content-Type", "application/json")
            if tt.token != "" {
                req.Header.Set("Authorization", "Bearer "+tt.token)
            }

            router.ServeHTTP(w, req)

            assert.Equal(t, tt.wantStatus, w.Code)

            if tt.wantCode != "" {
                var resp ErrorResponse
                require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
                assert.Equal(t, tt.wantCode, resp.Code)

                if len(tt.wantFields) > 0 {
                    respFields := make([]string, len(resp.Details))
                    for i, d := range resp.Details {
                        respFields[i] = d.Field
                    }
                    for _, f := range tt.wantFields {
                        assert.Contains(t, respFields, f, "expected field error for %s", f)
                    }
                }
            }
        })
    }
}
```

## Unit Tests with gin.CreateTestContext

For testing handlers in isolation without routing.

```go
func TestGetProductHandler(t *testing.T) {
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)

    // Set up the context as if the router had parsed the request
    c.Params = gin.Params{{Key: "id", Value: "42"}}
    c.Request = httptest.NewRequest("GET", "/api/v1/products/42", nil)

    // Set user in context (as if auth middleware had run)
    c.Set("user", &UserClaims{ID: "user-1", Role: "admin"})

    // Call handler directly
    getProduct(c)

    assert.Equal(t, 200, w.Code)

    var product Product
    require.NoError(t, json.Unmarshal(w.Body.Bytes(), &product))
    assert.Equal(t, "42", product.ID)
}
```

## Testing Middleware

Test middleware in isolation to verify behavior independently of handlers.

```go
func TestAuthMiddleware(t *testing.T) {
    gin.SetMode(gin.TestMode)

    tests := []struct {
        name       string
        auth       string
        wantStatus int
        wantAbort  bool
    }{
        {"valid token", "Bearer " + validToken, 200, false},
        {"missing header", "", 401, true},
        {"wrong prefix", "Token " + validToken, 401, true},
        {"expired token", "Bearer " + expiredToken, 401, true},
        {"malformed token", "Bearer not.a.jwt", 401, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            w := httptest.NewRecorder()
            c, engine := gin.CreateTestContext(w)
            c.Request = httptest.NewRequest("GET", "/test", nil)
            if tt.auth != "" {
                c.Request.Header.Set("Authorization", tt.auth)
            }

            handlerCalled := false
            engine.Use(authMiddleware())
            engine.GET("/test", func(c *gin.Context) {
                handlerCalled = true
                c.Status(200)
            })

            engine.ServeHTTP(w, c.Request)

            assert.Equal(t, tt.wantStatus, w.Code)
            if tt.wantAbort {
                assert.False(t, handlerCalled, "handler should not be called")
            } else {
                assert.True(t, handlerCalled, "handler should be called")
            }
        })
    }
}
```

## Testing with Database

```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db, err := sql.Open("sqlite3", ":memory:")
    require.NoError(t, err)

    // Run migrations
    _, err = db.Exec(schema)
    require.NoError(t, err)

    t.Cleanup(func() { db.Close() })
    return db
}

func setupTestRouterWithDB(t *testing.T) *gin.Engine {
    db := setupTestDB(t)
    svc := NewProductService(db)

    gin.SetMode(gin.TestMode)
    router := gin.New()
    RegisterProductRoutes(router, svc)
    return router
}
```

## Benchmark Tests

```go
func BenchmarkListProducts(b *testing.B) {
    gin.SetMode(gin.ReleaseMode)
    router := setupBenchRouter()

    req := httptest.NewRequest("GET", "/api/v1/products", nil)
    req.Header.Set("Authorization", "Bearer "+benchToken)

    b.ReportAllocs()
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        w := httptest.NewRecorder()
        router.ServeHTTP(w, req)
    }
}
```

## Test Helpers

```go
// performRequest is a reusable test helper
func performRequest(t *testing.T, router *gin.Engine, method, path string, body interface{}, token string) *httptest.ResponseRecorder {
    t.Helper()

    var bodyReader io.Reader
    if body != nil {
        b, err := json.Marshal(body)
        require.NoError(t, err)
        bodyReader = bytes.NewReader(b)
    }

    w := httptest.NewRecorder()
    req := httptest.NewRequest(method, path, bodyReader)
    req.Header.Set("Content-Type", "application/json")
    if token != "" {
        req.Header.Set("Authorization", "Bearer "+token)
    }

    router.ServeHTTP(w, req)
    return w
}

// decodeResponse is a generic JSON decoder for test responses
func decodeResponse[T any](t *testing.T, w *httptest.ResponseRecorder) T {
    t.Helper()
    var result T
    require.NoError(t, json.Unmarshal(w.Body.Bytes(), &result))
    return result
}

// assertError checks error response shape
func assertError(t *testing.T, w *httptest.ResponseRecorder, status int, code string) {
    t.Helper()
    assert.Equal(t, status, w.Code)
    var resp ErrorResponse
    require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
    assert.Equal(t, code, resp.Code)
}
```

## Test Mode

Always set Gin to test mode in tests to suppress debug output.

```go
func TestMain(m *testing.M) {
    gin.SetMode(gin.TestMode)
    os.Exit(m.Run())
}
```
