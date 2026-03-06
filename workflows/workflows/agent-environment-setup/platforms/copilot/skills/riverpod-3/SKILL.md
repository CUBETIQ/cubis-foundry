---
name: "riverpod-3"
description: "Riverpod 3 best practices for codegen, UI interaction boundaries, caching, paging, lifecycle, and testing"
---
# Riverpod 3 Expert

## Overview

Use this skill for production-grade Riverpod 3 usage in Flutter apps.
Focus: correct provider lifecycles, predictable UI interaction, rebuild control, side effects, and testability.

## When to Use

- Creating or refactoring providers/notifiers
- Solving rebuild storms or dependency loops
- Designing refresh/paging/cache behavior
- Defining provider lifecycles (`autoDispose` vs `keepAlive`)
- Writing Riverpod unit/widget tests

## Quick Reference

### AsyncNotifier Pattern

```dart
@riverpod
class OrdersController extends _$OrdersController {
  @override
  FutureOr<OrdersState> build() async {
    final repo = ref.watch(ordersRepositoryProvider);
    final items = await repo.fetchOrders();
    return OrdersState(items: items);
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }

  Future<void> createOrder(CreateOrderInput input) async {
    final repo = ref.read(ordersRepositoryProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await repo.createOrder(input);
      if (!ref.mounted) return const OrdersState(items: []);
      final items = await repo.fetchOrders();
      return OrdersState(items: items);
    });
  }
}
```

### watch/read/listen/listenManual

```dart
// Build/render: watch
final state = ref.watch(ordersControllerProvider);

// User callbacks: read
onPressed: () => ref.read(ordersControllerProvider.notifier).refresh();

// UI side effects in build-capable context
ref.listen(ordersControllerProvider, (prev, next) {
  next.whenOrNull(error: (e, st) => showErrorSnackBar(context, e));
});

// Lifecycle side effects (initState/dispose flows)
late final remove = ref.listenManual(authStateProvider, (prev, next) {
  if (next.isLoggedOut) context.go('/login');
});
```

### keepAlive Rule

```dart
// Use only for app-wide long-lived state
@Riverpod(keepAlive: true)
SessionState sessionState(Ref ref) => const SessionState.unknown();
```

Default to auto-dispose for route/screen-scoped and family providers.

## Core Rules (Do/Don't)

1. Do use `ref.watch` only in widget/provider build paths.
2. Do use `ref.read` for callbacks and imperative actions.
3. Do use `ref.listen`/`ref.listenManual` for side effects (navigation/snackbar/dialog).
4. Don't trigger side effects from render branches (`watch + if + navigate`).
5. Don't call notifier mutation methods from widget `build`.
6. Don't mutate collections in-place; always emit new immutable values.
7. Do keep provider parameters stable and immutable (correct `==/hashCode`).
8. Do keep business state in providers and ephemeral UI state in widgets.

## KeepAlive Decision Matrix

Use `keepAlive: true` only when all are true:
- state should survive route changes,
- recomputation is expensive,
- cardinality is low (not unbounded families).

Avoid keepAlive for:
- search/filter family providers,
- row/detail item families,
- short-lived forms.

## Loop Avoidance Checklist

- No notifier writes inside provider `build()` unless conditional and bounded.
- No unconditional `invalidateSelf()` in `build()`.
- No provider cycles (A watches B and B watches A).
- No `ref.watch` in callbacks.
- Audit repeated rebuilds with narrowed `select` usage.

## Steering Files

| File | Load when |
| --- | --- |
| `references/loop-avoidance.md` | Diagnosing provider loops, invalidation storms, or notifier recursion. |
| `references/minimal-rebuild.md` | Reducing rebuilds with `select`, widget splitting, or item-level providers. |
| `references/provider-layout.md` | Organizing provider boundaries, layers, and ownership. |
| `references/refresh-cache-paging.md` | Designing refresh, cache TTL, paging, or stale-while-revalidate flows. |
| `references/testing.md` | Writing `ProviderContainer` or widget tests for Riverpod behavior. |

## Examples

| File | Load when |
| --- | --- |
| `examples/attendance_paging.md` | You need a concrete paginated list example. |
| `examples/profile_edit.md` | You need a form/editing workflow example. |

## Templates

| File | Load when |
| --- | --- |
| `templates/cache_policy.dart.md` | Creating a TTL helper for repository caching. |
| `templates/paged_controller.dart.md` | Bootstrapping a cursor/page-based controller. |
| `templates/riverpod_controller_test.md` | Starting a provider/controller test template. |
