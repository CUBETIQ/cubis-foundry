# Outbox Pattern Reference

## The Rule
Every write = local Drift first → outbox enqueue → return immediately.
Never await the network before returning to UI.

## Outbox Table (in AppDatabase)
```dart
class OutboxTable extends Table {
  IntColumn  get id            => integer().autoIncrement()();
  TextColumn get operationId   => text()();   // UUID v4 — dedup key for server
  TextColumn get feature       => text()();   // e.g. 'product', 'sale'
  TextColumn get operation     => text()();   // 'create' | 'update' | 'delete'
  TextColumn get payload       => text()();   // jsonEncode(input.toJson())
  IntColumn  get retryCount    => integer().withDefault(const Constant(0))();
  IntColumn  get maxRetries    => integer().withDefault(const Constant(3))();
  TextColumn get status        => text().withDefault(const Constant('pending'))();
  // pending → processing → done | failed → dead
  DateTimeColumn get createdAt     => dateTime()();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();
  TextColumn     get errorLog      => text().nullable()();
}
```

## Repository Write Template
```dart
Future<T> create(Create<T>Input input) async {
  final operationId = const Uuid().v4();

  // 1. Write locally — always succeeds even offline
  final local = await dao.insert(
    input.toCompanion(operationId: operationId),
  );

  // 2. Queue for sync
  await outbox.enqueue(
    operationId: operationId,
    feature:     '<feature>',
    operation:   'create',
    payload:     input.toJson(),
  );

  // 3. Try immediate sync if online (fire-and-forget)
  if (await connectivity.isOnline) outbox.drainNow().ignore();

  // 4. Return local result — UI never waits for server
  return local;
}
```

## Sync Status on Drift Table
Every table that participates in offline sync adds:
```dart
TextColumn get syncStatus => text()
  .withDefault(const Constant('pendingSync'))();
// Values: pendingSync | synced | failed | dead | conflict
```

## Conflict Strategies
Declare per-feature in the repository or service:
```dart
static const conflictStrategy = ConflictStrategy.clientWins;
// clientWins     — offline action wins (sales, POS)
// serverWins     — server is truth (pricing, master data)
// lastWriteWins  — compare updatedAt timestamps
// manualResolve  — surface ConflictError to user (safety-critical)
```

## OutboxService (auto-drain on reconnect)
The outbox service watches connectivity and auto-drains:
```dart
@override
AppState<OutboxState> build() {
  ref.listen(connectivityProvider, (_, next) {
    if (next == ConnectivityStatus.online) drainNow();
  });
  return const AppState.idle();
}
```

## SyncStatusBadge Usage
Show on any ListTile or Card that displays a record with syncStatus:
```dart
SyncStatusBadge(status: item.syncStatus)
// Renders: 🕐 grey (pendingSync) | ✅ green (synced)
//          ⚠️ amber (failed) | ❌ red (dead) | ⚡ orange (conflict)
```
