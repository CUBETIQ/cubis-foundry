# Locator, Trace, and Flake Checklist

Use this when Playwright is already the right tool and you need exact implementation guidance.

## Locator priority

1. Start with `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, or `getByTestId`.
2. Add filtering or chaining before reaching for positional selectors.
3. Use explicit test ids only for controls with unstable visible text or repeated semantics.
4. Treat CSS or XPath selectors as last-resort escape hatches with a comment-worthy reason.

## Test isolation

- Keep each test able to run alone.
- Build auth setup through fixtures, setup projects, or seeded state, not cross-test ordering.
- Control database and network inputs for critical flows.
- Stub or route third-party dependencies you do not own.

## Assertion and waiting rules

- Prefer `await expect(locator).to...` over manual `isVisible()`-style polling.
- Wait on user-visible state changes, not arbitrary timers.
- Use network or URL assertions only when they are part of the behavior you are protecting.
- Do not normalize flakiness by increasing timeouts before understanding the wait condition.

## Trace-driven debugging

- Capture traces on first retry or on failure in CI.
- When a test fails, inspect:
  - timeline ordering
  - actionability logs
  - DOM snapshot at the failing step
  - network calls and mocked routes
  - console or page errors tied to the same flow
- Add screenshots or videos only as supporting artifacts, not as the primary debugging surface.

## Flake triage

Check these in order:

1. Locator ambiguity or unstable text.
2. Hidden app loading state or optimistic UI race.
3. Shared auth or storage state leakage.
4. Server or mocked dependency nondeterminism.
5. Environment-only timing differences in CI.

## CI defaults

- Keep retries low and intentional.
- Upload traces for failed or retried tests.
- Shard only after local determinism is solid.
- Separate smoke-critical browser flows from broad exploratory suites.
