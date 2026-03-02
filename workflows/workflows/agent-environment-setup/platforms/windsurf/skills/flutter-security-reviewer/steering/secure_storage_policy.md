# Secure storage policy (mobile)

## Token storage
Preferred:
- Platform-backed secure storage for auth tokens

If you must use SharedPreferences:
- access tokens should be short-lived
- never store refresh token unless encrypted/secured
- clear all tokens on logout
- guard against backup/restore exposures where relevant

## Cached user/profile data
- Apply TTL
- Avoid caching sensitive PII unless required for offline
- Clear per-organization/user on logout or org switch
