# Schema And Resolver Checklist

Load this when GraphQL work needs more explicit architecture guidance.

## Schema shape

- Model the client graph, not the storage model.
- Make nullability intentional and consistent.
- Keep pagination and mutation payload patterns predictable.

## Resolver behavior

- Prevent N+1 with batching and deliberate data-access boundaries.
- Keep auth and permission checks close to the field or boundary where they matter.
- Avoid resolver logic that hides expensive fan-out.

## Auth and policy

- Keep authentication outside the schema, but keep authorization close to resolver ownership.
- Make field-level and object-level policy checks explicit and testable.
- Avoid duplicating authorization rules in both transport middleware and resolver code without a clear owner.

## Federation and subscriptions

- Use federation only when ownership boundaries justify it.
- Make subscription semantics and backpressure expectations explicit.
- Keep cross-service graph complexity proportional to real product needs.

## Safety

- Add query depth, complexity, or cost controls when exposure risk is real.
- Verify error behavior and partial-null handling before shipping.
