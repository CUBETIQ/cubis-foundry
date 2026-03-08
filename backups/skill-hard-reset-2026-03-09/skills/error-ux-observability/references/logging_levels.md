# Logging levels

- Debug builds: detailed logs allowed but still redact secrets
- Release builds: only essential logs + correlation ids
- Never log: tokens, passwords, OTPs, precise location unless required and approved

Prefer structured logs:
- method, path, status, duration, requestId
