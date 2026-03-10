# Dockerfile Optimization Checklist

## Multi-stage builds

- Stage 1 (builder): install build tools, compile, bundle.
- Stage 2 (runtime): copy only artifacts needed to run.
- Name stages explicitly: `FROM node:22-slim AS builder`.
- Copy from named stages: `COPY --from=builder /app/dist ./dist`.

## Layer caching

- `COPY package.json package-lock.json ./` then `RUN npm ci` BEFORE `COPY . .`.
- Group related `RUN` commands with `&&` to reduce layers.
- Never invalidate cache unnecessarily — file order matters.

## Image size

- Prefer `distroless` or `alpine` base images for production.
- Remove build caches in the same RUN step: `RUN apt-get install -y ... && rm -rf /var/lib/apt/lists/*`.
- Use `--mount=type=cache` for package manager caches in BuildKit.
- Avoid installing dev dependencies in the runtime stage.

## Security

- Pin base images to digest: `FROM node:22-slim@sha256:abc123...`.
- Run `npm ci --omit=dev` for production Node.js images.
- Scan with `trivy`, `grype`, or `docker scout` in CI before push.
- Never use `ADD` for remote URLs — use explicit `curl` + verify checksum.
- Set `USER 1000` or named non-root user as the last instruction before CMD.

## Health and signals

- Use `STOPSIGNAL SIGTERM` — ensure the app handles graceful shutdown.
- Avoid `ENTRYPOINT ["sh", "-c", "..."]` — PID 1 must be the app process (use `exec` form or `tini`).
- Define `HEALTHCHECK` in Dockerfile for standalone Docker, but prefer Kubernetes probes in K8s.
