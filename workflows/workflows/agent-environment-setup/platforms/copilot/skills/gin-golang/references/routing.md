# Gin Routing

## Route Registration

Gin uses a radix tree router for fast path matching. Routes are registered with method-specific functions on the engine or a router group.

```go
router := gin.New()

// Method-specific routes
router.GET("/users", listUsers)
router.POST("/users", createUser)
router.GET("/users/:id", getUser)
router.PUT("/users/:id", updateUser)
router.DELETE("/users/:id", deleteUser)
router.PATCH("/users/:id", patchUser)
router.OPTIONS("/users", corsOptions)
router.HEAD("/users", headUsers)

// Any method
router.Any("/fallback", fallbackHandler)

// Handle specific methods
router.Handle("PURGE", "/cache/:key", purgeCache)
```

## Path Parameters

Parameters use `:name` for single segments and `*name` for wildcard catch-all.

```go
// Required parameter
router.GET("/users/:id", func(c *gin.Context) {
    id := c.Param("id") // string, always present
    c.JSON(200, gin.H{"id": id})
})

// Multiple parameters
router.GET("/orgs/:orgID/repos/:repoID", func(c *gin.Context) {
    orgID := c.Param("orgID")
    repoID := c.Param("repoID")
    c.JSON(200, gin.H{"org": orgID, "repo": repoID})
})

// Wildcard catch-all (must be last segment)
router.GET("/files/*filepath", func(c *gin.Context) {
    path := c.Param("filepath") // includes leading /
    c.String(200, "Serving: %s", path)
})

// NOTE: Gin does not support optional parameters.
// Use separate routes or query parameters instead.
```

## Route Groups

Groups share a prefix and middleware. Nested groups inherit from parents.

```go
// Public routes
public := router.Group("/")
{
    public.GET("/health", healthHandler)
    public.GET("/version", versionHandler)
}

// API v1 with auth
v1 := router.Group("/api/v1")
v1.Use(authMiddleware())
{
    // Users resource
    users := v1.Group("/users")
    {
        users.GET("", listUsers)
        users.POST("", createUser)
        users.GET("/:id", getUser)
        users.PUT("/:id", updateUser)
        users.DELETE("/:id", deleteUser)
    }

    // Products resource
    products := v1.Group("/products")
    products.Use(rateLimitMiddleware()) // Additional middleware
    {
        products.GET("", listProducts)
        products.POST("", createProduct)
        products.GET("/:id", getProduct)
    }
}

// Admin routes with stricter auth
admin := router.Group("/admin")
admin.Use(authMiddleware(), adminOnlyMiddleware())
{
    admin.GET("/stats", adminStats)
    admin.POST("/settings", updateSettings)
}
```

## Query Parameters

```go
router.GET("/search", func(c *gin.Context) {
    // Single value with default
    q := c.DefaultQuery("q", "")
    page := c.DefaultQuery("page", "1")

    // Required value (returns "" if missing)
    sort := c.Query("sort")

    // Array values: /search?tag=go&tag=fiber
    tags := c.QueryArray("tag")

    // Map values: /search?filter[status]=active&filter[type]=post
    filters := c.QueryMap("filter")

    // Parse into struct
    var params SearchParams
    if err := c.ShouldBindQuery(&params); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
})

type SearchParams struct {
    Query  string `form:"q" binding:"required"`
    Page   int    `form:"page" binding:"min=1"`
    Limit  int    `form:"limit" binding:"min=1,max=100"`
    SortBy string `form:"sort_by" binding:"oneof=created_at updated_at name"`
}
```

## Request Body Binding

Gin binds request bodies based on Content-Type header.

```go
// JSON body
func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    // req is populated and validated
}

// Form data
func uploadFile(c *gin.Context) {
    var form UploadForm
    if err := c.ShouldBind(&form); err != nil { // Auto-detects content type
        handleValidationError(c, err)
        return
    }
}

// URI parameters
func getUser(c *gin.Context) {
    var uri UserURI
    if err := c.ShouldBindUri(&uri); err != nil {
        c.JSON(400, gin.H{"error": "Invalid ID"})
        return
    }
}

type UserURI struct {
    ID string `uri:"id" binding:"required,uuid"`
}
```

## Response Methods

```go
// JSON response
c.JSON(200, gin.H{"message": "ok"})
c.JSON(200, user) // struct serialization

// String response
c.String(200, "Hello %s", name)

// Data response
c.Data(200, "application/octet-stream", binaryData)

// File response
c.File("/path/to/file.pdf")
c.FileAttachment("/path/to/file.pdf", "download.pdf")

// Redirect
c.Redirect(301, "/new-location")

// Stream
c.Stream(func(w io.Writer) bool {
    fmt.Fprintf(w, "data: %s\n\n", event)
    return keepStreaming
})

// No content
c.Status(204)

// Set headers before response
c.Header("X-Custom", "value")
c.Header("Cache-Control", "no-store")
```

## Static Files

```go
// Serve directory
router.Static("/assets", "./public")

// Serve single file
router.StaticFile("/favicon.ico", "./resources/favicon.ico")

// Serve filesystem
router.StaticFS("/more_static", http.Dir("my_file_system"))
```

## NoRoute and NoMethod Handlers

```go
// Custom 404 handler
router.NoRoute(func(c *gin.Context) {
    c.JSON(404, gin.H{
        "code":    "NOT_FOUND",
        "message": fmt.Sprintf("Route %s %s not found", c.Request.Method, c.Request.URL.Path),
    })
})

// Custom 405 handler
router.NoMethod(func(c *gin.Context) {
    c.JSON(405, gin.H{
        "code":    "METHOD_NOT_ALLOWED",
        "message": fmt.Sprintf("Method %s not allowed", c.Request.Method),
    })
})
```

## Route Patterns Summary

| Pattern | Example | Match | No Match |
| --- | --- | --- | --- |
| `/literal` | `/users` | `/users` | `/users/` |
| `/:param` | `/users/:id` | `/users/42` | `/users/` |
| `/*wildcard` | `/files/*path` | `/files/a/b/c` | `/files` |
| Group prefix | `v1.Group("/users")` | `/api/v1/users` | `/users` |
