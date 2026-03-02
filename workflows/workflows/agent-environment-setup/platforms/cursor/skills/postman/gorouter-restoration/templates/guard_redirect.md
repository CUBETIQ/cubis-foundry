```
// templates/guard_redirect.tmpl
//
// Safe redirect function sketch (keep it pure).

String? redirectLogic({
  required bool isLoggedIn,
  required bool isMaintenance,
  required String location,
}) {
  final isOnLogin = location.startsWith('/login');
  final isOnSplash = location == '/';
  final isProtected = location.startsWith('/home') || location.startsWith('/attendance');

  if (isMaintenance && !location.startsWith('/maintenance')) {
    return '/maintenance';
  }

  if (!isLoggedIn && isProtected && !isOnLogin) {
    return '/login?from=${Uri.encodeComponent(location)}';
  }

  if (isLoggedIn && isOnLogin) {
    return '/home';
  }

  // allow
  return null;
}
```
