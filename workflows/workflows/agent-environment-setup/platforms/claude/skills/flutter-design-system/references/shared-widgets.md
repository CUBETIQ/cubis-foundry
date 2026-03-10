# Shared Widgets

## Create a Shared Widget When

- the widget appears in multiple features,
- the behavior is generic,
- the visual contract should stay consistent across the app.

## Keep It Out of Shared

- feature-specific business copy,
- repository or notifier logic,
- route-specific navigation decisions,
- domain models that only one feature understands.

## Expected Shared State Widgets

- `LoadingView`: generic loading skeleton or progress state
- `ErrorView`: user-facing error with retry affordance and visible request ID when available
- `EmptyView`: empty-state illustration/message with optional CTA
- `DeadLetterView`: permanent failure state for sync or outbox issues
- `SyncStatusBadge`: normalized badge for `pendingSync`, `synced`, `failed`, `dead`, or `conflict`

## Widget Contract

- Accept data and callbacks through constructor parameters.
- Use design-system tokens only.
- Keep public APIs small and predictable.
- Prefer composition over large configurable mega-widgets.
