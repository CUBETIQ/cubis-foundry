# Riverpod 3 State Management

## Provider Types (Codegen Only)

### Functional Providers
```dart
// Simple sync
@riverpod
String greeting(Ref ref) => 'Hello';

// Async
@riverpod
Future<User> currentUser(Ref ref) async {
  return ref.watch(apiProvider).fetchCurrentUser();
}

// Stream
@riverpod
Stream<List<Message>> messages(Ref ref) {
  return ref.watch(chatProvider).messageStream;
}

// Family (with params)
@riverpod
Future<User> userById(Ref ref, String id) async {
  return ref.watch(apiProvider).fetchUser(id);
}
```

### Notifier Providers
```dart
// Sync Notifier
@riverpod
class Counter extends _$Counter {
  @override
  int build() => 0;
  
  void increment() => state++;
}

// Async Notifier
@riverpod
class TodoList extends _$TodoList {
  @override
  FutureOr<List<Todo>> build() async => fetchTodos();
  
  Future<void> add(Todo todo) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await api.addTodo(todo);
      return [...await future, todo];
    });
  }
}

// Family Notifier
@riverpod
class UserEditor extends _$UserEditor {
  @override
  FutureOr<User> build(String userId) async => fetchUser(userId);
}
```

---

## ✅ DO's

### 1. Use Codegen Always
```dart
// ✅ Always use @riverpod
@riverpod
Future<Data> myProvider(Ref ref) async => fetchData();

@riverpod
class MyNotifier extends _$MyNotifier {
  @override
  FutureOr<State> build() async => initialState();
}
```

### 2. Single Responsibility Per Provider
```dart
// ✅ One provider = one concern
@riverpod
Future<User> currentUser(Ref ref) async => fetchUser();

@riverpod
Future<List<Todo>> userTodos(Ref ref) async {
  final user = await ref.watch(currentUserProvider.future);
  return fetchTodos(user.id);
}
```

### 3. Use ref.mounted After Async
```dart
@riverpod
class MyNotifier extends _$MyNotifier {
  @override
  FutureOr<Data> build() async => fetchData();
  
  Future<void> update() async {
    final result = await api.update();
    if (!ref.mounted) return; // ✅ Always check
    state = AsyncData(result);
  }
}
```

### 4. Use AsyncValue.guard for Error Handling
```dart
Future<void> save(Data data) async {
  state = const AsyncLoading();
  state = await AsyncValue.guard(() async {
    await api.save(data);
    return data;
  });
}
```

### 5. Invalidate Instead of Manual Refresh
```dart
// ✅ Let Riverpod handle refresh
Future<void> refresh() async {
  ref.invalidateSelf();
  await future; // Wait for rebuild
}
```

### 6. Use select() to Reduce Rebuilds
```dart
// ✅ Only rebuild when name changes
final name = ref.watch(userProvider.select((u) => u.value?.name));
```

---

## ❌ DON'Ts

### 1. Don't Use Legacy Providers
```dart
// ❌ NEVER use these (moved to legacy import)
StateProvider
StateNotifierProvider
ChangeNotifierProvider

// ✅ Use codegen instead
@riverpod
class MyNotifier extends _$MyNotifier { ... }
```

### 2. Don't Chain Provider Dependencies Deeply
```dart
// ❌ BAD: Deep chain = refactor nightmare
@riverpod
Future<A> providerA(Ref ref) async => ...;

@riverpod
Future<B> providerB(Ref ref) async {
  final a = await ref.watch(providerAProvider.future);
  return transformA(a);
}

@riverpod
Future<C> providerC(Ref ref) async {
  final b = await ref.watch(providerBProvider.future);
  return transformB(b);
}

@riverpod
Future<D> providerD(Ref ref) async {
  final c = await ref.watch(providerCProvider.future);  // 4 levels deep!
  return transformC(c);
}

// ✅ GOOD: Flat dependencies, use repository pattern
@riverpod
Future<D> providerD(Ref ref) async {
  final repo = ref.watch(repositoryProvider);
  return repo.getD(); // Repository handles the chain internally
}
```

### 3. Don't Watch in Callbacks
```dart
// ❌ BAD
onPressed: () {
  final value = ref.watch(provider); // WRONG!
}

// ✅ GOOD
onPressed: () {
  final value = ref.read(provider); // Use read in callbacks
  ref.read(provider.notifier).doSomething();
}
```

### 4. Don't Mutate State Directly
```dart
// ❌ BAD
state.value!.items.add(item); // Mutating existing object

// ✅ GOOD
state = AsyncData([...state.value!, item]); // New object
```

### 5. Don't Create Providers Inside Build
```dart
// ❌ BAD
Widget build(context, ref) {
  final provider = Provider((ref) => ...); // Created every build!
}

// ✅ GOOD - Define at top level
@riverpod
Data myProvider(Ref ref) => ...;
```

