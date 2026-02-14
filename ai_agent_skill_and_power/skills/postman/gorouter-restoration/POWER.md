---
name: "gorouter-restoration"
displayName: "GoRouter & State Restoration"
description: "Implement GoRouter patterns: guards, deep links, tab preservation, state restoration, and safe redirects"
keywords:
  [
    "gorouter",
    "routing",
    "navigation",
    "guards",
    "deep links",
    "state restoration",
    "tab navigation",
  ]
---

# GoRouter & State Restoration

## Overview

This power helps you implement robust routing with GoRouter, including authentication guards, deep link handling, tab state preservation, and Flutter state restoration.

## When to Use

- Adding new routes to the app
- Implementing authentication guards
- Setting up deep link handling
- Preserving tab/scroll state
- Debugging navigation issues
- Implementing state restoration

## Quick Reference

### Route Definition

```dart
// ✅ Define routes with constants
class AppRoutes {
  static const login = '/login';
  static const home = '/home';
  static const leaveDetail = '/leave/:id';
  static const profile = '/profile';
}

// ✅ Use in router config
GoRoute(
  path: AppRoutes.leaveDetail,
  name: 'leaveDetail',
  builder: (context, state) {
    final id = state.pathParameters['id']!;
    return LeaveDetailView(leaveId: id);
  },
)
```

### Authentication Guard

```dart
// ✅ Guard implementation
class AuthGuard {
  static String? redirect(BuildContext context, GoRouterState state) {
    final isAuthenticated = /* check auth provider */;
    final isLoginRoute = state.matchedLocation == AppRoutes.login;
    
    // Prevent redirect loop
    if (!isAuthenticated && !isLoginRoute) {
      return AppRoutes.login;
    }
    
    // Already on login, no redirect needed
    if (isAuthenticated && isLoginRoute) {
      return AppRoutes.home;
    }
    
    return null; // No redirect
  }
}
```

### Tab Preservation

```dart
// ✅ Use StatefulShellRoute for bottom tabs
StatefulShellRoute.indexedStack(
  builder: (context, state, navigationShell) {
    return ScaffoldWithNavBar(navigationShell: navigationShell);
  },
  branches: [
    StatefulShellBranch(
      routes: [
        GoRoute(path: '/home', builder: (context, state) => HomeView()),
      ],
    ),
    StatefulShellBranch(
      routes: [
        GoRoute(path: '/profile', builder: (context, state) => ProfileView()),
      ],
    ),
  ],
)
```

### Deep Link Handling

```dart
// ✅ Handle deep links with guards
GoRoute(
  path: '/leave/:id',
  redirect: (context, state) {
    // Check auth before allowing deep link
    return AuthGuard.redirect(context, state);
  },
  builder: (context, state) {
    final id = state.pathParameters['id']!;
    return LeaveDetailView(leaveId: id);
  },
)
```

## Routing Checklist

### Route Definition
- [ ] Routes defined in AppRoutes constants
- [ ] Route names are descriptive
- [ ] Path parameters use typed extraction
- [ ] Query parameters handled correctly

### Guards
- [ ] Authentication guard prevents unauthorized access
- [ ] Role-based guards check permissions
- [ ] Maintenance mode guard redirects when needed
- [ ] No redirect loops (check current location)

### Deep Links
- [ ] All routes accessible via deep links
- [ ] Guards protect deep-linked routes
- [ ] Invalid parameters handled gracefully
- [ ] Deep links tested on iOS and Android

### State Preservation
- [ ] Bottom tab state preserved
- [ ] Scroll position preserved where needed
- [ ] Form drafts preserved (if required)
- [ ] RestorationScope configured

### Navigation Safety
- [ ] Back button behavior is correct
- [ ] Pop until works correctly
- [ ] Navigation after logout clears stack
- [ ] No navigation during async operations

## Common Patterns

### Redirect Loop Prevention

```dart
// ❌ Bad - causes redirect loop
if (!isAuthenticated) {
  return AppRoutes.login; // Always redirects!
}

// ✅ Good - checks current location
if (!isAuthenticated && state.matchedLocation != AppRoutes.login) {
  return AppRoutes.login;
}
```

### Passing Data

```dart
// ❌ Bad - passing large objects
context.push('/detail', extra: largeObject);

// ✅ Good - pass ID, fetch in destination
context.push('/detail/$id');
```

### State Restoration

```dart
// ✅ Enable restoration
MaterialApp.router(
  restorationScopeId: 'app',
  routerConfig: router,
)

// ✅ Use restoration mixin in stateful widgets
class MyView extends StatefulWidget {
  @override
  State<MyView> createState() => _MyViewState();
}

class _MyViewState extends State<MyView> with RestorationMixin {
  @override
  String? get restorationId => 'my_view';
  
  final _scrollController = RestorableScrollController();
  
  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_scrollController, 'scroll');
  }
}
```

## Output Format

When implementing routing:

1. **Route Plan** (paths, names, params)
2. **Guard Plan** (what checks where)
3. **Restoration Plan** (what state is preserved)
4. **Edge Cases** (deep link, logout, maintenance, back nav)
5. **Code Snippets** (relevant blocks)
6. **Tests** (router tests / widget tests)

## Steering Files

- `guard_patterns.md` - Guard implementation patterns
- `tab_preservation.md` - Tab state preservation
- `deep_link_handling.md` - Deep link best practices

## Templates

- `guard_redirect` - Guard redirect template
- `stateful_shell_skeleton` - Tab navigation template

