```
// templates/stateful_shell_skeleton.tmpl
// Skeleton for tab preservation using StatefulShellRoute.indexedStack.

final _rootKey = GlobalKey<NavigatorState>();
final _homeKey = GlobalKey<NavigatorState>();
final _salesKey = GlobalKey<NavigatorState>();
final _settingsKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootKey,
  restorationScopeId: 'router',
  routes: [
    StatefulShellRoute.indexedStack(
      restorationScopeId: 'appShell',
      pageBuilder: (context, state, navigationShell) => MaterialPage(
        restorationId: 'appShellPage',
        child: AppShell(navigationShell: navigationShell),
      ),
      branches: [
        StatefulShellBranch(
          navigatorKey: _homeKey,
          restorationScopeId: 'homeBranch',
          routes: [GoRoute(path: '/home', builder: (c, s) => const HomeView())],
        ),
        StatefulShellBranch(
          navigatorKey: _salesKey,
          restorationScopeId: 'salesBranch',
          routes: [GoRoute(path: '/sales', builder: (c, s) => const SalesView())],
        ),
        StatefulShellBranch(
          navigatorKey: _settingsKey,
          restorationScopeId: 'settingsBranch',
          routes: [GoRoute(path: '/settings', builder: (c, s) => const SettingsView())],
        ),
      ],
    ),
  ],
);
```
