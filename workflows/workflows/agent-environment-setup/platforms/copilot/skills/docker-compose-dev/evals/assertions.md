# Docker Compose Dev Eval Assertions

## Eval 1: Multi-Service Dev Environment

This eval tests the core Docker Compose skill: designing a multi-service development environment with hot reload, health checks, networking, and optional tooling profiles.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `volumes:` — Bind mount configuration           | Bind mounts map host source code into containers, enabling hot reload. Without them, every code change requires a full container rebuild. |
| 2 | contains | `healthcheck:` — Service health checks          | Health checks for PostgreSQL and Redis ensure dependent services wait for actual readiness, not just port availability. Race conditions cause intermittent startup failures. |
| 3 | contains | `networks:` — Custom network definition         | Custom networks enable service-to-service communication by name via Docker DNS. Default bridge networking requires hardcoded IPs that break across environments. |
| 4 | contains | `profiles:` — Compose profile usage             | Profiles let developers opt into optional services (pgAdmin) without starting them by default. This saves resources and reduces startup time for daily development. |
| 5 | contains | `depends_on:` — Service dependency ordering     | `depends_on` with health check conditions prevents application containers from starting before their database and cache dependencies are ready. |

### What a passing response looks like

- A `docker-compose.yml` with four always-on services: `frontend`, `backend`, `postgres`, `redis`.
- Bind mount volumes mapping `./frontend` to the Next.js container and `./backend` to the FastAPI container.
- PostgreSQL health check using `pg_isready` and Redis health check using `redis-cli ping`.
- A custom network (`app-network`) attached to all services.
- `depends_on` with `condition: service_healthy` for frontend and backend depending on postgres and redis.
- pgAdmin service with `profiles: ["tools"]` so it only starts with `docker compose --profile tools up`.
- Port mappings: 3000 for frontend, 8000 for backend, 5432 for PostgreSQL.

---

## Eval 2: Production-Parity Configuration

This eval tests the advanced Docker Compose skill: minimizing dev/prod drift with multi-stage builds, resource constraints, debugger support, and CI validation.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `AS dev` — Named build stage for development    | Multi-stage Dockerfiles with named stages let Compose target the dev stage (with debugger, dev deps) while production uses the final stage. One Dockerfile, two purposes. |
| 2 | contains | `mem_limit` — Memory resource constraint        | Matching production memory limits in dev catches OOM behaviors during development instead of discovering them after deployment to resource-constrained pods. |
| 3 | contains | `2345` — Delve debugger port                    | Exposing the Delve debugger port enables IDE-attached debugging inside containers, preserving the breakpoint-driven workflow developers expect from local development. |
| 4 | contains | `cache` — BuildKit cache mount                  | Go module cache mounts persist across builds, reducing rebuild time from minutes to seconds when only application code changes. Without caching, every build re-downloads all modules. |
| 5 | contains | `target:` — Build target selection              | The Compose `build.target` field selects the dev stage from the multi-stage Dockerfile. Without it, Docker builds the final (production) stage, which lacks dev tools. |

### What a passing response looks like

- A multi-stage Dockerfile with `FROM golang:1.22 AS dev` and `FROM gcr.io/distroless/static AS production` stages.
- Dev stage installs Delve (`go install github.com/go-delve/delve/cmd/dlv@latest`) and runs with `dlv exec`.
- BuildKit cache mount: `RUN --mount=type=cache,target=/go/pkg/mod go mod download`.
- Compose file with `build: { context: ., target: dev }` for the API service.
- `mem_limit: 512m` and `cpus: "0.5"` on the API service matching production Kubernetes limits.
- Port 2345 exposed for Delve debugger attachment.
- A CI job example: `docker compose up --wait && docker compose exec api go test ./... && docker compose down`.
