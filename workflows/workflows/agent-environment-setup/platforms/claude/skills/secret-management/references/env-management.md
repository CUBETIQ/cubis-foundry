# Environment Management Reference

## Overview

Environment management covers how secrets and configuration are injected into applications at runtime across development, staging, and production environments. The goal is to keep secrets out of code, images, and version control while making them available to running services reliably.

## Environment Configuration Hierarchy

```
Priority (highest to lowest):
  1. Runtime injection (vault sidecar, secrets manager)
  2. Environment variables (set by orchestrator)
  3. Mounted secret files (volume mounts)
  4. Application config files (env-specific)
  5. Default values (non-sensitive only)
```

## Environment Variable Patterns

### Direct Environment Variables

```yaml
# Kubernetes Deployment — environment variables from Secrets
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: web-app
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: log_level
```

### File-Based Injection

```yaml
# Kubernetes — mount secrets as files
spec:
  containers:
    - name: web-app
      volumeMounts:
        - name: db-creds
          mountPath: /etc/secrets/db
          readOnly: true
  volumes:
    - name: db-creds
      secret:
        secretName: db-credentials
        items:
          - key: username
            path: username
          - key: password
            path: password
```

Application reads:
```python
DB_USER = open('/etc/secrets/db/username').read().strip()
DB_PASS = open('/etc/secrets/db/password').read().strip()
```

### Docker Compose

```yaml
# docker-compose.yml — development environment
services:
  web:
    build: .
    env_file:
      - .env.local  # Local overrides (gitignored)
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt  # gitignored
```

## Multi-Environment Strategy

### Environment Separation

| Environment | Secret Source | Access Control | Purpose |
|-------------|-------------|----------------|---------|
| Development | `.env.local` (local) | Developer only | Local development |
| CI/CD | CI secret variables | Pipeline only | Automated testing |
| Staging | Secrets Manager / Vault | Staging namespace | Pre-production testing |
| Production | Secrets Manager / Vault | Production namespace | Live traffic |

### Configuration per Environment

```
config/
├── default.json          # Non-sensitive defaults (all environments)
├── development.json      # Dev-specific non-sensitive config
├── staging.json          # Staging-specific non-sensitive config
├── production.json       # Production-specific non-sensitive config
└── custom-environment-variables.json  # Maps env vars to config keys
```

```json
// custom-environment-variables.json
{
  "database": {
    "host": "DB_HOST",
    "port": "DB_PORT",
    "username": "DB_USERNAME",
    "password": "DB_PASSWORD"
  },
  "redis": {
    "url": "REDIS_URL"
  },
  "jwt": {
    "secret": "JWT_SECRET"
  }
}
```

## Platform-Specific Patterns

### AWS ECS / Fargate

```json
// Task definition — secrets from Secrets Manager
{
  "containerDefinitions": [{
    "name": "web-app",
    "secrets": [
      {
        "name": "DATABASE_URL",
        "valueFrom": "arn:aws:secretsmanager:us-east-1:123456:secret:prod/db-url"
      },
      {
        "name": "API_KEY",
        "valueFrom": "arn:aws:secretsmanager:us-east-1:123456:secret:prod/api-key"
      }
    ],
    "environment": [
      {
        "name": "NODE_ENV",
        "value": "production"
      }
    ]
  }]
}
```

### Vercel

```bash
# Set environment variables per environment
vercel env add DATABASE_URL production < db-url.txt
vercel env add DATABASE_URL preview < staging-db-url.txt

# Pull environment for local development
vercel env pull .env.local
```

### Railway / Fly.io / Render

```bash
# Railway
railway variables set DATABASE_URL="postgresql://..."

# Fly.io
fly secrets set DATABASE_URL="postgresql://..."

# Render — set via dashboard or YAML
# render.yaml
envVars:
  - key: DATABASE_URL
    sync: false  # Set via dashboard
  - key: NODE_ENV
    value: production
```

## Secret Injection at Build vs. Runtime

| Approach | When | Risk | Recommendation |
|----------|------|------|----------------|
| Build-time ARG | Docker build | Secret persists in image layer | Avoid for secrets |
| Build-time ENV | Docker build | Secret in image metadata | Never use |
| Runtime ENV | Container start | Secret in process environment | Acceptable |
| Runtime file mount | Container start | Secret in filesystem | Good (with tmpfs) |
| Vault sidecar | Container start + refresh | Secret refreshed automatically | Best |

### BuildKit Secrets (for build-time secrets)

```dockerfile
# Dockerfile — secret never stored in layer
RUN --mount=type=secret,id=npm_token \
  NPM_TOKEN=$(cat /run/secrets/npm_token) npm ci

# Build command
docker buildx build --secret id=npm_token,src=.npmrc .
```

## .env File Best Practices

### .gitignore

```gitignore
# Environment files with secrets
.env
.env.local
.env.*.local
.env.production
.env.staging

# Allow example file (no real secrets)
!.env.example
```

### .env.example Template

```bash
# .env.example — use obviously fake values
# Copy to .env.local and fill in real values

# Database
DATABASE_URL=postgresql://user:CHANGE_ME@localhost:5432/mydb

# Authentication
JWT_SECRET=GENERATE_WITH_openssl_rand_hex_32
SESSION_SECRET=GENERATE_WITH_openssl_rand_hex_32

# Third-party APIs
STRIPE_API_KEY=sk_test_REPLACE_ME
SENDGRID_API_KEY=SG.REPLACE_ME

# Application
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
```

## Validation Pattern

```javascript
// Validate all required environment variables at startup
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

## Environment Variable Security

| Risk | Mitigation |
|------|-----------|
| Env vars visible in `docker inspect` | Use file mounts or vault sidecar |
| Env vars in process listing (`/proc/*/environ`) | Restrict container access, use non-root |
| Env vars logged by frameworks | Configure logging to redact known secret keys |
| Env vars in crash dumps | Strip sensitive vars from error reporting |
| Child processes inherit env vars | Only set what each process needs |
