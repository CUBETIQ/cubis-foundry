---
name: "gorouter-restoration"
displayName: "GoRouter & State Restoration"
description: "GoRouter guard patterns, deep links, redirect safety, tab preservation, and restoration best practices"
keywords:
  [
    "gorouter",
    "routing",
    "navigation",
    "guards",
    "deep links",
    "state restoration",
    "statefulshellroute",
  ]
---

# GoRouter & State Restoration

## Overview

Use this skill for safe routing architecture with GoRouter.
Focus: guard correctness, redirect loop prevention, deep-link safety, shell navigation preservation, and restoration.

## When to Use

- Adding/modifying routes
- Implementing authentication/authorization guards
- Handling deep links
- Preserving tab stacks with `StatefulShellRoute`
- Fixing redirect loops or bad back-stack behavior

## Core Rules

1. Keep `onEnter`/`redirect` pure and fast (no async side effects).
2. Avoid redirect loops by checking current matched location.
3. Use `redirectLimit` intentionally for complex guard trees.
4. Preserve user intent with `from=` query on auth redirects.
5. Prefer IDs/path params over large objects in `extra`.

## Guard Execution Model

- `onEnter` runs first.
- If allowed, top-level `redirect` runs.
- Route-level `GoRoute.redirect` runs last.

Design guards so each stage is deterministic and idempotent.

## Quick Reference

### Safe redirect logic

```dart
String? redirectLogic({
  required bool isAuthenticated,
  required bool activationDone,
  required String matchedLocation,
}) {
  final isLogin = matchedLocation == '/login';
  final isActivation = matchedLocation == '/activation';

  if (!activationDone && !isActivation) return '/activation';
  if (activationDone && !isAuthenticated && !isLogin) {
    return '/login?from=${Uri.encodeComponent(matchedLocation)}';
  }
  if (isAuthenticated && (isLogin || isActivation)) return '/home';

  return null;
}
```

### Tab/state preservation

```dart
StatefulShellRoute.indexedStack(
  branches: [
    StatefulShellBranch(navigatorKey: _homeKey, routes: [...]),
    StatefulShellBranch(navigatorKey: _salesKey, routes: [...]),
    StatefulShellBranch(navigatorKey: _settingsKey, routes: [...]),
  ],
  builder: (context, state, shell) => AppShell(shell: shell),
)
```

### Restoration

```dart
final router = GoRouter(
  restorationScopeId: 'router',
  routes: [...],
);

MaterialApp.router(
  restorationScopeId: 'app',
  routerConfig: router,
)
```

## Routing Checklist

- Routes use constants and typed parameter extraction.
- Guards do not mutate app state.
- Redirect logic handles both anonymous and authenticated states.
- Deep links are validated for invalid/missing IDs.
- Logout clears sensitive stack/history as intended.
- Tab branch stacks remain independent.

## Output Format

1. Route plan (paths, params, names)
2. Guard plan (stage, conditions, outcomes)
3. Restoration plan (what is preserved)
4. Edge cases (deep links, logout, back-nav)
5. Tests (guard behavior, tab preservation, invalid params)

## Steering Files

| File | Load when |
| --- | --- |
| `references/guard_patterns.md` | Designing guard logic, redirect rules, or anti-loop checks. |
| `references/tab_preservation.md` | Preserving `StatefulShellRoute` branches and restoration state. |

## Templates

| File | Load when |
| --- | --- |
| `templates/guard_redirect.md` | Starting a redirect/guard function skeleton. |
| `templates/stateful_shell_skeleton.md` | Starting a shell/tab restoration scaffold. |
