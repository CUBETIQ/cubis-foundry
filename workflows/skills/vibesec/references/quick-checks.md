# Quick Security Checks Reference

## Overview

A curated set of fast, high-signal security checks that can be run in minutes. These checks catch the most common and impactful security issues without the overhead of a full audit.

## Secret Detection

### Files to Check

| File Pattern | What to Look For |
|-------------|-----------------|
| `.env`, `.env.*` | Committed secrets, database URLs, API keys |
| `*.config`, `*.conf` | Hardcoded credentials, connection strings |
| `docker-compose*.yml` | Passwords in environment sections |
| `*.pem`, `*.key`, `*.p12` | Private keys committed to repo |
| `.npmrc`, `.pypirc` | Package registry tokens |
| `terraform.tfvars` | Cloud credentials |

### Quick Scan Commands

```bash
# gitleaks (recommended — comprehensive)
gitleaks detect --source . --verbose

# trufflehog (git history scan)
trufflehog git file://. --only-verified

# Manual grep for common patterns
grep -rn "password\s*=" --include="*.{js,ts,py,rb,go,java,env,yml,yaml}" .
grep -rn "api[_-]key\s*=" --include="*.{js,ts,py,rb,go,java,env,yml,yaml}" .
grep -rn "secret\s*=" --include="*.{js,ts,py,rb,go,java,env,yml,yaml}" .
grep -rn "sk_live_\|sk_test_\|rk_live_" .
grep -rn "AKIA[0-9A-Z]{16}" .  # AWS access key pattern
```

### Common Secret Patterns

| Pattern | Service |
|---------|---------|
| `sk_live_*`, `sk_test_*` | Stripe |
| `AKIA[0-9A-Z]{16}` | AWS Access Key |
| `ghp_*`, `gho_*`, `ghu_*` | GitHub Token |
| `xoxb-*`, `xoxp-*` | Slack Token |
| `SG.*` (40+ chars) | SendGrid |
| `key-*` (32+ hex chars) | Mailgun |
| `-----BEGIN.*PRIVATE KEY-----` | Private keys |
| `mongodb+srv://*:*@` | MongoDB connection string |
| `postgres://*:*@` | PostgreSQL connection string |

## Security Headers

### Check with curl

```bash
# Fetch all security-relevant headers
curl -sI https://target.com | grep -iE "^(strict-transport|content-security|x-frame|x-content-type|referrer-policy|permissions-policy|x-xss-protection)"
```

### Expected Headers

| Header | Expected Value | Missing Impact |
|--------|---------------|---------------|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | Downgrade attacks |
| Content-Security-Policy | Restrictive policy | XSS amplification |
| X-Frame-Options | `DENY` or `SAMEORIGIN` | Clickjacking |
| X-Content-Type-Options | `nosniff` | MIME sniffing attacks |
| Referrer-Policy | `strict-origin-when-cross-origin` | Referer header leaks |
| Permissions-Policy | Restrict camera, microphone, etc. | Feature abuse by embedded content |

## TLS/SSL Quick Check

```bash
# Check TLS versions and ciphers
nmap --script ssl-enum-ciphers -p 443 target.com

# Quick check for common issues
curl -sI -v https://target.com 2>&1 | grep "SSL connection"

# Certificate expiry
echo | openssl s_client -connect target.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Authentication Quick Checks

| Check | How | Red Flag |
|-------|-----|----------|
| Default credentials | Try admin/admin, admin/password | Access granted |
| Login rate limiting | Send 20 rapid login attempts | No blocking or CAPTCHA |
| Session cookie flags | Inspect Set-Cookie header | Missing Secure, HttpOnly, SameSite |
| Password policy | Try "123456" as new password | Accepted |
| Session expiry | Check token TTL or cookie max-age | > 24 hours or no expiry |
| MFA availability | Check account settings | No MFA option |

## Debug and Admin Endpoint Check

```bash
# Common debug/admin endpoints to check
endpoints=(
  "/__debug__" "/debug" "/_debug"
  "/actuator" "/actuator/env" "/actuator/health"
  "/phpinfo.php" "/server-info" "/server-status"
  "/admin" "/admin/" "/administrator"
  "/graphql" "/.well-known/openid-configuration"
  "/swagger-ui" "/api-docs" "/swagger.json"
  "/wp-admin" "/wp-login.php"
  "/.git/config" "/.env" "/robots.txt" "/sitemap.xml"
)

for ep in "${endpoints[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://target.com$ep")
  if [ "$code" != "404" ] && [ "$code" != "403" ]; then
    echo "[!] $ep returned HTTP $code"
  fi
done
```

## Docker / Container Quick Checks

| Check | Command | Red Flag |
|-------|---------|----------|
| Running as root | `docker inspect --format '{{.Config.User}}' container` | Empty or "root" |
| Privileged mode | `docker inspect --format '{{.HostConfig.Privileged}}' container` | true |
| Exposed ports | `docker ps --format "{{.Ports}}"` | 0.0.0.0 bindings |
| Base image age | `docker inspect --format '{{.Created}}' image` | > 90 days |
| Secrets in env | `docker inspect --format '{{.Config.Env}}' container` | Password/key visible |

## Vibe Rating Scale

| Rating | Criteria | Action |
|--------|----------|--------|
| GREEN | No critical issues, minor improvements available | Ship with confidence |
| YELLOW | Configuration gaps, stale dependencies, no showstoppers | Fix before next release |
| ORANGE | Committed secrets, vulnerable deps, missing auth controls | Fix before deployment |
| RED | Active security holes, critical misconfigurations, leaked credentials | Stop and remediate now |
