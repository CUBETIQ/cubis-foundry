# Go Error Handling

## Error Design Principles

Go errors are values. Design them as carefully as you design your types.

## Error Wrapping with %w

```go
// Wrap to add context while preserving the original error
func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// Callers can inspect the chain
if errors.Is(err, sql.ErrNoRows) {
    // handle not found
}
```

### Wrapping Rules

- Always use `%w` (not `%v`) when you want callers to match with `errors.Is`/`errors.As`.
- Add context at each layer: `fmt.Errorf("operation context: %w", err)`.
- The wrapped message should describe what the current function was doing, not what failed.

## Sentinel Errors

Define package-level sentinels for well-known conditions:

```go
package apperr

import "errors"

var (
    ErrNotFound      = errors.New("not found")
    ErrUnauthorized  = errors.New("unauthorized")
    ErrConflict      = errors.New("conflict")
    ErrRateLimited   = errors.New("rate limited")
    ErrValidation    = errors.New("validation failed")
)
```

### Usage

```go
func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) {
    user, err := r.db.QueryRow(ctx, query, id)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, fmt.Errorf("user %s: %w", id, apperr.ErrNotFound)
    }
    if err != nil {
        return nil, fmt.Errorf("query user %s: %w", id, err)
    }
    return user, nil
}

// Caller
user, err := repo.FindByID(ctx, id)
if errors.Is(err, apperr.ErrNotFound) {
    http.Error(w, "user not found", http.StatusNotFound)
    return
}
```

## Custom Error Types

When errors need to carry structured data:

```go
type ValidationError struct {
    Field   string
    Message string
    Value   any
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

type APIError struct {
    Code     int
    Message  string
    Internal error
}

func (e *APIError) Error() string {
    if e.Internal != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Internal)
    }
    return e.Message
}

func (e *APIError) Unwrap() error {
    return e.Internal
}
```

### Matching with errors.As

```go
var apiErr *APIError
if errors.As(err, &apiErr) {
    w.WriteHeader(apiErr.Code)
    json.NewEncoder(w).Encode(map[string]string{"error": apiErr.Message})
    return
}
```

## Multi-Error Handling (Go 1.20+)

```go
// errors.Join combines multiple errors
func validateUser(u *User) error {
    var errs []error

    if u.Name == "" {
        errs = append(errs, &ValidationError{Field: "name", Message: "required"})
    }
    if u.Email == "" {
        errs = append(errs, &ValidationError{Field: "email", Message: "required"})
    }
    if !isValidEmail(u.Email) {
        errs = append(errs, &ValidationError{Field: "email", Message: "invalid format"})
    }

    return errors.Join(errs...)
}

// Caller can still use errors.Is and errors.As on joined errors
err := validateUser(user)
var valErr *ValidationError
if errors.As(err, &valErr) {
    // First matching ValidationError in the chain
}
```

## Error Middleware for HTTP APIs

```go
// HandlerFunc that returns error
type AppHandlerFunc func(w http.ResponseWriter, r *http.Request) error

// Middleware converts errors to HTTP responses
func ErrorHandler(h AppHandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        err := h(w, r)
        if err == nil {
            return
        }

        // Check for custom API error
        var apiErr *APIError
        if errors.As(err, &apiErr) {
            writeJSON(w, apiErr.Code, apiErr.Message)
            return
        }

        // Check for validation error
        var valErr *ValidationError
        if errors.As(err, &valErr) {
            writeJSON(w, http.StatusBadRequest, valErr.Error())
            return
        }

        // Check sentinels
        switch {
        case errors.Is(err, apperr.ErrNotFound):
            writeJSON(w, http.StatusNotFound, "not found")
        case errors.Is(err, apperr.ErrUnauthorized):
            writeJSON(w, http.StatusUnauthorized, "unauthorized")
        case errors.Is(err, apperr.ErrConflict):
            writeJSON(w, http.StatusConflict, "conflict")
        default:
            slog.Error("unhandled error", "error", err, "path", r.URL.Path)
            writeJSON(w, http.StatusInternalServerError, "internal server error")
        }
    }
}
```

## Error Anti-Patterns

### 1. Bare error discard

```go
// WRONG
result, _ := riskyOperation()

// CORRECT: document intentional discard
result, _ := riskyOperation() // error intentionally ignored: fallback below
```

### 2. String comparison

```go
// WRONG
if err.Error() == "not found" { ... }

// CORRECT
if errors.Is(err, ErrNotFound) { ... }
```

### 3. Wrapping without context

```go
// WRONG: no additional context
if err != nil {
    return fmt.Errorf("%w", err)
}

// CORRECT: adds operation context
if err != nil {
    return fmt.Errorf("load config from %s: %w", path, err)
}
```

### 4. Panic-based control flow

```go
// WRONG
func MustParse(s string) Config {
    c, err := Parse(s)
    if err != nil {
        panic(err) // crashes the program
    }
    return c
}

// CORRECT: return error, let caller decide
func Parse(s string) (Config, error) { ... }

// Must* is acceptable ONLY for package-level initialization
var defaultConfig = MustParse("default.toml") // panics at startup, not at runtime
```

### 5. Logging and returning

```go
// WRONG: error is logged at every layer, producing duplicate log entries
if err != nil {
    log.Error("failed", "error", err)
    return err
}

// CORRECT: wrap and return; log once at the top-level handler
if err != nil {
    return fmt.Errorf("operation: %w", err)
}
```
