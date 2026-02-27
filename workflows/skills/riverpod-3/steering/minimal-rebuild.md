# Minimal rebuild patterns (Riverpod 3)

## The goal
Only the widgets that *use* a value should rebuild when that value changes.

## Patterns

### 1) `select` in widgets
Use select to watch one field:

```dart
final title = ref.watch(profileControllerProvider.select((s) => s.title));
```

Do this especially for:
- App bars
- Buttons enabled/disabled flags
- Small pieces of derived UI state

### 2) Split widgets by responsibility
- Parent screen: watches overall async state and routes to child widgets.
- Child widgets: pure renderers that take plain Dart values.

### 3) `listen` for side effects
Snackbars, dialogs, navigation:
- use `ref.listen` in build (safe)
- do not “watch + if” side effects

```dart
ref.listen(authStateProvider, (prev, next) {
  if (next is LoggedOut) context.go('/login');
});
```

### 4) Avoid rebuilding big lists
If list items update individually:
- expose an item-level family provider:

```dart
@riverpod
Leave? leaveById(Ref ref, {required String id, required String orgId}) {
  final leaves = ref.watch(leaveListControllerProvider(orgId: orgId)).valueOrNull?.items ?? const [];
  return leaves.firstWhereOrNull((e) => e.id == id);
}
```

Then each tile watches only its item:

```dart
final leave = ref.watch(leaveByIdProvider(id: leaveId, orgId: orgId));
```

### 5) Keep state immutable
If you mutate a List in-place, Riverpod can't detect changes reliably and `select` optimizations break.
Always replace collections:
- `state = state.copyWith(items: [...state.items, ...newItems]);`
- `List.unmodifiable(...)`

## Under-the-hood mental model (why this works)

- Providers form a dependency graph.
- `ref.watch` registers a dependency edge.
- When a provider emits a new value, dependents are invalidated and rebuilt.
- `select` narrows the dependency to a projected value, reducing rebuild triggers.
