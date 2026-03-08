# Paged Controller Template

Infinite scroll controller with clean initial/refresh/load-more separation.

## Usage

1. Copy `paged_controller.dart.tmpl` to your feature root (e.g., `features/<feature>/`)
2. Rename file and update part directives
3. Replace `Item` with your entity type
4. Replace `itemRepositoryProvider` with your repository provider
5. Run `flutter pub run build_runner build`

## Key Features

- **Initial load**: `build()` fetches first page
- **Refresh**: `refresh()` invalidates and re-fetches from scratch
- **Load more**: `loadNextPage()` appends without losing current items
- **Error handling**: `loadMoreError` captures pagination errors separately

## State Fields

| Field | Type | Description |
|-------|------|-------------|
| `items` | `List<Item>` | All loaded items (immutable) |
| `nextCursor` | `String?` | Cursor for next page |
| `hasMore` | `bool` | Whether more pages exist |
| `isLoadingMore` | `bool` | Loading indicator for pagination |
| `loadMoreError` | `String?` | Error from load more (not initial) |

## View Integration

```dart
NotificationListener<ScrollNotification>(
  onNotification: (notification) {
    if (notification is ScrollEndNotification &&
        notification.metrics.extentAfter < 200 &&
        state.hasMore && !state.isLoadingMore) {
      ref.read(provider.notifier).loadNextPage();
    }
    return false;
  },
  child: RefreshIndicator(
    onRefresh: () => ref.read(provider.notifier).refresh(),
    child: ListView.builder(...),
  ),
)
```

## Notes

- Uses `ref.watch` in `build()` for repository (establishes dependency)
- Uses `ref.read` in `loadNextPage()` (no rebuild needed)
- Build params accessible via `this.orgId` in methods
- State is always immutable (`List.unmodifiable`)