### 6. Don't Ignore Errors
```dart
// ❌ BAD
final data = ref.watch(provider).value; // Ignores loading/error

// ✅ GOOD
ref.watch(provider).when(
  data: (d) => show(d),
  loading: () => spinner(),
  error: (e, st) => errorWidget(e),
);
```

---

## 🚫 STRICT RULES (Avoid Chain Refactoring)

### Rule 1: Max 2 Levels of Provider Dependencies
```dart
// ✅ OK: 2 levels
userProvider → userTodosProvider

// ❌ BAD: 3+ levels
userProvider → userTodosProvider → filteredTodosProvider → sortedTodosProvider
```

### Rule 2: Use Repository Pattern for Complex Data
```dart
// ✅ Repository encapsulates complexity
@riverpod
TodoRepository todoRepository(Ref ref) {
  return TodoRepository(
    api: ref.watch(apiProvider),
    db: ref.watch(dbProvider),
    auth: ref.watch(authProvider),
  );
}

@riverpod
class TodoListNotifier extends _$TodoListNotifier {
  @override
  FutureOr<List<Todo>> build() async {
    return ref.watch(todoRepositoryProvider).getTodos();
  }
}
```

### Rule 3: Feature Providers Stay in Feature
```dart
// ✅ Feature-scoped providers
// features/todo/presentation/providers/
@riverpod
class TodoListNotifier extends _$TodoListNotifier { ... }

// ❌ Don't let other features depend on this directly
// Instead, use shared domain layer
```

### Rule 4: Shared State Goes to Core
```dart
// core/providers/
@riverpod
Future<User> currentUser(Ref ref) async => ...;

@riverpod
AuthState auth(Ref ref) => ...;

// Features can depend on core, not on each other
```

### Rule 5: Use keepAlive for App-Wide State
```dart
@Riverpod(keepAlive: true)
Future<AppConfig> appConfig(Ref ref) async => loadConfig();

@Riverpod(keepAlive: true)
class AuthNotifier extends _$AuthNotifier { ... }
```

### Rule 6: Prefer Composition Over Inheritance
```dart
// ✅ Compose providers
@riverpod
Future<DashboardData> dashboard(Ref ref) async {
  final user = await ref.watch(currentUserProvider.future);
  final todos = await ref.watch(userTodosProvider(user.id).future);
  final stats = await ref.watch(userStatsProvider(user.id).future);
  return DashboardData(user: user, todos: todos, stats: stats);
}
```

---

## Ref Methods

```dart
ref.watch(provider)           // Subscribe to changes (use in build)
ref.read(provider)            // Read once (use in callbacks)
ref.listen(provider, (p, n) {})  // Listen with callback
ref.invalidate(provider)      // Force refresh another provider
ref.invalidateSelf()          // Refresh current provider
ref.mounted                   // Check if still active after async
ref.onDispose(() {})          // Cleanup callback
ref.keepAlive()               // Prevent auto-dispose
```

## AsyncValue Handling

```dart
// Pattern matching (sealed in Riverpod 3)
switch (state) {
  case AsyncData(:final value): return Text(value);
  case AsyncError(:final error): return Text('Error: $error');
  case AsyncLoading(): return CircularProgressIndicator();
}

// .when method
state.when(
  data: (data) => Text(data),
  loading: () => CircularProgressIndicator(),
  error: (e, st) => Text('Error: $e'),
);

// Properties
state.value          // T? (null if loading/error)
state.requireValue   // T (throws if not data)
state.hasValue       // bool
state.isLoading      // bool
state.hasError       // bool
```

## Provider Options

```dart
// Keep alive (don't auto-dispose)
@Riverpod(keepAlive: true)
Future<Config> appConfig(Ref ref) async => loadConfig();

// Custom retry
@Riverpod(retry: myRetryFunction)
Future<Data> withRetry(Ref ref) async => fetchData();

Duration? myRetryFunction(int retryCount, Object error) {
  if (retryCount > 3) return null;
  return Duration(seconds: retryCount * 2);
}
```

## Testing

```dart
void main() {
  test('notifier test', () {
    final container = ProviderContainer.test(
      overrides: [
        todoRepositoryProvider.overrideWithValue(MockTodoRepository()),
        // Override just the build method
        myNotifierProvider.overrideWithBuild((ref) => initialState),
      ],
    );
    
    final notifier = container.read(todoListNotifierProvider.notifier);
    notifier.add(Todo(title: 'Test'));
    
    expect(container.read(todoListNotifierProvider).value, hasLength(1));
  });
}
```

## Migration from Riverpod 2

```dart
// ❌ Old (Riverpod 2)
final provider = FutureProvider.autoDispose<Data>((ref) async => ...);
class MyNotifier extends AutoDisposeAsyncNotifier<Data> { ... }
Future<Data> myProvider(MyProviderRef ref) async { ... }

// ✅ New (Riverpod 3)
@riverpod
Future<Data> myProvider(Ref ref) async => ...;

@riverpod
class MyNotifier extends _$MyNotifier {
  @override
  FutureOr<Data> build() async => ...;
}
```
