# Example: Full-Stack Development Environment

## Prompt

> Set up a Docker Compose development environment for a full-stack app: React frontend (Vite), Python FastAPI backend, PostgreSQL, and Redis. I need hot reload for both frontend and backend, health checks for infrastructure services, and an optional Mailhog service for email testing.

## Response

### `docker-compose.yml`

```yaml
# Full-stack development environment
# Usage: docker compose up        (core services)
#        docker compose --profile mail up  (with Mailhog)

services:
  frontend:
    build:
      context: ./frontend
      target: dev
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      # Bind mount for hot reload — Vite watches these files
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      # Anonymous volume preserves container's node_modules
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      target: dev
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
      - "5678:5678"  # debugpy port for VS Code debugging
    volumes:
      # Bind mount for hot reload — uvicorn --reload watches these files
      - ./backend/app:/app/app
      - ./backend/tests:/app/tests
    environment:
      - DATABASE_URL=postgresql://devuser:devpass@postgres:5432/devdb
      - REDIS_URL=redis://redis:6379/0
      - SMTP_HOST=mailhog
      - SMTP_PORT=1025
      - DEBUG=true
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
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
      # Named volume persists data across container restarts
      - postgres-data:/var/lib/postgresql/data
      # Seed scripts run on first start
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser -d devdb"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - app-network

  # Optional: email testing (activate with --profile mail)
  mailhog:
    image: mailhog/mailhog:v1.0.1
    profiles: ["mail"]
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI
    networks:
      - app-network

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### `frontend/Dockerfile`

```dockerfile
# --- Development stage ---
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# --- Production stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
```

### `backend/Dockerfile`

```dockerfile
# --- Development stage ---
FROM python:3.12-slim AS dev
WORKDIR /app
RUN pip install --no-cache-dir debugpy
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000 5678
# uvicorn with --reload for hot reload, debugpy for remote debugging
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", \
     "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", \
     "--port", "8000", "--reload"]

# --- Production stage ---
FROM python:3.12-slim AS prod
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Key decisions

1. **`target: dev` in Compose build** selects the development stage with debugging tools and hot-reload configuration.
2. **Anonymous volume for `node_modules`** prevents the host bind mount from overwriting the container's platform-specific dependencies (native modules compiled for Linux).
3. **`depends_on` with `condition: service_healthy`** ensures the backend does not start until PostgreSQL and Redis actually accept connections, eliminating startup race conditions.
4. **Mailhog behind a profile** keeps the default `docker compose up` fast while giving developers email testing when needed via `--profile mail`.
5. **Debugpy on port 5678** enables VS Code "attach to remote" debugging inside the container without rebuilding.
