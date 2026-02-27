# Failure -> UI mapping (OneUp HR)

## Rules
- Do not show raw exceptions to users.
- Always provide an action when possible.

## Mapping table (example)
- network -> "You're offline. Please check your internet." (Retry)
- auth -> "Session expired. Please sign in again." (Go to login)
- validation -> show field errors (Fix inputs)
- server -> "Something went wrong on our side." (Retry)
- cache -> "Saved data is unavailable." (Retry/Refresh)
