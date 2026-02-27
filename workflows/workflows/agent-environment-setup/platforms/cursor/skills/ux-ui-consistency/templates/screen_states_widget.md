```
// templates/screen_states_widget.tmpl
//
// Standard switch for AsyncValue -> UI states using One* components.

Widget buildAsyncScreen<T>({
  required AsyncValue<T> state,
  required Widget Function(T data) dataBuilder,
  required VoidCallback onRetry,
  Widget? emptyState,
}) {
  return state.when(
    loading: () => const OneProgress.center(),
    error: (e, _) => OneErrorState(
      title: 'Something went wrong',
      message: e.toString(),
      actionLabel: 'Retry',
      onAction: onRetry,
    ),
    data: (data) {
      if (data is Iterable && data.isEmpty) {
        return emptyState ??
            OneEmptyState(
              title: 'No data',
              subtitle: 'Try changing filters or refresh.',
              actionLabel: 'Refresh',
              onAction: onRetry,
            );
      }
      return dataBuilder(data);
    },
  );
}
```
