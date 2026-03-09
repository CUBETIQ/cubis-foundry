# Browser, API, and State Coverage Checklist

Use this when the question is "what should we test, at which layer, and why?"

## Choose the lowest reliable layer

- Unit or component tests:
  - rendering variants
  - pure logic
  - formatting and validation rules
  - state reducer behavior
- Integration or contract tests:
  - API handlers
  - auth middleware
  - database-backed service flows
  - background job boundaries
- Browser tests:
  - sign-in and sign-out
  - checkout or payment confirmation
  - multi-step onboarding
  - flows where routing, JS, CSS, network, and auth must work together

## Avoid duplicate assertions

- If contract tests already prove status codes and payload shape, browser tests should focus on the user-visible outcome.
- If component tests already prove rendering branches, E2E should validate the business flow, not every branch again.
- If accessibility smoke coverage exists at the component or page layer, browser tests should target the high-risk interactive journeys.

## Accessibility coverage

For critical flows, verify:

- keyboard navigation
- visible focus states
- semantic labels for key inputs and actions
- error messaging tied to the control that failed
- loading and success states that remain understandable to assistive technology

## Failure evidence

When a test fails, keep:

- failing command or suite name
- minimal reproduction path
- screenshots or trace artifacts if browser-based
- whether the failure is product, test, fixture, or environment related

## Release gating

Before merge or release, state:

1. which layer proved the change
2. which critical paths remain untested
3. whether any known flakes or quarantined tests still affect confidence
4. whether manual checks are still required
