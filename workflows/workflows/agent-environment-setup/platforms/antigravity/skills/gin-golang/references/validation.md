# Gin Validation

## Binding and Validation Overview

Gin uses `go-playground/validator/v10` for struct validation. Request data is bound to structs using `ShouldBind*` methods, and validated through `binding` tags on struct fields.

## ShouldBind vs Bind

Always use `ShouldBind*` methods. They return the error for you to handle. `Bind*` methods write a 400 response automatically and call `c.Abort()`, removing your control over error formatting.

```go
// CORRECT: ShouldBind returns the error
func createProduct(c *gin.Context) {
    var req CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err) // You control the response
        return
    }
    // Process valid request...
}

// WRONG: Bind writes 400 and aborts automatically
func createProduct(c *gin.Context) {
    var req CreateProductRequest
    if err := c.BindJSON(&req); err != nil {
        return // 400 already sent with gin's default format
    }
}
```

## Binding Methods

| Method | Content-Type | Source |
| --- | --- | --- |
| `ShouldBindJSON(&obj)` | `application/json` | Body |
| `ShouldBindXML(&obj)` | `application/xml` | Body |
| `ShouldBindYAML(&obj)` | `application/yaml` | Body |
| `ShouldBind(&obj)` | Auto-detect | Body |
| `ShouldBindQuery(&obj)` | N/A | Query string |
| `ShouldBindUri(&obj)` | N/A | Path parameters |
| `ShouldBindHeader(&obj)` | N/A | Headers |

## Common Binding Tags

```go
type CreateProductRequest struct {
    // Required field
    Name string `json:"name" binding:"required"`

    // String length constraints
    Description string `json:"description" binding:"required,min=10,max=1000"`

    // Numeric constraints
    Price    float64 `json:"price" binding:"required,gt=0,lte=999999.99"`
    Quantity int     `json:"quantity" binding:"required,min=0,max=99999"`

    // Enum / oneof
    Category string `json:"category" binding:"required,oneof=electronics books clothing food"`
    Status   string `json:"status" binding:"oneof=draft active archived"`

    // Format validators
    Email   string `json:"email" binding:"required,email"`
    Website string `json:"website" binding:"omitempty,url"`
    SKU     string `json:"sku" binding:"required,len=10,alphanum"`

    // UUID
    OwnerID string `json:"owner_id" binding:"required,uuid"`

    // Nested struct validation
    Address Address `json:"address" binding:"required"`

    // Slice validation
    Tags []string `json:"tags" binding:"max=10,dive,min=1,max=50"`

    // Optional field (skip validation if empty)
    Notes *string `json:"notes" binding:"omitempty,max=500"`
}

type Address struct {
    Street  string `json:"street" binding:"required"`
    City    string `json:"city" binding:"required"`
    Country string `json:"country" binding:"required,iso3166_1_alpha2"`
    Zip     string `json:"zip" binding:"required"`
}
```

## Custom Validators

Register custom validation functions for domain-specific rules.

```go
import (
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

func setupValidators() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        // Custom slug validator
        v.RegisterValidation("slug", validateSlug)

        // Custom currency code validator
        v.RegisterValidation("currency", validateCurrency)

        // Custom phone number validator
        v.RegisterValidation("phone", validatePhone)

        // Custom date range validator
        v.RegisterStructValidation(validateDateRange, DateRangeRequest{})
    }
}

func validateSlug(fl validator.FieldLevel) bool {
    slug := fl.Field().String()
    matched, _ := regexp.MatchString(`^[a-z0-9]+(?:-[a-z0-9]+)*$`, slug)
    return matched
}

func validateCurrency(fl validator.FieldLevel) bool {
    valid := map[string]bool{"USD": true, "EUR": true, "GBP": true, "JPY": true}
    return valid[fl.Field().String()]
}

func validatePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    matched, _ := regexp.MatchString(`^\+[1-9]\d{1,14}$`, phone)
    return matched
}

// Cross-field validation
func validateDateRange(sl validator.StructLevel) {
    req := sl.Current().Interface().(DateRangeRequest)
    if !req.EndDate.After(req.StartDate) {
        sl.ReportError(req.EndDate, "end_date", "EndDate", "gtfield", "start_date")
    }
}
```

## Structured Validation Error Response

Transform `validator.ValidationErrors` into a client-friendly JSON format.

