---
name: "flutter-expert"
displayName: "Flutter Expert"
description: "Flutter development with Riverpod 3, GoRouter, and Clean Architecture"
keywords:
  [
    "flutter",
    "riverpod",
    "gorouter",
    "dart",
    "widget",
    "provider",
    "state",
    "navigation",
    "async",
  ]
---

# Flutter Expert

## Onboarding

Verify Flutter is installed:

```bash
flutter --version
```

## When to Load Steering Files

- Working with Riverpod providers → `riverpod-state.md`
- Navigation/routing → `gorouter-navigation.md`
- Widget patterns → `widget-patterns.md`
- Project structure → `project-structure.md`
- Performance optimization → `performance.md`
- Engineering principles → `engineering-principles.md`

## Related Specialized Powers

For deeper expertise in specific areas, activate these powers:

- **riverpod-3** - Advanced Riverpod patterns (caching, paging, testing)
- **gorouter-restoration** - Routing, guards, deep links, state restoration
- **accessibility** - WCAG compliance, semantics, screen readers
- **ux-ui-consistency** - Screen states, design system components, UX patterns
- **error-ux-observability** - Error handling, logging, user feedback
- **flutter-security-reviewer** - Secure storage, network security, PII protection
- **flutter-code-reviewer** - Architecture review, performance, testing
- **design-system-builder** - Creating/updating design system components

## Quick Reference

### Riverpod 3 Provider Pattern

```dart
@riverpod
class FeatureNotifier extends _$FeatureNotifier {
  @override
  FutureOr<State> build() async => fetchData();

  Future<void> update() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => api.update());
  }
}
```

### Consumer Widget

```dart
class MyScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(featureNotifierProvider);
    return state.when(
      data: (data) => Content(data),
      loading: () => const CircularProgressIndicator(),
      error: (e, st) => ErrorWidget(error: e),
    );
  }
}
```

### Key Rules

- Use `ref.watch()` in build, `ref.read()` in callbacks
- Use `ref.mounted` after async operations
- Run `flutter pub run build_runner build -d` after provider changes
- Use `Ref` (not typed refs like `AutoDisposeRef`)
