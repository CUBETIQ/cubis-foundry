# Infinite loop & rebuild-storm avoidance (Riverpod 3)

## Common loop sources

### 1) Mutation calls in widget build
Bad:
```dart
if (needsLoad) ref.read(itemsControllerProvider.notifier).load();
```
Every rebuild can re-trigger the write path.

Fix:
- Trigger in explicit user callbacks.
- Trigger initial load in provider `build()`.
- Use `ref.listenManual` in widget lifecycle when you need one-time imperative hooks.

### 2) Self-invalidating provider build
Bad:
- `build()` unconditionally calls `ref.invalidateSelf()`.
- `build()` performs persistent writes each run.

Fix:
- Keep `build()` declarative.
- Mutations belong in methods.
- Use dependency `watch` so recompute happens naturally when inputs change.

### 3) Wrong watch/read boundaries
Bad:
```dart
onPressed: () async {
  final v = ref.watch(filtersProvider); // WRONG
}
```
Fix:
```dart
onPressed: () async {
  final v = ref.read(filtersProvider);
}
```

### 4) In-place state mutation
Bad:
```dart
state.value!.items.add(item);
state = state;
```
Fix:
```dart
final current = state.valueOrNull ?? const ItemsState(items: []);
state = AsyncData(current.copyWith(items: [...current.items, item]));
```

### 5) Circular provider graph
Bad:
- `aProvider` watches `bProvider`
- `bProvider` watches `aProvider`

Fix:
- Extract shared dependency into `baseProvider`.
- Keep read model and write model separated.

## Quick debug flow

1. Identify the smallest widget rebuilding repeatedly.
2. Search for `invalidateSelf`, `state =`, and notifier calls in build paths.
3. Confirm no `watch` usage in callbacks.
4. Confirm immutable updates and stable family params.
5. Add temporary logs to provider build/mutation methods to locate loop edge.
