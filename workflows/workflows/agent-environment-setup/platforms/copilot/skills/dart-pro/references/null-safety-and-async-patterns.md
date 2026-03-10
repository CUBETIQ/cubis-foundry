# Null Safety and Async Patterns

## Null safety rules

### Non-nullable by default

- `String name` means name is never null. `String? name` means null is a valid value.
- Use `?` only when null carries domain meaning (e.g., "no value selected"), not as a lazy default.
- Avoid `late` unless the variable is guaranteed to be initialized before use and you cannot restructure to avoid it.

### Null assertion (`!`) usage

- **Never** use `!` without a preceding null check or guard in the same scope in production code.
- In tests, `!` is acceptable after assertions: `expect(result, isNotNull); result!.doSomething();`
- Prefer `if-case` or null-aware operators (`?.`, `??`) over `!`.

### Null-aware operators cheatsheet

| Operator | Meaning                      | Example                    |
| -------- | ---------------------------- | -------------------------- |
| `?.`     | Call method only if non-null | `user?.name`               |
| `??`     | Default if null              | `name ?? 'Unknown'`        |
| `??=`    | Assign if null               | `cache ??= compute()`      |
| `?..`    | Cascade only if non-null     | `list?..add(item)..sort()` |

## Sealed classes and pattern matching

### Defining sealed hierarchies

```dart
sealed class AuthState {}
class Unauthenticated extends AuthState {}
class Authenticating extends AuthState {}
class Authenticated extends AuthState {
  final User user;
  Authenticated(this.user);
}
```

- Sealed classes enable **exhaustive switch** — the compiler errors if a subtype is missing.
- Adding a new subtype immediately surfaces all locations that need updating.

### Exhaustive switch

```dart
Widget build(AuthState state) => switch (state) {
  Unauthenticated() => const LoginPage(),
  Authenticating()  => const LoadingSpinner(),
  Authenticated(:final user) => HomePage(user: user),
};
```

- Use destructuring (`:final field`) to extract values in switch arms.
- Prefer switch expressions over if/else chains for sealed types.

## Records

```dart
(int, String) parseHeader(String line) {
  final parts = line.split(':');
  return (int.parse(parts[0]), parts[1].trim());
}

final (code, message) = parseHeader('200: OK');
```

- Use records for lightweight grouped returns — no need to create single-use classes.
- Name fields for clarity: `({int id, String name}) getUserInfo()`.
- Records are value types: equality is structural, not referential.

## Async patterns

### Future best practices

- Always `await` Futures. Never fire-and-forget unless you explicitly handle errors with `.catchError` or a zone.
- Use `Future.wait` for concurrent independent operations, not sequential `await` calls.
- Handle errors with try/catch around `await`, not `.catchError` chains.

### Stream lifecycle management

```dart
class EventManager {
  final _controller = StreamController<Event>.broadcast();
  Stream<Event> get events => _controller.stream;

  void emit(Event e) => _controller.add(e);

  void dispose() {
    _controller.close(); // Always close controllers
  }
}
```

- Use `StreamController` (not broadcast) when only one listener is expected.
- Use `.broadcast()` only when multiple listeners must receive the same events.
- Always cancel `StreamSubscription` in `dispose()` or `deactivate()`.
- Prefer `async*` generator functions for producing streams from iteration or polling.

### Isolate patterns

```dart
// Simple isolate for CPU-heavy work
final result = await Isolate.run(() {
  return heavyComputation(data);
});
```

- Use `Isolate.run()` (Dart 2.19+) for one-shot CPU work. It handles spawning and result transfer.
- In Flutter, use `compute()` for the same pattern with simpler API.
- For long-lived isolates, use `ReceivePort`/`SendPort` for bidirectional communication.
- Only `Sendable` objects can cross isolate boundaries. Classes with closures or raw pointers cannot be sent.

## Error handling in async code

```dart
Future<User> fetchUser(int id) async {
  try {
    final response = await http.get(Uri.parse('/users/$id'));
    if (response.statusCode != 200) {
      throw HttpException('Failed to fetch user: ${response.statusCode}');
    }
    return User.fromJson(jsonDecode(response.body));
  } on SocketException {
    throw NetworkException('No network connection');
  } on FormatException {
    throw ParseException('Invalid response format');
  }
}
```

- Catch specific exceptions. Avoid bare `catch (e)` unless you re-throw.
- Transform low-level exceptions into domain-specific exceptions at service boundaries.
- Use `Zone.current.handleUncaughtError` or `runZonedGuarded` for global error handling in Flutter.
