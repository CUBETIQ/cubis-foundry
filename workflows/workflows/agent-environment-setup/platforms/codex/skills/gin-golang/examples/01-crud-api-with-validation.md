# Example: CRUD API with Validation

## Prompt

> Build a Gin CRUD API for an inventory service with products under /api/v1/products. Include validation with struct binding tags, a custom slug validator, and structured error responses. Use gin.New() with explicit middleware.

## Expected Output

The skill should produce a complete Gin application with validation and structured errors:

### Application Bootstrap

```go
package main

import (
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

func main() {
    if os.Getenv("GIN_MODE") == "release" {
        gin.SetMode(gin.ReleaseMode)
    }

    router := gin.New()
    router.SetTrustedProxies([]string{"10.0.0.0/8", "172.16.0.0/12"})

    // Register custom validators
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("slug", validateSlug)
    }

    // Explicit middleware stack
    router.Use(gin.CustomRecoveryWithWriter(os.Stderr, recoveryHandler))
    router.Use(requestIDMiddleware())
    router.Use(structuredLoggerMiddleware())

    // Public routes
    router.GET("/health", healthHandler)

    // Protected API group
    api := router.Group("/api/v1")
    api.Use(jwtAuthMiddleware())
    {
        api.GET("/products", listProducts)
        api.POST("/products", createProduct)
        api.GET("/products/:id", getProduct)
        api.PUT("/products/:id", updateProduct)
        api.DELETE("/products/:id", deleteProduct)
    }

    // Graceful shutdown
    srv := &http.Server{
        Addr:         ":8080",
        Handler:      router,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %s\n", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
}
```

### Request Structs with Binding Tags

```go
type CreateProductRequest struct {
    Name     string  `json:"name" binding:"required,min=1,max=200"`
    Slug     string  `json:"slug" binding:"required,slug"`
    Price    float64 `json:"price" binding:"required,gt=0,lte=999999"`
    Category string  `json:"category" binding:"required,oneof=electronics books clothing food"`
    SKU      string  `json:"sku" binding:"required,len=10"`
}

type UpdateProductRequest struct {
    Name     *string  `json:"name" binding:"omitempty,min=1,max=200"`
    Price    *float64 `json:"price" binding:"omitempty,gt=0,lte=999999"`
    Category *string  `json:"category" binding:"omitempty,oneof=electronics books clothing food"`
}

// Custom slug validator
func validateSlug(fl validator.FieldLevel) bool {
    slug := fl.Field().String()
    matched, _ := regexp.MatchString(`^[a-z0-9]+(?:-[a-z0-9]+)*$`, slug)
    return matched
}
```

### Handler with Structured Error Response

```go
func createProduct(c *gin.Context) {
    var req CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }

    product, err := productService.Create(c.Request.Context(), req)
    if err != nil {
        handleError(c, err)
        return
    }

    c.JSON(http.StatusCreated, product)
}

func handleValidationError(c *gin.Context, err error) {
    var ve validator.ValidationErrors
    if errors.As(err, &ve) {
        fields := make([]FieldError, len(ve))
        for i, fe := range ve {
            fields[i] = FieldError{
                Field:   fe.Field(),
                Tag:     fe.Tag(),
                Message: fieldErrorMessage(fe),
            }
        }
        c.JSON(http.StatusBadRequest, ErrorResponse{
            Code:    "VALIDATION_ERROR",
            Message: "Request validation failed",
            Details: fields,
        })
        return
    }
    c.JSON(http.StatusBadRequest, ErrorResponse{
        Code:    "BAD_REQUEST",
        Message: err.Error(),
    })
}
```

### Table-Driven Tests

```go
func TestCreateProduct(t *testing.T) {
    router := setupTestRouter()

    tests := []struct {
        name       string
        body       interface{}
        wantStatus int
        wantCode   string
    }{
        {
            name: "valid product",
            body: CreateProductRequest{
                Name: "Widget", Slug: "widget-pro",
                Price: 29.99, Category: "electronics", SKU: "ABCDEFGHIJ",
            },
            wantStatus: 201,
        },
        {
            name:       "missing required fields",
            body:       map[string]string{"name": "Widget"},
            wantStatus: 400,
            wantCode:   "VALIDATION_ERROR",
        },
        {
            name: "invalid slug format",
            body: map[string]interface{}{
                "name": "Widget", "slug": "INVALID SLUG!",
                "price": 29.99, "category": "electronics", "sku": "ABCDEFGHIJ",
            },
            wantStatus: 400,
            wantCode:   "VALIDATION_ERROR",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            body, _ := json.Marshal(tt.body)
            w := httptest.NewRecorder()
            req := httptest.NewRequest("POST", "/api/v1/products", bytes.NewReader(body))
            req.Header.Set("Content-Type", "application/json")
            req.Header.Set("Authorization", "Bearer "+testToken)

            router.ServeHTTP(w, req)

            assert.Equal(t, tt.wantStatus, w.Code)
            if tt.wantCode != "" {
                var resp ErrorResponse
                json.Unmarshal(w.Body.Bytes(), &resp)
                assert.Equal(t, tt.wantCode, resp.Code)
            }
        })
    }
}
```

## Key Observations

- `gin.New()` is used instead of `gin.Default()` for explicit middleware control.
- Custom slug validator is registered through `binding.Validator.Engine()`.
- `ShouldBindJSON` is used instead of `BindJSON` to retain error handling control.
- Update struct uses pointer fields for partial update support.
- Graceful shutdown wraps Gin in `http.Server` for timeout and signal handling.
- Tests are table-driven with subtests covering valid, missing, and invalid inputs.
