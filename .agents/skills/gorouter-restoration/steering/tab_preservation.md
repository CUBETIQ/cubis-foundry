# Tab preservation & state restoration

## Recommended architecture

- Use `StatefulShellRoute.indexedStack` for bottom tabs.
- Give each branch its own `navigatorKey`.
- Keep shell widget stable so tab switch does not rebuild branch roots.

## What to preserve

- active tab index,
- each tab's navigation stack,
- long lists scroll position where needed,
- in-progress form drafts when required.

## Restoration guidance

- Enable app restoration via both `GoRouter(restorationScopeId: 'router', ...)` and `MaterialApp.router(restorationScopeId: 'app', ...)`.
- Use `RestorationMixin` for page-local restorable state.
- Keep critical unsaved drafts in explicit state (provider/local DB) instead of only widget memory.

## Anti-patterns

- Single navigator for all tabs when independent stacks are required.
- Recreating shell/router on every auth or theme change.
- Storing heavy objects in route extras when ID lookup is sufficient.
