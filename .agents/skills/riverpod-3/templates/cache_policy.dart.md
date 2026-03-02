```dart
// templates/cache_policy.dart.tmpl
//
// Minimal TTL helper you can use in repositories.

class CachePolicy {
  const CachePolicy({
    required this.ttl,
    this.allowStaleWhileRevalidate = true,
  });

  final Duration ttl;
  final bool allowStaleWhileRevalidate;

  bool isFresh(DateTime cachedAt, DateTime now) => now.difference(cachedAt) <= ttl;
}
```
