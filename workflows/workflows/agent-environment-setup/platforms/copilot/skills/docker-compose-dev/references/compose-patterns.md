# Compose Patterns Reference

## File Organization

### Single Compose File (Simple Projects)

```
project/
  docker-compose.yml    # All services, all environments
  .env                  # Default environment variables
```

### Override Pattern (Recommended)

```
project/
  docker-compose.yml          # Base services (production-like)
  docker-compose.override.yml # Dev overrides (auto-loaded)
  docker-compose.ci.yml       # CI-specific overrides
  .env                        # Shared defaults
  .env.local                  # Developer-specific (gitignored)
```

Docker Compose automatically merges `docker-compose.yml` and `docker-compose.override.yml`. For CI, use explicit file selection:

```bash
docker compose -f docker-compose.yml -f docker-compose.ci.yml up
```

### Extends Pattern (Shared Bases)

```yaml
# docker-compose.base.yml
services:
  node-base:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./:/app

# docker-compose.yml
services:
  frontend:
    extends:
      file: docker-compose.base.yml
      service: node-base
    ports:
      - "3000:3000"
    command: pnpm dev
```

## Profiles

Profiles group optional services that are not needed for every developer session.

```yaml
services:
  # Always starts
  api:
    image: myapp-api
    ports:
      - "8080:8080"

  # Only starts with: docker compose --profile tools up
  pgadmin:
    image: dpage/pgadmin4
    profiles: ["tools"]
    ports:
      - "5050:80"

  # Only starts with: docker compose --profile monitoring up
  prometheus:
    image: prom/prometheus
    profiles: ["monitoring"]
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    profiles: ["monitoring"]
    ports:
      - "3001:3000"
```

### Profile Combinations

```bash
# Core services only
docker compose up

# Core + database tools
docker compose --profile tools up

# Core + monitoring stack
docker compose --profile monitoring up

# Everything
docker compose --profile tools --profile monitoring up
```

## Service Dependencies

### Basic Ordering

```yaml
services:
  api:
    depends_on:
      - postgres
      - redis
```

**Problem:** `depends_on` only waits for the container to start, not for the service inside it to be ready.

### Health-Based Ordering (Recommended)

```yaml
services:
  api:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully
```

### One-Shot Services (Migrations, Seeds)

```yaml
services:
  migrations:
    build: ./backend
    command: python manage.py migrate
    depends_on:
      postgres:
        condition: service_healthy
    # Exits after completion; other services wait for it

  api:
    depends_on:
      migrations:
        condition: service_completed_successfully
```

## Environment Variables

### `.env` File (Defaults)

```env
# .env - tracked in git, contains defaults
POSTGRES_USER=devuser
POSTGRES_DB=devdb
NODE_ENV=development
API_PORT=8000
```

### `.env.local` (Overrides, Gitignored)

```env
# .env.local - personal overrides
POSTGRES_PASSWORD=my-local-password
API_PORT=8001  # Avoid port conflict with another project
```

### Compose Interpolation

```yaml
services:
  api:
    ports:
      - "${API_PORT:-8000}:8000"   # Default to 8000 if not set
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
```

## Multi-Stage Build Integration

```yaml
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: dev           # Select the dev stage
      args:
        - PYTHON_VERSION=3.12
    # Dev stage includes debugger, dev deps, hot-reload tooling
```

### Build Arguments and Secrets

```yaml
services:
  api:
    build:
      context: .
      secrets:
        - npm_token
      args:
        - NODE_ENV=development

secrets:
  npm_token:
    environment: NPM_TOKEN    # Read from host environment
```

## Resource Management

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  # Alternative (Compose v2 shorthand)
  api-v2:
    mem_limit: 512m
    cpus: "0.5"
    memswap_limit: 512m     # Disable swap to match k8s behavior
```

## Init Containers Pattern

Docker Compose does not have native init containers, but the pattern is achievable with `depends_on` and `service_completed_successfully`:

```yaml
services:
  wait-for-deps:
    image: alpine
    command: >
      sh -c "
        echo 'Checking external API...' &&
        wget --spider --timeout=5 https://api.external.com/health &&
        echo 'External API ready'
      "
    networks:
      - app-network

  api:
    depends_on:
      wait-for-deps:
        condition: service_completed_successfully
      postgres:
        condition: service_healthy
```

## Compose Watch (Hot Reload Without Bind Mounts)

Compose Watch is an alternative to bind mounts that syncs files into the container.

```yaml
services:
  frontend:
    build:
      context: ./frontend
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
        - action: rebuild
          path: ./frontend/package.json
```

```bash
docker compose watch    # Starts services with file watching
```

### Watch vs. Bind Mounts

| Feature | Bind Mounts | Compose Watch |
|---------|-------------|---------------|
| macOS performance | Slow for node_modules | Fast (no FS passthrough) |
| Linux performance | Native speed | Slight sync delay |
| Setup complexity | Simple | Requires `develop.watch` config |
| Auto-rebuild | No | Yes, on `action: rebuild` |
