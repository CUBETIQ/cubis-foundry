# Sealed Classes, Records, and Pattern Matching

## Sealed Class Hierarchies

```dart
// Sealed classes define closed type sets — switch must be exhaustive
sealed class AuthState {}

class Unauthenticated extends AuthState {}
class Authenticating extends AuthState {}
class Authenticated extends AuthState {
  final User user;
  Authenticated(this.user);
}
class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
}

// Exhaustive switch — compiler error if a variant is missing
Widget buildAuth(AuthState state) => switch (state) {
  Unauthenticated()  => const LoginScreen(),
  Authenticating()   => const LoadingSpinner(),
  Authenticated(:final user) => HomeScreen(user: user),
  AuthError(:final message)  => ErrorScreen(message: message),
};
```

## Records for Lightweight Data

```dart
// Positional records — unnamed fields
(int, String) parseIdAndName(String input) {
  final parts = input.split(':');
  return (int.parse(parts[0]), parts[1]);
}

// Named fields
({double lat, double lng}) parseCoordinate(String s) {
  final parts = s.split(',');
  return (lat: double.parse(parts[0]), lng: double.parse(parts[1]));
}

// Destructuring
final (id, name) = parseIdAndName('42:Alice');
final (:lat, :lng) = parseCoordinate('51.5,-0.1');

// Records have value equality
final a = (1, 'hello');
final b = (1, 'hello');
print(a == b); // true — structural equality
```

## Pattern Matching

### If-case Patterns

```dart
// Replace is + cast with if-case
// BAD
if (response is Map<String, dynamic>) {
  final name = response['name'] as String?;
  if (name != null) {
    processName(name);
  }
}

// GOOD — destructuring in if-case
if (response case {'name': String name}) {
  processName(name); // name is already typed as String
}

// Nested patterns
if (json case {'user': {'name': String name, 'age': int age}}) {
  print('$name is $age years old');
}
```

### Switch Expression Patterns

```dart
// Object patterns — match on properties
String describe(Shape shape) => switch (shape) {
  Circle(radius: var r) when r > 100 => 'large circle',
  Circle(radius: var r)              => 'circle with radius $r',
  Rectangle(width: var w, height: var h) when w == h => 'square ${w}x$h',
  Rectangle(:var width, :var height) => 'rect ${width}x$height',
};

// Logical or patterns
String httpCategory(int status) => switch (status) {
  200 || 201 || 204 => 'success',
  301 || 302        => 'redirect',
  400 || 422        => 'client error',
  500 || 502 || 503 => 'server error',
  _                 => 'unknown',
};

// Guard clauses with when
String classify(num value) => switch (value) {
  < 0 => 'negative',
  == 0 => 'zero',
  > 0 && < 100 => 'small positive',
  >= 100 => 'large positive',
  _ => 'NaN', // for double.nan
};
```

### Exhaustiveness Checking

```dart
// Sealed types + switch = compile-time exhaustiveness
sealed class Result<T> {}
class Success<T> extends Result<T> { final T value; Success(this.value); }
class Failure<T> extends Result<T> { final Exception error; Failure(this.error); }

// Compiler enforces both Success and Failure are handled
T unwrap<T>(Result<T> result) => switch (result) {
  Success(:final value) => value,
  Failure(:final error) => throw error,
  // No default needed — sealed class makes this exhaustive
};

// Adding a new variant (e.g., Loading) causes compile errors everywhere
```

## Extension Types (Dart 3.3+)

```dart
// Zero-cost type wrappers — compiled away at runtime
extension type UserId(int value) {
  // Only UserId-specific methods are available
  bool get isValid => value > 0;
}

extension type Email(String value) {
  factory Email.parse(String input) {
    if (!input.contains('@')) throw FormatException('Invalid email: $input');
    return Email(input.toLowerCase());
  }
}

// Type safety without runtime overhead
void sendEmail(Email to, UserId from) { /*...*/ }

// Can't accidentally pass raw int/String where UserId/Email is expected
sendEmail(Email.parse('alice@example.com'), UserId(42));
```

## Class Modifiers (Dart 3.0+)

```dart
// interface class — can implement but not extend
interface class Serializable {
  Map<String, dynamic> toJson();
}

// base class — can extend but not implement
base class BaseRepository {
  Future<void> connect() async { /*...*/ }
}

// final class — cannot be extended or implemented outside the library
final class InternalConfig {
  final String apiKey;
  InternalConfig(this.apiKey);
}

// mixin class — can be used as both mixin and class
mixin class Logging {
  void log(String message) => print('[LOG] $message');
}
```
