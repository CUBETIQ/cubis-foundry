# Secure Sessions (NestJS + Fastify)

Use this guide when implementing cookie-based sessions for NestJS apps running with Fastify.

## Session Baseline

- Use `@fastify/cookie` and `@fastify/session`.
- Register cookie plugin before session plugin.
- Use a strong random session secret and rotate on schedule.
- Keep cookie `httpOnly: true`.
- Set `secure: true` in production.
- Use explicit `sameSite` based on cross-site requirements.

## Recommended Cookie Settings

```ts
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24, // 24h
}
```

## Session Lifecycle

1. Regenerate session ID at login to prevent fixation.
2. Store only minimum identity context in session.
3. Clear session and cookie on logout.
4. Enforce idle timeout and absolute timeout.

## What to Store

- `userId`
- `organizationId`
- `role`

Do not store tokens, passwords, raw PII, or authorization policy blobs.

## CSRF and State-Changing Routes

- Enable CSRF protection for cookie-authenticated forms and mutation routes.
- Validate origin and referer where applicable.
- Require `POST/PUT/PATCH/DELETE` requests to pass CSRF checks.

## Operational Controls

- Log auth/session failures with redaction.
- Alert on unusual session churn and repeated invalid signatures.
- Keep server clocks synchronized to avoid expiry drift.

## Related

- `steering/authentication.md`
- `steering/services-di.md`
