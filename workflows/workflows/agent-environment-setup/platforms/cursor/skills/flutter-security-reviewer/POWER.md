---
name: "flutter-security-reviewer"
displayName: "Flutter/Dart Security Reviewer"
description: "Review Flutter/Dart code for security vulnerabilities: secure storage, network hardening, log redaction, and data protection"
keywords:
  [
    "security",
    "flutter security",
    "dart security",
    "secure storage",
    "encryption",
    "log redaction",
    "network security",
    "data protection",
    "pii",
    "sensitive data",
    "authentication",
    "authorization",
  ]
---

# Flutter/Dart Security Reviewer

## Overview

This power helps you identify and fix security vulnerabilities in mobile and web applications, focusing on secure storage, network hardening, log redaction, and sensitive data handling.

## When to Use

- Reviewing code that handles authentication tokens
- Implementing secure storage for sensitive data
- Adding logging/analytics that might expose PII
- Reviewing network requests for security issues
- Implementing biometric authentication
- Handling user passwords or credentials
- Processing payment information
- Storing user preferences that contain sensitive data
- Implementing session management
- Any code that touches user data

## Review Output Format

When reviewing, output exactly:

1. **Threat summary** (what could go wrong; 3-6 bullets)
2. **Findings** grouped by severity (CRITICAL/HIGH/MED/LOW)
3. **Concrete mitigations** (specific code-level steps)
4. **Security regression tests/checks** (what to verify)
5. **Logging & privacy audit** (PII, tokens, crash reports)

## Severity Definitions

- **CRITICAL**: Token/session compromise, auth bypass, remote code/data exposure, storing secrets insecurely, PII leakage
- **HIGH**: Weak access control, insecure defaults, sensitive data in logs, missing TLS assumptions
- **MED**: Hardening gaps (timeouts, retry abuse, overly broad permissions)
- **LOW**: Best-practice improvements

---

## 1) Authentication & Session Security

### Tokens

**CRITICAL:**
- Tokens in logs, analytics events, crash reports
- Tokens stored in plain SharedPreferences without justification

**Recommendations:**
- Prefer secure storage for tokens (platform-backed) where possible
- If SharedPreferences must be used, ensure:
  - Short-lived access tokens + refresh tokens handled carefully
  - Minimal token surface; never log

### Route Guards
- Ensure router guards cannot be bypassed by deep links
- Guard decisions must use authoritative session provider state
- Avoid redirect loops (secure + usability)

---

## 2) Network Security

### Checklist
- [ ] Use HTTPS in UAT/Prod baseUrl
- [ ] Reasonable timeouts (connect/receive)
- [ ] Avoid disabling cert validation
- [ ] Do not accept all certs in production
- [ ] Interceptors must not log sensitive headers or body fields

### Retry Policy
- Avoid retrying non-idempotent requests unless safe
- Backoff + max attempts

### Device ↔ Gateway Security
- Prefer server-side validation and proper auth
- Never "security-by-obscurity" headers

---

## 3) Local Data Protection

**CRITICAL:**
- Storing PII or tokens unencrypted without threat model

**Guidance:**
- Store only what's needed offline
- Encrypt sensitive cached blobs if possible, or avoid caching them
- Apply TTL to cached session/profile data
- Clear data on logout

---

## 4) Input Validation & Injection Safety

- [ ] Validate all user inputs before sending to API
- [ ] Avoid string interpolation for SQL queries: use parameters
- [ ] Avoid trusting client-only checks (roles, orgId); server must enforce

---

## 5) Privacy, Logging, Analytics

**CRITICAL:**
- PII in logs (`name`, `phone`, `location`, identifiers)
- Tokens/headers in logs
- Crashlytics sending PII

**Guidance:**
- Redact: Authorization headers, cookies, IDs if sensitive
- Provide `toSafeLog()` helpers
- Ensure debug logging is disabled/limited in release builds

---

## 6) Dependency & Supply Chain Hygiene

- [ ] Check new packages are reputable and maintained
- [ ] Avoid adding packages that request broad permissions without need
- [ ] Pin versions as appropriate; review changelogs for security fixes

---

## 7) Security Review Checklist for PRs

### Always Search For
- `print(`, `debugPrint(`, logging interceptors
- `Authorization`, `token`, `refresh`, `secret`, `apiKey`
- `badCertificateCallback`, `HttpClient` overrides
- Persistent storage of user/session data

### Enforce
- [ ] No secrets in repo
- [ ] No insecure network overrides in production
- [ ] Logout clears sensitive local data
- [ ] Access control enforced server-side (don't trust client role/org headers alone)

---

## Quick Reference

### Secure Storage (DO)

```dart
// ✅ Use flutter_secure_storage for tokens
final storage = FlutterSecureStorage();
await storage.write(key: 'auth_token', value: token);
```

### Secure Storage (DON'T)

```dart
// ❌ Never store tokens in SharedPreferences
final prefs = await SharedPreferences.getInstance();
prefs.setString('auth_token', token); // INSECURE!

// ❌ Never hardcode secrets
const apiKey = 'sk_live_abc123'; // NEVER DO THIS
```

### Log Redaction

```dart
// ❌ Bad - logs sensitive data
logger.info('User login: ${user.email}, password: ${password}');

// ✅ Good - no sensitive data in logs
logger.info('User login successful: userId=${user.id}');
```

---

## Steering Files

| File                        | Load When                              |
| --------------------------- | -------------------------------------- |
| `secure_storage_policy.md`  | What to store where                    |
| `network_hardening.md`      | Network security best practices        |
| `log_redaction.md`          | How to redact sensitive data from logs |
| `vulnerability-patterns.md` | SQL injection, XSS, IDOR patterns      |
| `secret-scanning.md`        | Finding hardcoded secrets              |

## Templates

- `security_review_response.md` - Security review report template
