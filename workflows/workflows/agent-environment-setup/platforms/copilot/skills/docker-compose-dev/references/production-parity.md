# Production Parity Reference

## The Twelve-Factor App: Dev/Prod Parity

The goal is to minimize three gaps between development and production:

| Gap | Problem | Solution |
|-----|---------|----------|
| **Time gap** | Days between code write and deploy | CI/CD with automatic staging deploys |
| **Personnel gap** | Different people write and deploy | Developers own their deployments |
| **Tools gap** | Different software in dev vs. prod | Same backing services via Docker |

## Multi-Stage Dockerfiles

A single Dockerfile that produces both development and production images.

```dockerfile
# syntax=docker/dockerfile:1

# ============================================
# Base: shared dependencies
# ============================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable

# ============================================
# Development: includes dev deps, debugger, hot reload
# ============================================
FROM base AS dev
RUN pnpm install                          # All deps including devDependencies
COPY . .
EXPOSE 3000 9229
CMD ["pnpm", "dev"]

# ============================================
# Build: compile production assets
# ============================================
FROM base AS build
RUN pnpm install --frozen-lockfile --prod=false   # Need devDeps for build
COPY . .
RUN pnpm build

# ============================================
# Production: minimal runtime image
# ============================================
FROM node:20-alpine AS prod
WORKDIR /app
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod          # Production deps only
COPY --from=build /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

### Compose Target Selection

```yaml
services:
  api:
    build:
      context: .
      target: dev        # Development stage with hot reload

  # For local production testing:
  api-prod:
    build:
      context: .
      target: prod       # Production stage for parity testing
    profiles: ["prod-test"]
```

## Resource Limits

Match development resource limits to production Kubernetes pod limits.

### Kubernetes Pod Spec

```yaml
# production/deployment.yaml
resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m
```

### Equivalent Compose Configuration

```yaml
# docker-compose.yml
services:
  api:
    mem_limit: 512m        # Match k8s limits.memory
    cpus: "0.5"            # Match k8s limits.cpu
    memswap_limit: 512m    # Disable swap (k8s doesn't use swap)
    mem_reservation: 256m  # Match k8s requests.memory
```

### Why Resource Limits Matter in Dev

| Without Limits | With Limits |
|---------------|-------------|
| App uses 2GB RAM in dev, OOM-killed in prod | OOM surfaces during development |
| Tests pass with 4 CPUs, timeout with 0.5 CPU | Timeouts caught before deploy |
| Memory leak invisible locally | Leak detected within hours of development |

## Backing Service Parity

### Database Version Matching

```yaml
services:
  # Match the exact production version
  postgres:
    image: postgres:16.2-alpine    # Not postgres:latest
    environment:
      # Match production configuration
      POSTGRES_INITDB_ARGS: "--data-checksums"
    command: >
      postgres
        -c shared_preload_libraries=pg_stat_statements
        -c max_connections=100
        -c shared_buffers=256MB
```

### Redis Version Matching

```yaml
services:
  redis:
    image: redis:7.2-alpine
    command: >
      redis-server
        --maxmemory 256mb
        --maxmemory-policy allkeys-lru
        --save ""
```

### Service Version Matrix

| Service | Dev | Prod | Why Match |
|---------|-----|------|-----------|
| PostgreSQL | 16.2 | 16.2 | SQL syntax, extensions, behavior |
| Redis | 7.2 | 7.2 | Command compatibility, Lua scripts |
| Elasticsearch | 8.12 | 8.12 | Query DSL, mapping behavior |
| RabbitMQ | 3.13 | 3.13 | Plugin compatibility, protocol |

## Configuration Parity

### Environment Variables

```yaml
services:
  api:
    environment:
      # Same variable names as production
      DATABASE_URL: postgresql://user:pass@postgres:5432/db
      REDIS_URL: redis://redis:6379/0
      LOG_LEVEL: debug                    # Different value, same variable
      LOG_FORMAT: json                    # Same format as production
      FEATURE_FLAG_NEW_CHECKOUT: "true"   # Test feature flags locally
```

### Health Check Parity

Production health checks should work identically in development:

```yaml
services:
  api:
    healthcheck:
      # Same health check endpoint and logic as production k8s probes
      test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
```

## CI Validation

Test the Compose configuration in CI to catch environment drift.

### Basic Smoke Test

```yaml
# .github/workflows/compose-test.yml
name: Compose Validation
on:
  pull_request:
    paths:
      - "docker-compose*.yml"
      - "Dockerfile*"
      - ".env*"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate Compose file
        run: docker compose config --quiet

      - name: Build all images
        run: docker compose build

      - name: Start services and wait for healthy
        run: docker compose up --wait --wait-timeout 120

      - name: Verify service health
        run: |
          docker compose ps --format json | jq -e '.[] | select(.Health != "healthy") | empty'

      - name: Run integration tests
        run: docker compose exec -T api npm test

      - name: Cleanup
        if: always()
        run: docker compose down -v --remove-orphans
```

### Testing Prod Stage in CI

```yaml
  test-prod-image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build production image
        run: docker build --target prod -t myapp:test .
      - name: Run production image
        run: |
          docker run -d --name test-prod \
            -p 8080:8080 \
            -e DATABASE_URL=postgresql://... \
            myapp:test
          sleep 5
          curl -f http://localhost:8080/healthz
```

## Known Dev/Prod Differences (Acceptable)

Not all differences can or should be eliminated:

| Difference | Dev | Prod | Why Acceptable |
|-----------|-----|------|----------------|
| TLS | HTTP (no certs) | HTTPS (TLS termination) | TLS adds setup complexity; test TLS in staging |
| DNS | Docker DNS (service names) | Cloud DNS / service mesh | Container names match service names |
| Replicas | 1 per service | 3+ per service | Single-instance tests catch most bugs |
| External services | Mocked or local | Real third-party APIs | External dependencies are flaky in CI |
| Auth | Simplified tokens | Full OAuth flow | Auth is tested separately in integration tests |

## Parity Checklist

Use this checklist when reviewing a Compose configuration for production parity:

| Check | Question |
|-------|----------|
| Image versions | Do all service images match production versions exactly? |
| Resource limits | Do `mem_limit` and `cpus` match production pod limits? |
| Environment vars | Do environment variable names match production? |
| Health checks | Do health check endpoints match production probe paths? |
| Networking | Do services communicate by DNS name (not localhost)? |
| Log format | Does the application output structured JSON logs? |
| Build stages | Does the Dockerfile have separate dev and prod targets? |
| Startup order | Do `depends_on` conditions match production startup requirements? |
