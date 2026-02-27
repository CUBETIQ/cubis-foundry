# Refresh + paging + caching patterns (Riverpod 3)

## 1) Refresh

Controller pattern:

```dart
Future<void> refresh() async {
  ref.invalidateSelf();
  await future;
}
```

UI pattern:

```dart
RefreshIndicator(
  onRefresh: () => ref.read(itemsControllerProvider(query: query).notifier).refresh(),
  child: ItemsList(items: items),
)
```

Notes:
- `invalidateSelf` marks provider stale and recomputes on next read.
- Use `ref.refresh(provider)` when you need an immediate fresh value in imperative code.

## 2) Paging

Represent load-more state separately from initial AsyncValue:

```dart
@freezed
class PagedState<T> with _$PagedState<T> {
  const factory PagedState({
    @Default(<T>[]) List<T> items,
    String? nextCursor,
    @Default(true) bool hasMore,
    @Default(false) bool isLoadingMore,
    String? loadMoreError,
  }) = _PagedState<T>;
}
```

Rules:
- guard parallel `loadMore` calls,
- append immutably,
- reset cursor/items on refresh.

## 3) Caching strategy

### In-memory (provider cache)
- Provider values are cached while alive.
- Families cache by parameter instance.
- Default auto-dispose is safer for high-cardinality families.

### Persistent (storage-agnostic)
Cache belongs in repository/data layer, not widget layer.
Storage can be Drift/SQLite/Isar/Hive/etc.

Recommended read flow:
1. return fresh local cache if available,
2. fetch remote when needed,
3. persist new data,
4. emit updated state.

## 4) KeepAlive guidance

### Static keepAlive
Use annotation-level keepAlive for truly app-wide state:

```dart
@Riverpod(keepAlive: true)
SessionState sessionState(Ref ref) => const SessionState.unknown();
```

### Fine-grained keepAlive on auto-disposed providers
Use `ref.keepAlive()` when you only want to keep successful/fresh results:

```dart
@riverpod
Future<List<Item>> cachedItems(Ref ref) async {
  final link = ref.keepAlive();

  // Example TTL: re-enable auto-dispose after 5 minutes
  final timer = Timer(const Duration(minutes: 5), link.close);
  ref.onDispose(timer.cancel);

  return ref.read(itemsRepositoryProvider).fetch();
}
```

Use keepAlive for:
- low-cardinality app-level state,
- expensive state reused across routes.

Avoid keepAlive for:
- parameterized search/list/detail families,
- route-scoped temporary state.

## 5) Stale-while-revalidate UX

Pattern:
- show cached data immediately,
- show subtle loading indicator during background refresh,
- update list when fresh data arrives,
- keep explicit retry path on error.
