# Testing

Load this when Prisma work needs database-boundary verification, migration-aware fixtures, or a decision about whether the test belongs here, in TypeScript, or in browser/mobile runtime skills.

## Ownership

- Keep schema-coupled and client-boundary tests in the Prisma skill.
- Keep narrow TypeScript utility tests in `typescript-best-practices`.
- Keep UI-facing release-readiness checks in `web-testing` or the mobile testing skills.
- Do not route Prisma database checks through a separate generic runtime-testing skill.

## Database-boundary tests

- Use a real database engine for migration and query behavior that matters.
- Seed deterministic fixtures through Prisma Client or a dedicated seed path.
- Reset or isolate state per test so schema and data changes do not leak between runs.
- Assert on observable query results, constraint behavior, and transaction outcomes.

```ts
it("rejects duplicate email addresses", async () => {
  await prisma.user.create({ data: { email: "dupe@example.com" } });

  await expect(
    prisma.user.create({ data: { email: "dupe@example.com" } }),
  ).rejects.toThrow();
});
```

## Migration-aware checks

- Verify that migrations can create a fresh schema and that seed data still applies cleanly.
- Add explicit tests for enum changes, relation changes, unique constraints, and destructive migration paths.
- When drift or reset behavior is part of the bug, test from the migration boundary rather than mocking Prisma Client calls.

## Escalation rules

- Move into `web-testing` only when the task needs live browser evidence against Prisma-backed UI behavior.
- Move into framework skills like `nextjs` or `nestjs` when the failure lives in request handling or runtime composition above the Prisma boundary.
