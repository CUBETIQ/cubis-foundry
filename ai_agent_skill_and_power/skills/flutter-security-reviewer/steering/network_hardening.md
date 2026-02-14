# Network hardening (Dio)

Checklist:
- HTTPS only for UAT/Prod
- Timeouts configured
- Interceptors do not leak sensitive info
- No `badCertificateCallback` in release
- Use request IDs/transaction hashes for tracing (non-secret)

Retry policy:
- idempotent requests only (GET)
- exponential backoff
- cap attempts
