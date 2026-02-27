```
// templates/guard_redirect.tmpl
// Keep redirect logic pure and side-effect free.

String? redirectLogic({
  required bool isAuthenticated,
  required bool activationDone,
  required bool maintenanceMode,
  required String matchedLocation,
  Set<String> maintenanceAllowlist = const {'/maintenance'},
}) {
  final isLogin = matchedLocation == '/login';
  final isActivation = matchedLocation == '/activation';

  if (maintenanceMode && !maintenanceAllowlist.contains(matchedLocation)) {
    return '/maintenance';
  }

  if (!activationDone && !isActivation) {
    return '/activation';
  }

  if (activationDone && !isAuthenticated && !isLogin) {
    return '/login?from=${Uri.encodeComponent(matchedLocation)}';
  }

  if (isAuthenticated && (isLogin || isActivation)) {
    return '/home';
  }

  return null;
}
```
