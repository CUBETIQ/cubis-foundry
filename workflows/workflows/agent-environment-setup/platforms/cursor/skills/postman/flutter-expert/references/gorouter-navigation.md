# GoRouter Navigation

## Route Constants (Required Pattern)

```dart
// lib/core/routes/routes.dart
abstract class Routes {
  static const home = '/home';
  static const profile = '/profile';
  static const settings = '/settings';
  static const login = '/auth/login';
  static const todoDetails = '/todos/:id';
  static const userProfile = '/users/:userId';
  
  // Helper for parameterized routes
  static String todoDetailsPath(String id) => '/todos/$id';
  static String userProfilePath(String userId) => '/users/$userId';
}
```

## Basic Setup

```dart
import 'package:go_router/go_router.dart';

final goRouter = GoRouter(
  initialLocation: Routes.home,
  redirect: (context, state) {
    final isLoggedIn = /* check auth */;
    if (!isLoggedIn && !state.matchedLocation.startsWith('/auth')) {
      return Routes.login;
    }
    return null;
  },
  routes: [
    GoRoute(
      path: Routes.home,
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: Routes.todoDetails,
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return TodoDetailsScreen(id: id);
      },
    ),
    GoRoute(
      path: Routes.login,
      builder: (context, state) => const LoginScreen(),
    ),
  ],
);
```

## Navigation Methods

```dart
// Navigate and replace history
context.go(Routes.home);

// Navigate with params
context.go(Routes.todoDetailsPath('123'));

// Navigate and add to stack
context.push(Routes.profile);

// Go back
context.pop();

// Replace current route
context.pushReplacement(Routes.home);

// Navigate with extra data
context.push(Routes.todoDetailsPath('123'), extra: {'title': 'My Todo'});

// Access extra in destination
final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
```

## Shell Routes (Persistent UI)

```dart
final goRouter = GoRouter(
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        return ScaffoldWithNavBar(child: child);
      },
      routes: [
        GoRoute(path: Routes.home, builder: (_, __) => const HomeScreen()),
        GoRoute(path: Routes.profile, builder: (_, __) => const ProfileScreen()),
        GoRoute(path: Routes.settings, builder: (_, __) => const SettingsScreen()),
      ],
    ),
  ],
);
```

## Query Parameters

```dart
abstract class Routes {
  static const search = '/search';
  
  static String searchPath({String? query, int? page}) {
    final params = <String, String>{};
    if (query != null) params['q'] = query;
    if (page != null) params['page'] = page.toString();
    return Uri(path: search, queryParameters: params.isEmpty ? null : params).toString();
  }
}

// Usage
context.go(Routes.searchPath(query: 'flutter', page: 2));

// In route
GoRoute(
  path: Routes.search,
  builder: (context, state) {
    final query = state.uri.queryParameters['q'] ?? '';
    final page = int.tryParse(state.uri.queryParameters['page'] ?? '1') ?? 1;
    return SearchScreen(query: query, page: page);
  },
),
```

## ✅ DO's

```dart
// ✅ Use route constants
context.go(Routes.home);
context.push(Routes.todoDetailsPath(todo.id));

// ✅ Type-safe params with helper methods
static String todoDetailsPath(String id) => '/todos/$id';
```

## ❌ DON'Ts

```dart
// ❌ NEVER use raw strings
context.go('/home');
context.push('/todos/123');

// ❌ NEVER hardcode paths in routes
GoRoute(path: '/home', ...);  // Use Routes.home
```

## Quick Reference

| Method | Behavior |
|--------|----------|
| `context.go(Routes.x)` | Navigate, replace stack |
| `context.push(Routes.x)` | Navigate, add to stack |
| `context.pop()` | Go back |
| `context.pushReplacement()` | Replace current |
| `Routes.xPath(id)` | Parameterized route helper |
