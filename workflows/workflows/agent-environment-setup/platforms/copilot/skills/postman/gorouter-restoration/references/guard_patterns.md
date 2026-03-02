# Guard patterns (safe redirects)

Rules:
- No async side effects in redirect.
- Read session state from providers.
- Avoid redirect loops.

Pseudo rules:
- If not logged in and route requires auth -> redirect to login
- If logged in and route is login/activation -> redirect to home
- If maintenance mode -> redirect to maintenance screen, except allowlist routes

Also:
- When redirecting to login, include an optional `from=` query so you can return after login.
