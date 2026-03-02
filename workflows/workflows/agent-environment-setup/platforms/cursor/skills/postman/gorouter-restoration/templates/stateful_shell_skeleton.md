```
// templates/stateful_shell_skeleton.tmpl
//
// Skeleton for tab preservation using StatefulShellRoute.indexedStack.

final _rootKey = GlobalKey<NavigatorState>();
final _homeKey = GlobalKey<NavigatorState>();
final _leaveKey = GlobalKey<NavigatorState>();
final _taskKey = GlobalKey<NavigatorState>();
final _profileKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootKey,
  routes: [
    StatefulShellRoute.indexedStack(
      branches: [
        StatefulShellBranch(
          navigatorKey: _homeKey,
          routes: [GoRoute(path: '/home', builder: (c, s) => const HomeView())],
        ),
        StatefulShellBranch(
          navigatorKey: _leaveKey,
          routes: [GoRoute(path: '/leave', builder: (c, s) => const LeaveView())],
        ),
        StatefulShellBranch(
          navigatorKey: _taskKey,
          routes: [GoRoute(path: '/task', builder: (c, s) => const TaskView())],
        ),
        StatefulShellBranch(
          navigatorKey: _profileKey,
          routes: [GoRoute(path: '/profile', builder: (c, s) => const ProfileView())],
        ),
      ],
      builder: (context, state, navigationShell) {
        return AppShell(navigationShell: navigationShell);
      },
    ),
  ],
);
```
