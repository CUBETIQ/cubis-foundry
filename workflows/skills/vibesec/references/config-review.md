# Configuration Review Reference

## Overview

Security misconfigurations are consistently in the OWASP Top 10 because they are common, easy to exploit, and often invisible to developers. This reference covers security review patterns for common configuration files.

## Environment Files

### .env / .env.local / .env.production

| Check | Red Flag | Fix |
|-------|----------|-----|
| Committed to git | `.env` in repo | Add to `.gitignore`, rotate all secrets |
| Plaintext secrets | `DB_PASSWORD=actual_password` | Use secrets manager, reference by name |
| Debug mode | `DEBUG=true`, `NODE_ENV=development` | Ensure production values in deployment |
| Verbose logging | `LOG_LEVEL=debug` | Set to `warn` or `error` in production |
| Wildcard origins | `CORS_ORIGIN=*` | Specify allowed origins explicitly |

### .env.example Pattern

```bash
# GOOD — clearly fake values
DATABASE_URL=postgresql://user:CHANGE_ME@localhost:5432/mydb
STRIPE_API_KEY=sk_test_REPLACE_WITH_YOUR_KEY
JWT_SECRET=GENERATE_A_RANDOM_STRING_HERE

# BAD — looks like real credentials
DATABASE_URL=postgresql://admin:xK9m2pLq@db.internal:5432/prod
STRIPE_API_KEY=sk_test_51ABC123DEF456GHI789
JWT_SECRET=a7b3c9d1e5f2g8h4
```

## Docker Configuration

### docker-compose.yml

| Check | Red Flag | Fix |
|-------|----------|-----|
| Secrets in environment | `PASSWORD: actual_value` | Use Docker secrets or external file |
| Port exposure | `ports: "0.0.0.0:5432:5432"` | Bind to localhost: `"127.0.0.1:5432:5432"` |
| Privileged mode | `privileged: true` | Remove unless absolutely required |
| Root user | No `user:` directive | Add `user: "1000:1000"` |
| Latest tag | `image: nginx:latest` | Pin to specific version |
| No resource limits | Missing `deploy.resources` | Set CPU and memory limits |
| Host network | `network_mode: host` | Use bridge networking |

### Dockerfile

```dockerfile
# GOOD
FROM node:20-alpine@sha256:abc123...
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --chown=appuser:appgroup . .
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1

# BAD
FROM node:latest
COPY . .
RUN npm install
EXPOSE 3000 22 5432
CMD ["node", "server.js"]
```

| Dockerfile Check | Red Flag | Fix |
|-----------------|----------|-----|
| Base image | `FROM *:latest` | Pin version and digest |
| Running as root | No `USER` directive | Add non-root user |
| Unnecessary ports | Multiple EXPOSE | Only expose application port |
| COPY secrets | `COPY .env .` | Use .dockerignore, mount at runtime |
| Build secrets | `ARG PASSWORD` | Use BuildKit secrets |
| No healthcheck | Missing HEALTHCHECK | Add health check |

## Nginx Configuration

```nginx
# Security-hardened nginx.conf
server {
    listen 443 ssl http2;
    server_name example.com;

    # TLS
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Disable information disclosure
    server_tokens off;

    # Prevent access to hidden files
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

| Nginx Check | Red Flag | Fix |
|-------------|----------|-----|
| server_tokens | `on` (default) | `server_tokens off;` |
| SSL protocols | TLSv1, TLSv1.1 | Only TLSv1.2, TLSv1.3 |
| Hidden files | No block for `/.` | Deny access to dotfiles |
| Directory listing | `autoindex on` | `autoindex off` |
| Large body | No `client_max_body_size` | Set appropriate limit |
| Missing headers | No security headers | Add all security headers |

## Cloud IAM Configuration

### AWS

| Check | Red Flag | Fix |
|-------|----------|-----|
| Root account usage | Root user has access keys | Delete root access keys, use IAM users |
| Wildcard permissions | `"Action": "*"` | Use least-privilege policies |
| Public S3 buckets | `PublicRead` or `PublicReadWrite` | Block public access at account level |
| No MFA | IAM users without MFA | Enforce MFA for all console users |
| Long-lived credentials | Access keys > 90 days | Rotate or migrate to IAM roles |
| Cross-account | Overly permissive trust policies | Restrict to specific accounts and roles |

### Kubernetes

| Check | Red Flag | Fix |
|-------|----------|-----|
| Default namespace | Workloads in `default` | Use dedicated namespaces |
| No network policies | All pods can communicate | Implement network policies |
| Privileged pods | `securityContext.privileged: true` | Remove or justify |
| No resource limits | Missing limits/requests | Set CPU and memory limits |
| Host path mounts | `hostPath` volumes | Use PVCs instead |
| Service account tokens | Auto-mounted when not needed | `automountServiceAccountToken: false` |

## Database Configuration

| Check | Red Flag | Fix |
|-------|----------|-----|
| Default port | PostgreSQL on 5432, MySQL on 3306 | Consider non-standard port (defense in depth) |
| Public access | Listening on 0.0.0.0 | Bind to private interface |
| Default credentials | Default admin password | Change immediately |
| No encryption at rest | Unencrypted data files | Enable encryption |
| No SSL connections | `sslmode=disable` | `sslmode=require` or `verify-full` |
| Overly permissive roles | Application user has SUPERUSER | Grant only needed privileges |
| No query logging | Audit logging disabled | Enable for security events |

## Configuration Audit Checklist

- [ ] No secrets in version control
- [ ] Debug/development modes disabled in production
- [ ] All communication encrypted (TLS 1.2+)
- [ ] Security headers configured
- [ ] Default credentials changed
- [ ] Unnecessary services/ports disabled
- [ ] Least-privilege access policies
- [ ] Logging and monitoring enabled
- [ ] Resource limits set (prevent DoS)
- [ ] Backup encryption enabled
