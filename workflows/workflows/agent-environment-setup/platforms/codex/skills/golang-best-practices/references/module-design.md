# Go Module Design

## Standard Project Layout

```
myservice/
  cmd/
    myservice/
      main.go           # Entry point
    worker/
      main.go           # Secondary binary
  internal/
    auth/               # Package hidden from external consumers
      auth.go
      auth_test.go
    store/
      postgres.go
      postgres_test.go
  domain/               # Core business types (no external dependencies)
    user.go
    order.go
  handler/              # HTTP handlers
    user.go
    user_test.go
  service/              # Business logic orchestration
    user.go
    user_test.go
  go.mod
  go.sum
```

### Directory Conventions

| Directory | Purpose | Imported by |
| --- | --- | --- |
| `cmd/` | Binary entry points | Nothing (it imports everything) |
| `internal/` | Private packages | Only this module |
| `domain/` | Core types, interfaces | Everything in this module |
| `handler/` | HTTP/gRPC handlers | `cmd/` |
| `service/` | Business logic | `handler/` |

### Rules

1. `internal/` packages cannot be imported outside the module — the Go toolchain enforces this.
2. `cmd/` should contain only `main.go` with minimal wiring code.
3. Domain types have zero external dependencies — they define interfaces that infrastructure implements.

## Package Design Principles

### Small Interfaces at the Consumer

```go
// WRONG: large interface defined at the implementation
package store

type UserStore interface {
    Create(ctx context.Context, u *User) error
    Update(ctx context.Context, u *User) error
    Delete(ctx context.Context, id string) error
    FindByID(ctx context.Context, id string) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    List(ctx context.Context, filter Filter) ([]*User, error)
    Count(ctx context.Context, filter Filter) (int, error)
}

// CORRECT: small interfaces at each consumer
package handler

type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

type UserCreator interface {
    Create(ctx context.Context, u *User) error
}
```

### Package Naming

```go
// GOOD: package name describes what it provides
package http     // provides HTTP utilities
package user     // provides user domain logic
package postgres // provides PostgreSQL implementations

// BAD: vague package names
package util     // what utility? too broad
package common   // everything ends up here
package helpers  // same problem as util
package models   // describe the domain, not the pattern
```

### Avoid Circular Dependencies

```
// This is forbidden in Go:
// package A imports package B
// package B imports package A

// Fix: extract shared types into a third package
domain/
  types.go       # User, Order (no dependencies)
service/
  user.go        # imports domain/
handler/
  user.go        # imports domain/ and service/
```

## go.mod Management

### Versioning

```
module github.com/org/myservice

go 1.24

require (
    github.com/lib/pq v1.10.9
    golang.org/x/sync v0.8.0
)
```

### Module Maintenance Commands

```bash
# Add a dependency
go get github.com/lib/pq@latest

# Update all dependencies
go get -u ./...

# Update only patch versions
go get -u=patch ./...

# Remove unused dependencies
go mod tidy

# Vendor dependencies (for reproducible builds)
go mod vendor

# Check for known vulnerabilities
go mod verify
govulncheck ./...
```

### Replace Directives (Local Development)

```
// go.mod — for local development of a dependency
replace github.com/org/shared-lib => ../shared-lib
```

Remove before committing. Use `go work` for persistent multi-module development:

```bash
go work init
go work use ./myservice
go work use ../shared-lib
```

## API Surface Design

### Minimize Exported Symbols

```go
// Export the interface consumers need
type Service interface {
    GetUser(ctx context.Context, id string) (*User, error)
}

// Export the constructor
func NewService(repo Repository, logger *slog.Logger) Service {
    return &service{repo: repo, logger: logger}
}

// Keep the implementation unexported
type service struct {
    repo   Repository
    logger *slog.Logger
}
```

### Functional Options Pattern

```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func WithLogger(l *slog.Logger) Option {
    return func(s *Server) { s.logger = l }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        port:    8080,           // sensible defaults
        timeout: 30 * time.Second,
        logger:  slog.Default(),
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage
srv := NewServer(
    WithPort(9090),
    WithTimeout(10 * time.Second),
)
```

## Build and Release

### Build Commands

```bash
# Development
go build ./cmd/myservice

# Production release
go build -trimpath -ldflags='-s -w -X main.version=v1.2.3' -o myservice ./cmd/myservice

# Cross-compilation
GOOS=linux GOARCH=amd64 go build -trimpath -o myservice-linux-amd64 ./cmd/myservice
```

### Dockerfile (Multi-Stage)

```dockerfile
FROM golang:1.24 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /myservice ./cmd/myservice

FROM gcr.io/distroless/static-debian12
COPY --from=builder /myservice /myservice
ENTRYPOINT ["/myservice"]
```

### Using ko (Container Build Without Dockerfile)

```bash
# Build and push container image
ko build ./cmd/myservice

# Local development
ko build --local ./cmd/myservice
```

ko produces minimal images without a Go toolchain, Docker daemon, or Dockerfile.
