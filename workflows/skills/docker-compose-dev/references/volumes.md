# Docker Volumes Reference

## Volume Types

### Bind Mounts

Map a host directory directly into the container. Changes are immediately visible in both directions.

```yaml
services:
  api:
    volumes:
      # Absolute path
      - /home/user/project/src:/app/src

      # Relative path (relative to Compose file)
      - ./src:/app/src

      # Read-only mount (container cannot modify host files)
      - ./config:/app/config:ro
```

**When to use:** Source code hot-reload, configuration files, seed data.

### Named Volumes

Docker-managed storage that persists across container restarts and rebuilds.

```yaml
services:
  postgres:
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:             # Docker manages the storage location
    driver: local
```

**When to use:** Database data, persistent caches, package manager stores.

### Anonymous Volumes

Unnamed volumes created inline. Useful for excluding container directories from bind mounts.

```yaml
services:
  frontend:
    volumes:
      - ./src:/app/src         # Bind mount for hot reload
      - /app/node_modules      # Anonymous volume: preserves container's node_modules
```

**Why this pattern exists:** When bind-mounting `./` into `/app`, the host's `node_modules` (or absence of it) overwrites the container's `node_modules`. The anonymous volume tells Docker to preserve the container's `/app/node_modules` even though the parent `/app` is bind-mounted.

### tmpfs Mounts

In-memory filesystem. Fast, but data is lost when the container stops.

```yaml
services:
  api:
    tmpfs:
      - /tmp:size=100M
      - /app/.cache:size=200M
```

**When to use:** Temporary files, test artifacts, write-heavy operations where persistence is not needed.

## Performance Optimization

### macOS File System Performance

Docker Desktop on macOS uses a virtualization layer that makes bind mounts 10-50x slower than native Linux.

| Strategy | Speedup | Trade-off |
|----------|---------|-----------|
| `:cached` flag (deprecated) | Minimal | No longer effective in modern Docker Desktop |
| VirtioFS (default in DD 4.x) | 2-5x vs. osxfs | May still be slow for node_modules |
| Named volume for deps | 10-50x for installs | deps not visible on host |
| Compose Watch | Fast sync without FS passthrough | Requires config |
| Mutagen | Near-native speed | Additional tool to manage |

### Named Volume for Dependencies

```yaml
services:
  frontend:
    volumes:
      - ./src:/app/src                    # Bind mount: hot reload
      - ./public:/app/public              # Bind mount: static assets
      - frontend-node-modules:/app/node_modules  # Named volume: fast I/O
    environment:
      # Tell the build tool where to find modules
      NODE_PATH: /app/node_modules

volumes:
  frontend-node-modules:
```

**Caveat:** After updating `package.json`, you must rebuild or run install inside the container:

```bash
docker compose exec frontend pnpm install
# Or rebuild the entire service:
docker compose up --build frontend
```

## BuildKit Cache Mounts

Cache mounts persist data across Docker builds without including it in the image layer.

```dockerfile
# syntax=docker/dockerfile:1

# Cache the pnpm store across builds
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Cache Go modules
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o /server ./cmd/server

# Cache pip downloads
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Cache apt downloads
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update && apt-get install -y curl
```

### Enabling BuildKit

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      # BuildKit is enabled by default in Docker Compose v2
```

Or via environment variable:

```bash
export DOCKER_BUILDKIT=1
docker compose build
```

## Permission Issues

### Linux File Ownership

On Linux, files created inside the container are owned by the container's user (often root). This creates permission conflicts with the host user.

```dockerfile
# Fix: Create a user with the same UID as the host user
ARG UID=1000
ARG GID=1000
RUN groupadd -g $GID appuser && \
    useradd -m -u $UID -g $GID appuser
USER appuser
```

```yaml
# docker-compose.yml
services:
  api:
    build:
      args:
        UID: ${UID:-1000}
        GID: ${GID:-1000}
    user: "${UID:-1000}:${GID:-1000}"
```

### Volume Permission Patterns

| Problem | Solution |
|---------|----------|
| Container creates files as root | Set `user:` in Compose or `USER` in Dockerfile |
| Named volume owned by root | Use init container to `chown` the volume |
| Database volume permission denied | Let the database image's entrypoint handle permissions |
| Read-only bind mount | Use `:ro` flag; write to a separate volume |

## Volume Lifecycle

### Persistence

```bash
# Named volumes survive container removal
docker compose down           # Stops and removes containers, keeps volumes
docker compose down -v        # Stops containers AND removes named volumes
docker compose down --volumes # Same as -v
```

### Backup and Restore

```bash
# Backup a named volume
docker run --rm \
  -v myproject_pgdata:/data:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/pgdata-backup.tar.gz -C /data .

# Restore a named volume
docker run --rm \
  -v myproject_pgdata:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/pgdata-backup.tar.gz -C /data
```

### Cleanup

```bash
# Remove all unused volumes (not attached to any container)
docker volume prune

# List volumes
docker volume ls

# Inspect a specific volume
docker volume inspect myproject_pgdata
```

## Volume Patterns Summary

| Pattern | Use Case | Configuration |
|---------|----------|---------------|
| Bind mount for source | Hot reload | `./src:/app/src` |
| Anonymous volume for deps | Preserve container deps | `/app/node_modules` |
| Named volume for data | Database persistence | `pgdata:/var/lib/postgresql/data` |
| Named volume for deps | macOS performance | `node-modules:/app/node_modules` |
| Cache mount for builds | Faster Docker builds | `RUN --mount=type=cache,...` |
| tmpfs for temp files | Fast ephemeral storage | `tmpfs: /tmp` |
| Read-only bind mount | Config files | `./nginx.conf:/etc/nginx.conf:ro` |