```go
type ErrorResponse struct {
    Code    string       `json:"code"`
    Message string       `json:"message"`
    Details []FieldError `json:"details,omitempty"`
}

type FieldError struct {
    Field   string `json:"field"`
    Tag     string `json:"tag"`
    Value   interface{} `json:"value,omitempty"`
    Message string `json:"message"`
}

func handleValidationError(c *gin.Context, err error) {
    var ve validator.ValidationErrors
    if errors.As(err, &ve) {
        fields := make([]FieldError, len(ve))
        for i, fe := range ve {
            fields[i] = FieldError{
                Field:   toSnakeCase(fe.Field()),
                Tag:     fe.Tag(),
                Value:   fe.Value(),
                Message: formatFieldMessage(fe),
            }
        }
        c.JSON(http.StatusBadRequest, ErrorResponse{
            Code:    "VALIDATION_ERROR",
            Message: "Request validation failed",
            Details: fields,
        })
        return
    }

    // JSON syntax errors (malformed body)
    var je *json.SyntaxError
    if errors.As(err, &je) {
        c.JSON(http.StatusBadRequest, ErrorResponse{
            Code:    "INVALID_JSON",
            Message: "Request body contains invalid JSON",
        })
        return
    }

    // Unmarshal type errors (wrong type for field)
    var ute *json.UnmarshalTypeError
    if errors.As(err, &ute) {
        c.JSON(http.StatusBadRequest, ErrorResponse{
            Code:    "TYPE_ERROR",
            Message: fmt.Sprintf("Field '%s' must be of type %s", ute.Field, ute.Type.String()),
        })
        return
    }

    c.JSON(http.StatusBadRequest, ErrorResponse{
        Code:    "BAD_REQUEST",
        Message: err.Error(),
    })
}

func formatFieldMessage(fe validator.FieldError) string {
    field := toSnakeCase(fe.Field())
    switch fe.Tag() {
    case "required":
        return fmt.Sprintf("%s is required", field)
    case "min":
        return fmt.Sprintf("%s must be at least %s", field, fe.Param())
    case "max":
        return fmt.Sprintf("%s must be at most %s", field, fe.Param())
    case "oneof":
        return fmt.Sprintf("%s must be one of: %s", field, fe.Param())
    case "email":
        return fmt.Sprintf("%s must be a valid email address", field)
    case "url":
        return fmt.Sprintf("%s must be a valid URL", field)
    case "uuid":
        return fmt.Sprintf("%s must be a valid UUID", field)
    case "slug":
        return fmt.Sprintf("%s must be a valid URL slug (lowercase, hyphens only)", field)
    default:
        return fmt.Sprintf("%s failed %s validation", field, fe.Tag())
    }
}
```

## Partial Update Validation

Use pointer fields for PATCH/PUT with optional fields.

```go
type UpdateProductRequest struct {
    Name        *string  `json:"name" binding:"omitempty,min=1,max=200"`
    Description *string  `json:"description" binding:"omitempty,min=10,max=1000"`
    Price       *float64 `json:"price" binding:"omitempty,gt=0"`
    Category    *string  `json:"category" binding:"omitempty,oneof=electronics books clothing food"`
}

func updateProduct(c *gin.Context) {
    var req UpdateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }

    // Only update fields that are present (non-nil)
    updates := make(map[string]interface{})
    if req.Name != nil {
        updates["name"] = *req.Name
    }
    if req.Price != nil {
        updates["price"] = *req.Price
    }
    // ...
}
```

## Validation Quick Reference

| Tag | Description | Example |
| --- | --- | --- |
| `required` | Field must be present and non-zero | `binding:"required"` |
| `omitempty` | Skip validation if empty | `binding:"omitempty,email"` |
| `min`, `max` | Length/value range | `binding:"min=1,max=100"` |
| `gt`, `gte`, `lt`, `lte` | Numeric comparison | `binding:"gt=0"` |
| `oneof` | Enum values | `binding:"oneof=a b c"` |
| `email` | Email format | `binding:"email"` |
| `url` | URL format | `binding:"url"` |
| `uuid` | UUID format | `binding:"uuid"` |
| `len` | Exact length | `binding:"len=10"` |
| `alphanum` | Alphanumeric only | `binding:"alphanum"` |
| `dive` | Validate slice elements | `binding:"dive,min=1"` |
