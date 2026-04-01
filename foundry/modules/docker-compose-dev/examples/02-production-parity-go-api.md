# Example: Production-Parity Go API with Debugging

## Prompt

> I have a Go API with PostgreSQL. The production Kubernetes pods have 512Mi memory and 0.5 CPU limits. Create a Docker Compose dev setup with production-parity resource limits, Delve debugger support, BuildKit caching for Go modules, and a CI test that validates the Compose config works.

## Response

### `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

# ============================================
# Base stage: shared Go setup
# ============================================
FROM golang:1.22-alpine AS base
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# ============================================
# Development stage: includes Delve debugger
# ============================================
FROM base AS dev
# Install Delve for remote debugging and air for hot reload
RUN --mount=type=cache,target=/go/pkg/mod \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    go install github.com/air-verse/air@latest
COPY . .
EXPOSE 8080 2345
# Air watches for file changes and rebuilds; Delve enables breakpoint debugging
CMD ["air", "-c", ".air.toml"]

# ============================================
# Build stage: compile the production binary
# ============================================
FROM base AS build
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

# ============================================
# Production stage: minimal distroless image
# ============================================
FROM gcr.io/distroless/static:nonroot AS prod
COPY --from=build /server /server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

### `docker-compose.yml`

```yaml
services:
  api:
    build:
      context: .
      target: dev
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
      - "2345:2345"   # Delve debugger
    volumes:
      # Bind mount source for hot reload via Air
      - .:/app
      # Preserve Go build cache inside the container
      - go-build-cache:/root/.cache/go-build
    environment:
      - DATABASE_URL=postgres://devuser:devpass@postgres:5432/devdb?sslmode=disable
      - LOG_LEVEL=debug
    # Match production Kubernetes resource limits
    mem_limit: 512m
    cpus: "0.5"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/healthz"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s
    networks:
      - app-network

  postgres:
    image: postgres:16.2-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devdb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./migrations/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    # Match production RDS instance class constraints
    mem_limit: 512m
    cpus: "0.5"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser -d devdb"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - app-network

volumes:
  postgres-data:
  go-build-cache:

networks:
  app-network:
    driver: bridge
```

### `.air.toml` (Hot Reload Configuration)

```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -gcflags='all=-N -l' -o ./tmp/server ./cmd/server"
  bin = "./tmp/server"
  full_bin = "dlv exec --headless --listen=:2345 --api-version=2 --accept-multiclient ./tmp/server"
  include_ext = ["go", "tpl", "tmpl", "html"]
  exclude_dir = ["tmp", "vendor", "testdata"]
  delay = 1000

[log]
  time = false

[misc]
  clean_on_exit = true
```

### VS Code Debug Configuration (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Container (Delve)",
      "type": "go",
      "request": "attach",
      "mode": "remote",
      "remotePath": "/app",
      "port": 2345,
      "host": "127.0.0.1",
      "showLog": true
    }
  ]
}
```

### CI Validation (`.github/workflows/compose-test.yml`)

```yaml
name: Compose Validation

on:
  pull_request:
    paths:
      - "Dockerfile"
      - "docker-compose.yml"
      - "go.mod"
      - "go.sum"

jobs:
  test-compose:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start services and wait for healthy
        run: docker compose up --build --wait --wait-timeout 120

      - name: Run API health check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/healthz)
          [ "$STATUS" = "200" ] || exit 1

      - name: Run tests inside container
        run: docker compose exec -T api go test ./... -v -count=1

      - name: Tear down
        if: always()
        run: docker compose down -v
```

### Key decisions

1. **`mem_limit: 512m` and `cpus: "0.5"`** match production Kubernetes limits, so OOM kills and CPU throttling surface during development.
2. **BuildKit cache mounts** on `/go/pkg/mod` persist Go module downloads across builds, reducing rebuild time when only application code changes.
3. **Air + Delve integration** watches for Go file changes, rebuilds with debug symbols (`-gcflags='all=-N -l'`), and starts the binary under Delve for breakpoint debugging.
4. **CI validation** runs `docker compose up --wait` to catch Compose misconfigurations that work locally but fail in a clean environment.
5. **Separate go-build-cache volume** prevents the bind mount from overwriting the container's build cache, keeping incremental compilation fast.
