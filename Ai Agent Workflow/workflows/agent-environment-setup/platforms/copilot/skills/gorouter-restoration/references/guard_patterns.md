# Guard patterns (safe redirects)

## Hard rules

- Keep guard logic synchronous, pure, and deterministic.
- Do not trigger side effects in `onEnter`/`redirect`.
- Ensure guards are idempotent for repeated router reevaluation.
- Always protect against redirect loops.

## Evaluation order

1. `onEnter`
2. Top-level `GoRouter.redirect`
3. Route-level `GoRoute.redirect`

Each stage should either:
- return `null` (allow), or
- return one stable target path.

## Baseline decision set

- If activation is incomplete, redirect to activation route (allow activation route).
- If unauthenticated on protected route, redirect to login with `from=` query.
- If authenticated user visits login/activation, redirect to app home.
- If maintenance mode is enabled, redirect to maintenance except allowlisted routes.

## Loop prevention checks

- Compare target against current `matchedLocation` before redirecting.
- Keep route allowlists explicit.
- Set and monitor `redirectLimit` for complex chains.

## Deep-link safety

- Preserve original destination via encoded `from`.
- Validate required params (path/query) before entering protected detail routes.
- Redirect invalid params to a safe fallback (`/not-found` or list route).
