# Gin Deployment

## Graceful Shutdown

Never use `router.Run()` in production. Wrap the Gin engine in an `http.Server` for proper shutdown support.

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
)

func main() {
    gin.SetMode(gin.ReleaseMode)
    router := setupRouter()

    srv := &http.Server{
        Addr:              ":8080",
        Handler:           router,
        ReadTimeout:       10 * time.Second,
        ReadHeaderTimeout: 5 * time.Second,
        WriteTimeout:      10 * time.Second,
        IdleTimeout:       120 * time.Second,
        MaxHeaderBytes:    1 << 20, // 1MB
    }

    // Start server in goroutine
    go func() {
        log.Printf("Starting server on %s", srv.Addr)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    sig := <-quit
    log.Printf("Received signal: %v, shutting down...", sig)

    // Shutdown with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Forced shutdown: %v", err)
    }

    // Close database connections, flush logs, etc.
    cleanup()

    log.Println("Server stopped")
}
```

## Health Checks

Implement health and readiness endpoints for orchestrators like Kubernetes.

```go
func setupHealthRoutes(router *gin.Engine, db *sql.DB) {
    // Liveness: is the process alive?
    router.GET("/healthz", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "alive"})
    })

    // Readiness: can the process handle traffic?
    router.GET("/readyz", func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
        defer cancel()

        if err := db.PingContext(ctx); err != nil {
            c.JSON(503, gin.H{
                "status": "not ready",
                "reason": "database unavailable",
            })
            return
        }

        c.JSON(200, gin.H{"status": "ready"})
    })

    // Startup probe (for slow-starting apps)
    router.GET("/startupz", func(c *gin.Context) {
        if !appReady.Load() {
            c.Status(503)
            return
        }
        c.Status(200)
    })
}
```

## Trusted Proxies

Configure trusted proxies to prevent IP spoofing.

```go
// Trust specific CIDR ranges (e.g., internal load balancers)
router.SetTrustedProxies([]string{
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
})

// Trust no proxies (direct connections only)
router.SetTrustedProxies(nil)

// Trust the platform header
router.TrustedPlatform = gin.PlatformCloudflare    // CF-Connecting-IP
router.TrustedPlatform = gin.PlatformGoogleAppEngine // X-Appengine-Remote-Addr
router.TrustedPlatform = "X-Real-Ip"                // Custom header
```

## Docker Multi-Stage Build

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags='-s -w' -o /server ./cmd/server

# Runtime stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
RUN adduser -D -g '' appuser

COPY --from=builder /server /server

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/server"]
```

## Environment Configuration

```go
type Config struct {
    Port         string `env:"PORT" envDefault:"8080"`
    GinMode      string `env:"GIN_MODE" envDefault:"release"`
    DatabaseURL  string `env:"DATABASE_URL,required"`
    JWTSecret    string `env:"JWT_SECRET,required"`
    CORSOrigins  string `env:"CORS_ORIGINS" envDefault:""`
    ReadTimeout  int    `env:"READ_TIMEOUT_SECS" envDefault:"10"`
    WriteTimeout int    `env:"WRITE_TIMEOUT_SECS" envDefault:"10"`
    RateLimit    int    `env:"RATE_LIMIT_RPM" envDefault:"100"`
}

func loadConfig() (*Config, error) {
    cfg := &Config{}
    if err := env.Parse(cfg); err != nil {
        return nil, fmt.Errorf("parse config: %w", err)
    }
    return cfg, nil
}

func main() {
    cfg, err := loadConfig()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    gin.SetMode(cfg.GinMode)
    router := setupRouter(cfg)

    srv := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      router,
        ReadTimeout:  time.Duration(cfg.ReadTimeout) * time.Second,
        WriteTimeout: time.Duration(cfg.WriteTimeout) * time.Second,
    }
    // ...
}
```

## Reverse Proxy Configuration

### Nginx

```nginx
upstream gin_app {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/ssl/certs/api.pem;
    ssl_certificate_key /etc/ssl/private/api.key;

    location / {
        proxy_pass http://gin_app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
        proxy_connect_timeout 5s;
    }
}
```

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gin-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gin-api
  template:
    metadata:
      labels:
        app: gin-api
    spec:
      containers:
        - name: gin-api
          image: registry.example.com/gin-api:latest
          ports:
            - containerPort: 8080
          env:
            - name: GIN_MODE
              value: release
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: gin-api-secrets
                  key: database-url
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
      terminationGracePeriodSeconds: 30
```

## Production Checklist

| Area | Check |
| --- | --- |
| Mode | `gin.SetMode(gin.ReleaseMode)` |
| Timeouts | ReadTimeout, WriteTimeout, IdleTimeout set |
| Shutdown | Graceful shutdown with signal handling |
| Proxies | `SetTrustedProxies` configured |
| Health | `/healthz` and `/readyz` endpoints |
| Secrets | Environment variables, not config files |
| Logging | Structured JSON, no debug logs |
| Docker | Multi-stage build, non-root user |
| Limits | MaxHeaderBytes, body size limits |
| TLS | Terminated at proxy or with `RunTLS` |
