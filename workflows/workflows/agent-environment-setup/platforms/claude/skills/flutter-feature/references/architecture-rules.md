# Architecture Rules Reference

## Layer Boundaries (NEVER cross these)
- Repository knows: Drift DAO + Retrofit API + OutboxService. Nothing else.
- Service knows: repositories and other services. Zero Flutter, zero Riverpod.
- Notifier knows: providers, services. Calls service/repo. Updates AppState.
- Widget knows: notifier. Renders AppState. Calls notifier methods.
- Cross-feature data: compose at the Riverpod provider layer ONLY (never repo→repo imports).

## File Rules
- One public class per file. Filename = class name in snake_case.
- Private helpers used only by that class may colocate.
- Extension methods on the class may colocate.
- If a helper is used by 2+ classes → give it its own file.

## Naming
- Files: `<feature>_<suffix>.dart` (e.g. `product_repository.dart`)
- Classes: `<Feature><Suffix>` (e.g. `ProductRepository`)
- Provider variables: `<feature><Suffix>Provider` (e.g. `productRepositoryProvider`)
- All codegen annotations: `@riverpod` (lowercase) on provider functions and Notifier classes

## AppState<T> — All 5 cases must be handled
```dart
sealed class AppState<T> {
  const factory AppState.loading()                                      = _Loading;
  const factory AppState.data(T value)                                  = _Data;
  const factory AppState.empty()                                        = _Empty;
  const factory AppState.error(AppError error)                          = _Error;
  const factory AppState.deadLetter({required AppError error, required String requestId}) = _DeadLetter;
}
```

## AppError — Every error must carry a requestId
```dart
sealed class AppError {
  const factory AppError.client({required String requestId, required int statusCode, required String userMessage, String? developerMessage}) = ClientError;
  const factory AppError.server({required String requestId, required int statusCode, required String userMessage}) = ServerError;
  const factory AppError.network({required String requestId, required String userMessage, int retryCount}) = NetworkError;
  const factory AppError.database({required String requestId, required String userMessage, required Object cause}) = DatabaseError;
  const factory AppError.syncDead({required String requestId, required String feature, required String operation, required String userMessage, required List<String> errorLog}) = SyncDeadError;
  const factory AppError.conflict({required String requestId, required String userMessage, required Map<String, dynamic> localData, required Map<String, dynamic> serverData}) = ConflictError;
}
```

## Repository Write Pattern (always)
```dart
Future<T> create(CreateInput input) async {
  final operationId = const Uuid().v4();
  final local = await dao.insert(input.toCompanion(operationId));
  await outbox.enqueue(operationId: operationId, feature: '<n>', operation: 'create', payload: input.toJson());
  if (await connectivity.isOnline) outbox.drainNow().ignore();
  return local;
}
```

## Notifier Pattern (always thin)
```dart
@riverpod
class <N>Notifier extends _$<N>Notifier {
  @override
  AppState<List<T>> build() {
    ref.listen(<n>StreamProvider, (_, next) {
      next.when(
        data: (items) => state = items.isEmpty ? const AppState.empty() : AppState.data(items),
        loading: () => state = const AppState.loading(),
        error: (e, _) => state = AppState.error(_mapError(e)),
      );
    });
    return const AppState.loading();
  }
  AppError _mapError(Object e) => ref.read(errorHandlerProvider).map(e);
}
```

## Design System — NEVER hardcode
- Colors: `AppColors.<name>` only
- Spacing: `AppSpacing.xs/sm/md/lg/xl/xxl` (4/8/16/24/32/48)
- Radius: `AppRadius.sm/md/lg/full`
- Text: `AppTypography.<style>` only
- SyncStatusBadge: required on any widget displaying a record with syncStatus

## Auth Storage Rules
- Access token + refresh token → `FlutterSecureStorage` only
- Non-sensitive (userId, locale, theme) → `SharedPreferences`
- NEVER store tokens in SharedPreferences
