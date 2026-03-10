# Typed Routes

## Route File Layout

Prefer a dedicated routing area such as:

- `lib/core/routing/app_router.dart`
- `lib/core/routing/routes/<feature>_route.dart`

## Route Type Choice

- `GoRouteData` for normal screen routes
- `ShellRouteData` for shared wrappers with one navigator
- stateful shell route for persistent tabs with independent stacks

## Parameter Rules

- Required path params for canonical resource identity
- Optional query params for filters, search, and non-identity state
- Use `extra` sparingly and avoid relying on it for deep-linkable flows

## Widget Usage

- `ProductListRoute().go(context)`
- `ProductDetailRoute(id: id).push(context)`

Do not call `context.go('/products')` from widgets when typed routes exist.
