# Example: REST API Error Handling Strategy

## Scenario

Design a comprehensive error handling strategy for a Go REST API with custom error types, sentinel errors, and middleware that converts errors to HTTP responses.

## Implementation

```go
package apierror

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
)

// --- Custom error type ---

// Error is the application's standard error type.
// It carries an HTTP status code, a user-safe message, and the internal cause.
type Error struct {
	// Code is the HTTP status code to return to the client.
	Code int `json:"-"`
	// Message is safe to show to end users.
	Message string `json:"message"`
	// Internal is the wrapped cause, never exposed to the client.
	Internal error `json:"-"`
}

func (e *Error) Error() string {
	if e.Internal != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Internal)
	}
	return e.Message
}

func (e *Error) Unwrap() error {
	return e.Internal
}

// --- Constructors ---

func New(code int, message string, internal error) *Error {
	return &Error{Code: code, Message: message, Internal: internal}
}

func NotFound(resource string, internal error) *Error {
	return New(http.StatusNotFound, fmt.Sprintf("%s not found", resource), internal)
}

func BadRequest(message string, internal error) *Error {
	return New(http.StatusBadRequest, message, internal)
}

func Unauthorized(internal error) *Error {
	return New(http.StatusUnauthorized, "unauthorized", internal)
}

func Conflict(message string, internal error) *Error {
	return New(http.StatusConflict, message, internal)
}

func Internal(internal error) *Error {
	return New(http.StatusInternalServerError, "internal server error", internal)
}

// --- Sentinel errors ---

var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrConflict     = errors.New("conflict")
	ErrValidation   = errors.New("validation failed")
)

// --- Error-returning handler type ---

// HandlerFunc is an http.HandlerFunc that returns an error.
// The error middleware converts the error into an HTTP response.
type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

// --- Middleware ---

// ErrorMiddleware wraps a HandlerFunc and converts returned errors to JSON responses.
func ErrorMiddleware(logger *slog.Logger) func(HandlerFunc) http.HandlerFunc {
	return func(h HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			err := h(w, r)
			if err == nil {
				return
			}

			// Try to extract our custom error type.
			var apiErr *Error
			if errors.As(err, &apiErr) {
				writeJSON(w, apiErr.Code, apiErr)
				logger.ErrorContext(r.Context(), "request_error",
					"status", apiErr.Code,
					"message", apiErr.Message,
					"internal", apiErr.Internal,
					"path", r.URL.Path,
				)
				return
			}

			// Map sentinel errors to HTTP status codes.
			switch {
			case errors.Is(err, ErrNotFound):
				writeJSON(w, http.StatusNotFound, map[string]string{
					"message": "resource not found",
				})
			case errors.Is(err, ErrUnauthorized):
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"message": "unauthorized",
				})
			case errors.Is(err, ErrConflict):
				writeJSON(w, http.StatusConflict, map[string]string{
					"message": "resource conflict",
				})
			case errors.Is(err, ErrValidation):
				writeJSON(w, http.StatusBadRequest, map[string]string{
					"message": err.Error(),
				})
			default:
				// Unknown error — log and return 500.
				writeJSON(w, http.StatusInternalServerError, map[string]string{
					"message": "internal server error",
				})
			}

			logger.ErrorContext(r.Context(), "request_error",
				"error", err.Error(),
				"path", r.URL.Path,
			)
		}
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body) //nolint:errcheck
}

// --- Handler examples ---

type UserService struct {
	// ... dependencies
}

func (s *UserService) GetUser(w http.ResponseWriter, r *http.Request) error {
	userID := r.PathValue("id")
	if userID == "" {
		return BadRequest("user ID is required", nil)
	}

	user, err := s.findUser(r.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return NotFound("user", fmt.Errorf("id %s: %w", userID, err))
		}
		return Internal(fmt.Errorf("find user %s: %w", userID, err))
	}

	writeJSON(w, http.StatusOK, user)
	return nil
}

// --- Router setup ---

func SetupRouter(logger *slog.Logger) *http.ServeMux {
	mux := http.NewServeMux()
	wrap := ErrorMiddleware(logger)

	svc := &UserService{}

	mux.HandleFunc("GET /users/{id}", wrap(svc.GetUser))

	return mux
}
```

## Key Patterns

1. **Custom `Error` type** — carries HTTP code, user message, and internal cause. Implements `Unwrap()` for `errors.As` traversal.
2. **Constructor functions** — `NotFound()`, `BadRequest()`, etc. create `*Error` with correct status codes.
3. **Sentinel errors** — `ErrNotFound`, `ErrUnauthorized` enable `errors.Is` matching in middleware.
4. **Error-returning handlers** — return `error` instead of writing responses, separating logic from HTTP formatting.
5. **Middleware with `errors.As`** — extracts `*Error` first, falls back to sentinel matching, defaults to 500.
