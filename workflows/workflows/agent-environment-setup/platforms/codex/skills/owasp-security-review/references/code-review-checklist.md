# Security Code Review Checklist

## Overview

This checklist guides manual security code review. Use it after automated scanning to catch logic flaws, design weaknesses, and context-dependent vulnerabilities that tools miss.

## Pre-Review Setup

1. Identify the application's trust model — who are the users, what roles exist, what are the trust boundaries?
2. Map the data flow — where does data enter, how is it processed, where is it stored, where does it exit?
3. Identify sensitive operations — authentication, authorization, payment processing, PII handling.
4. Review the technology stack — framework version, ORM, template engine, authentication library.

## Authentication Review

| Check | What to Look For | Risk |
|-------|-----------------|------|
| Password storage | Bcrypt/Argon2/scrypt with salt; not MD5/SHA1/plaintext | Critical |
| Session management | Secure, HttpOnly, SameSite cookies; regeneration after login | High |
| Token handling | JWT with strong signing (RS256/ES256), expiration, audience validation | High |
| MFA implementation | Time-based OTP or WebAuthn; backup codes hashed | Medium |
| Account lockout | Rate limiting on login; progressive delays; CAPTCHA after failures | Medium |
| Password reset | Time-limited tokens, single-use, no user enumeration | High |
| OAuth/OIDC | State parameter validation, nonce, PKCE for public clients | High |

## Authorization Review

| Check | What to Look For | Risk |
|-------|-----------------|------|
| Object-level auth | Every data access checks if requesting user owns/can access the resource | Critical |
| Function-level auth | Admin endpoints verify admin role; not just hidden by UI | Critical |
| Field-level auth | Sensitive fields (salary, SSN) restricted even within accessible objects | High |
| Horizontal access | User A cannot access User B's resources via ID manipulation | Critical |
| Vertical access | Regular users cannot access admin functionality | Critical |
| Indirect references | Use indirect reference maps instead of database IDs in URLs | Medium |

## Input Validation Review

| Check | What to Look For | Risk |
|-------|-----------------|------|
| SQL queries | Parameterized queries everywhere; no string concatenation | Critical |
| HTML output | Context-aware output encoding (HTML, attribute, JavaScript, URL, CSS) | Critical |
| File paths | No user input in file paths; path traversal prevention | High |
| OS commands | Avoid user input in commands; if unavoidable, use allowlists | Critical |
| Deserialization | No deserialization of untrusted data; use safe formats (JSON) | Critical |
| File uploads | Validate type, size, name; store outside webroot; scan for malware | High |
| Redirects | Validate redirect URLs against allowlist; no open redirects | Medium |

## Cryptography Review

| Check | What to Look For | Risk |
|-------|-----------------|------|
| TLS configuration | TLS 1.2+; no SSLv3/TLS 1.0/1.1; strong cipher suites | High |
| Encryption at rest | AES-256-GCM or equivalent; unique keys per tenant/purpose | High |
| Key management | Keys in vault/KMS; not in code, config files, or environment variables | Critical |
| Random numbers | Cryptographically secure PRNG for tokens, keys, nonces | High |
| Hashing | SHA-256+ for integrity; bcrypt/Argon2 for passwords; HMAC for signing | High |

## Error Handling Review

| Check | What to Look For | Risk |
|-------|-----------------|------|
| Stack traces | Not exposed to users in production | Medium |
| Error messages | Generic messages; no database/system details leaked | Medium |
| Exception handling | All code paths have appropriate error handling; no bare catches | Medium |
| Logging | Security events logged; no sensitive data in logs | High |
| Fail-safe defaults | On error, deny access rather than allow | High |

## API Security Review

| Check | What to Look For | Risk |
|-------|-----------------|------|
| Rate limiting | Per-user and per-IP rate limits on all endpoints | Medium |
| Input size limits | Maximum request body size, query parameter count, header size | Medium |
| Mass assignment | Protect against binding untrusted input to model properties | High |
| API versioning | Deprecated versions disabled; old endpoints not accessible | Low |
| Response filtering | API responses do not include unnecessary fields | Medium |
| CORS policy | Specific origin allowlist; no wildcard in production | High |

## Framework-Specific Checks

### Node.js / Express
- Verify `helmet` middleware is configured
- Check for `eval()`, `new Function()`, `child_process.exec()` with user input
- Ensure `express.json()` has size limits

### Python / Django
- Verify `DEBUG = False` in production settings
- Check for `mark_safe()` usage (potential XSS)
- Ensure CSRF middleware is enabled
- Review `raw()` and `extra()` ORM calls for SQL injection

### Java / Spring
- Verify CSRF protection is enabled
- Check for `Runtime.exec()` with user input
- Review XML parsing for XXE (disable external entities)
- Ensure `@PreAuthorize` or equivalent on controller methods

### React / Frontend
- Audit `dangerouslySetInnerHTML` usage
- Check for `eval()` or `new Function()`
- Verify CSP compatibility
- Review client-side storage of sensitive data

## Review Process

1. **Automated scan first** — Run SAST tools to catch the obvious issues
2. **Authentication flows** — Trace every auth path including edge cases
3. **Authorization checks** — Follow each privileged operation to its access control
4. **Data entry points** — Trace every external input to its eventual use
5. **Sensitive operations** — Review payment, PII handling, and admin functions
6. **Error paths** — Check what happens when things go wrong
7. **Configuration** — Verify production hardening settings
8. **Dependencies** — Audit third-party code usage and update status
