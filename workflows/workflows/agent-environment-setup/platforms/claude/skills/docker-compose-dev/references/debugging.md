# Docker Compose Debugging Reference

## Container Lifecycle Debugging

### Checking Container Status

```bash
# Overview of all services and their status
docker compose ps

# Detailed status including exit codes
docker compose ps -a

# Watch containers in real time
watch docker compose ps
```

### Startup Failure Diagnosis

When a container exits immediately after starting:

```bash
# View the exit code
docker compose ps -a
# Exit code 0: command completed (expected for one-shot services)
# Exit code 1: application error
# Exit code 137: OOM killed (out of memory)
# Exit code 139: segfault
# Exit code 143: SIGTERM (graceful shutdown)

# View the last 100 log lines for the failing service
docker compose logs --tail=100 api

# Start with foreground output to see startup errors live
docker compose up api
```

### Common Startup Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Exits immediately with code 1 | Application error | Check logs; fix app code |
| Exits with code 137 | OOM kill | Increase `mem_limit` or fix memory leak |
| Restarts in a loop | Crash + restart policy | Set `restart: "no"` temporarily to read logs |
| "Port already allocated" | Host port conflict | Change host port or stop conflicting process |
| "No such file or directory" | Missing bind mount path | Create the directory on host first |
| "Permission denied" | UID mismatch on bind mount | Set `user:` in Compose to match host UID |

## Log Management

### Viewing Logs

```bash
# All services
docker compose logs

# Specific service with follow and timestamps
docker compose logs -f --timestamps api

# Last 50 lines of multiple services
docker compose logs --tail=50 api postgres redis

# Filter logs by time
docker compose logs --since="2024-01-15T10:00:00" api
```

### Log Drivers

```yaml
services:
  api:
    logging:
      driver: json-file       # Default; works with docker compose logs
      options:
        max-size: "10m"       # Rotate at 10MB
        max-file: "3"         # Keep 3 rotated files

  # For structured logging to a local aggregator
  api-structured:
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: api.{{.Name}}
```

## Remote Debugging

### Node.js (V8 Inspector)

```yaml
services:
  api:
    command: node --inspect=0.0.0.0:9229 src/index.js
    ports:
      - "9229:9229"    # Chrome DevTools / VS Code debugger
```

VS Code `launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/src",
  "remoteRoot": "/app/src",
  "restart": true
}
```

### Python (debugpy)

```yaml
services:
  api:
    command: >
      python -m debugpy --listen 0.0.0.0:5678
      -m uvicorn app.main:app --host 0.0.0.0 --reload
    ports:
      - "5678:5678"
```

VS Code `launch.json`:

```json
{
  "type": "debugpy",
  "request": "attach",
  "name": "Docker: Attach to Python",
  "connect": { "host": "localhost", "port": 5678 },
  "pathMappings": [{
    "localRoot": "${workspaceFolder}/backend",
    "remoteRoot": "/app"
  }]
}
```

### Go (Delve)

```yaml
services:
  api:
    command: >
      dlv exec --headless --listen=:2345
      --api-version=2 --accept-multiclient /app/server
    ports:
      - "2345:2345"
    security_opt:
      - "seccomp:unconfined"    # Required for Delve ptrace
    cap_add:
      - SYS_PTRACE              # Required for Delve
```

VS Code `launch.json`:

```json
{
  "type": "go",
  "request": "attach",
  "name": "Docker: Attach to Go",
  "mode": "remote",
  "remotePath": "/app",
  "port": 2345,
  "host": "127.0.0.1"
}
```

### Java (JDWP)

```yaml
services:
  api:
    environment:
      JAVA_TOOL_OPTIONS: >
        -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005
    ports:
      - "5005:5005"
```

## Interactive Shell Access

```bash
# Open a shell in a running container
docker compose exec api sh         # Alpine (no bash)
docker compose exec api bash       # Debian/Ubuntu
docker compose exec api /bin/zsh   # If zsh is installed

# Run as root (even if USER is set in Dockerfile)
docker compose exec -u root api bash

# Open a shell in a stopped container
docker compose run --rm api sh
```

## Network Debugging

```bash
# Check DNS resolution from inside a container
docker compose exec api nslookup postgres
docker compose exec api getent hosts postgres

# Test TCP connectivity
docker compose exec api nc -zv postgres 5432
docker compose exec api nc -zv redis 6379

# Full network diagnostic (install if needed)
docker compose exec api apt-get update && apt-get install -y iputils-ping curl dnsutils
docker compose exec api ping -c 3 postgres
docker compose exec api curl -v http://frontend:3000/

# Inspect Docker network
docker network inspect $(docker compose config --format json | jq -r '.networks | keys[0]')
```

## Resource Monitoring

```bash
# Real-time resource usage per container
docker stats

# Resource usage for Compose services
docker compose top

# Check if a container was OOM-killed
docker inspect $(docker compose ps -q api) --format='{{.State.OOMKilled}}'

# Disk usage by volumes
docker system df -v
```

## Health Check Debugging

```bash
# View health check status and history
docker inspect $(docker compose ps -q postgres) \
  --format='{{json .State.Health}}' | jq .

# Manually run the health check command
docker compose exec postgres pg_isready -U devuser -d devdb

# View health check logs (last 5 results)
docker inspect $(docker compose ps -q postgres) \
  --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

## Build Debugging

```bash
# Build with full output (no cache)
docker compose build --no-cache --progress=plain api

# Build a specific stage
docker compose build --build-arg BUILDKIT_INLINE_CACHE=1 api

# Inspect the build context (what files are sent to Docker daemon)
docker compose config --format json | jq '.services.api.build'

# Check .dockerignore effectiveness
tar -czf - -C ./backend . | wc -c   # Size of build context
```

## Common Debug Workflows

### "The Container Keeps Restarting"

1. Set `restart: "no"` temporarily in Compose.
2. Run `docker compose up api` to see output directly.
3. Check exit code with `docker compose ps -a`.
4. Read logs with `docker compose logs api`.
5. Fix the issue, restore restart policy.

### "The App Cannot Connect to the Database"

1. Verify both services are on the same network: `docker compose config | grep networks`.
2. Check the database is healthy: `docker compose ps postgres`.
3. Test connectivity: `docker compose exec api nc -zv postgres 5432`.
4. Verify connection string uses the service name, not `localhost`.
5. Check the database has finished initialization: `docker compose logs postgres`.

### "Hot Reload Is Not Working"

1. Verify the bind mount exists: `docker compose exec api ls -la /app/src`.
2. Check inotify (Linux): `docker compose exec api cat /proc/sys/fs/inotify/max_user_watches`.
3. Check polling mode is enabled (required on macOS for some tools).
4. Verify the dev server is running with `--watch` or `--reload` flag.
5. Check that `node_modules` anonymous volume is not shadowing the bind mount.
