# Docker Compose Networking Reference

## Default Networking

When no network is specified, Docker Compose creates a default network named `<project>_default`. All services join this network and can reach each other by service name.

```yaml
# Services communicate via service name as hostname
services:
  api:
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/db
      # 'postgres' resolves to the postgres container's IP
  postgres:
    image: postgres:16
```

## Custom Networks

### Single Application Network

```yaml
services:
  frontend:
    networks:
      - app-net
  api:
    networks:
      - app-net
  postgres:
    networks:
      - app-net

networks:
  app-net:
    driver: bridge
```

### Network Segmentation

Isolate services that should not communicate directly.

```yaml
services:
  frontend:
    networks:
      - frontend-net    # Can reach API but not DB

  api:
    networks:
      - frontend-net    # Reachable by frontend
      - backend-net     # Can reach DB and cache

  postgres:
    networks:
      - backend-net     # Only reachable by API

  redis:
    networks:
      - backend-net

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true      # No external access
```

### Network Aliases

Give services additional DNS names for compatibility with production configurations.

```yaml
services:
  postgres:
    networks:
      app-net:
        aliases:
          - db.internal           # Production DNS name
          - postgres.service.local
```

## Port Mapping

### Host Port Mapping

```yaml
services:
  api:
    ports:
      - "8080:8000"       # host:container
      - "127.0.0.1:9090:9090"  # Bind to localhost only (more secure)

  postgres:
    ports:
      - "${DB_PORT:-5432}:5432"  # Configurable host port
```

### When NOT to Expose Ports

Services that are only accessed by other containers do not need port mappings:

```yaml
services:
  redis:
    # No 'ports:' needed — other containers reach it via redis:6379
    # Only add ports if you need host access (e.g., redis-cli from host)
    expose:
      - "6379"    # Informational only; does not create a mapping
```

## DNS Resolution

### How It Works

1. Docker's embedded DNS server runs at `127.0.0.11` inside each container.
2. Service names resolve to the container's IP on the shared network.
3. If a service has multiple replicas, DNS returns all IPs (round-robin).

### Debugging DNS

```bash
# From inside a container
docker compose exec api nslookup postgres
docker compose exec api ping redis
docker compose exec api curl http://frontend:3000/

# Check container's DNS config
docker compose exec api cat /etc/resolv.conf
```

### DNS Caching Caveats

Some language runtimes (Java, Go) cache DNS results. When a container restarts and gets a new IP, cached DNS may point to the old IP.

| Language | Default Cache | Fix |
|----------|--------------|-----|
| Java | 30 seconds | `-Dnetworkaddress.cache.ttl=5` |
| Go | No caching | N/A (resolves on every dial) |
| Node.js | No caching | N/A (uses OS resolver) |
| Python | No caching | N/A (uses OS resolver) |

## Cross-Compose Communication

### Connecting to External Networks

When multiple Compose projects need to communicate (e.g., a shared database project):

```yaml
# Project A: shared-infra/docker-compose.yml
services:
  postgres:
    image: postgres:16
    networks:
      - shared

networks:
  shared:
    name: shared-infra    # Explicit name for external reference
```

```yaml
# Project B: my-app/docker-compose.yml
services:
  api:
    networks:
      - shared

networks:
  shared:
    external: true
    name: shared-infra    # Reference the network from Project A
```

## Load Balancing

### Built-In DNS Round-Robin

```yaml
services:
  api:
    image: myapp-api
    deploy:
      replicas: 3
    # DNS for 'api' returns 3 IPs; clients round-robin

  nginx:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - api
```

### NGINX Reverse Proxy

```nginx
# nginx.conf
upstream api_backend {
    server api:8000;    # Docker DNS resolves all replicas
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://api_backend;
    }
}
```

## Troubleshooting

### Common Network Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Connection refused` | Service not ready yet | Add health check + `depends_on` condition |
| `Name resolution failure` | Services on different networks | Ensure both services share a network |
| `Connection timeout` | Firewall or wrong port | Check `expose` vs. `ports`; verify container port |
| Port already in use | Another container or host process | Change host port mapping or stop conflicting process |
| Slow DNS on macOS | Docker Desktop DNS forwarding | Use `dns: 8.8.8.8` as fallback |

### Network Inspection

```bash
# List networks
docker network ls

# Inspect a network (see connected containers and IPs)
docker network inspect myproject_app-net

# Test connectivity from one container to another
docker compose exec api wget -qO- http://postgres:5432 || echo "no HTTP, but TCP might work"
docker compose exec api nc -zv postgres 5432
```
