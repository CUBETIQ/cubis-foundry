# Testing

Load this when the TypeScript task needs code-level verification ownership, type-level assertions, or a decision about whether testing belongs here or in a framework/platform skill.

## Keep testing ownership local

- Keep compile-time and narrow runtime checks in the owning TypeScript or framework skill.
- Do not route code-level TypeScript work through a separate generic testing skill.
- Use framework skills like `react`, `nextjs`, or `nestjs` when the tests depend on framework runtime behavior.
- Use `web-testing`, `android-emulator-testing`, or `ios-simulator-testing` only for live browser or device evidence.

## Type-level verification

- Use `expectTypeOf` in Vitest when the repo already uses Vitest.
- Use `tsd` or compile-only assertion files when the package exposes a public type API.
- Add negative cases with `// @ts-expect-error` when invalid usage is part of the contract.
- Keep type tests close to the utility or API they protect.

```ts
import { expectTypeOf, describe, it } from "vitest";

describe("route builder types", () => {
  it("preserves literal tuple members", () => {
    const paths = route(["users", "settings"] as const);
    expectTypeOf(paths).toEqualTypeOf<readonly ["users", "settings"]>();
  });
});
```

## Runtime unit tests

- Prefer `vitest` or the repo's existing runner.
- Test public behavior, not internal helper implementation details.
- Keep runtime unit tests focused on one branch, transform, parser, validator, or domain rule.
- Stub only direct collaborators.

```ts
import { describe, expect, it } from "vitest";

describe("normalizeUserId", () => {
  it("returns a branded identifier for valid input", () => {
    expect(normalizeUserId("usr_123")).toBe("usr_123");
  });
});
```

## Escalation rules

- Move into the owning framework skill if rendering, HTTP handlers, DI containers, or ORM boundaries are involved.
- Move into `prisma`, `sqlalchemy`, `fastapi`, `nestjs`, or other platform skills for real integration seams.
- Move into `web-testing` or the mobile testing skills when the task is about real runtime evidence instead of code-level verification.
