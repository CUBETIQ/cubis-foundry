# Testing

Load this when React work needs component tests, hook tests, client/server boundary checks, or a decision about when to leave React and use `web-testing`.

## Ownership

- Keep component and hook tests in the React skill.
- Keep shared TypeScript utility tests in `typescript-best-practices`.
- Use `web-testing` for real browser evidence, route validation, accessibility snapshots, or end-to-end user flows.
- Use `playwright-interactive` only when browser work needs deeper suite authoring or specialist visual/a11y support.

## Component tests

- Use React Testing Library with role, label, and text queries.
- Render the smallest surface that proves the behavior.
- Assert user-visible results, not implementation details like hook state internals.
- Mock network or server actions at the boundary, not deep inside child components.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ProfileCard", () => {
  it("shows the display name", () => {
    render(<ProfileCard user={{ name: "Avery" }} />);
    expect(screen.getByRole("heading", { name: "Avery" })).toBeInTheDocument();
  });
});
```

## Hook and action seams

- Test hooks through a lightweight host component unless the repo already uses a dedicated hook-test utility.
- Test Suspense and Actions at the boundary where pending, success, and error states are visible.
- When Server Components are involved, verify the serialization boundary and hand off framework-specific concerns to `nextjs`.

## Escalation rules

- Move into `nextjs` when App Router, Server Actions, middleware, or route handlers are part of the test boundary.
- Move into `web-testing` when the task needs real browser execution or release-readiness evidence.
