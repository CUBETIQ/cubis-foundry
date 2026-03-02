# Logging redaction policy

## Never log
- Authorization headers
- Cookies
- refresh/access tokens
- passwords/OTP codes
- full request/response bodies containing PII

## Recommended
- Log request method + path + status code
- Log timing and correlation ids
- Redact sensitive fields:

Example (pseudo):
- headers: replace Authorization with "***"
- body: replace keys like token/password with "***"
