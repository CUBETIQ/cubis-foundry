# Test Utilities Guide

## Overview

Well-organized test utilities reduce boilerplate, improve readability, and make tests easier to maintain. This guide covers common patterns for test helpers, mocks, factories, and setup.

## Project Structure

```
test/
├── helpers/
│   ├── mocks.dart           # All mock classes
│   ├── fakes.dart           # Fake implementations
│   ├── factories.dart       # Test data factories
│   ├── matchers.dart        # Custom matchers
│   ├── pump_app.dart        # Widget test helpers
│   └── test_helpers.dart    # General utilities
├── fixtures/
│   ├── user_fixtures.json
│   └── api_responses/
│       ├── users_response.json
│       └── error_response.json
└── flutter_test_config.dart # Global test configuration
```

## Mock Classes

### Centralized Mocks

```dart
// test/helpers/mocks.dart
import 'package:mocktail/mocktail.dart';

// Repositories
class MockUserRepository extends Mock implements UserRepository {}
class MockAuthRepository extends Mock implements AuthRepository {}
class MockOvertimeRepository extends Mock implements OvertimeRepository {}

// Services
class MockApiClient extends Mock implements ApiClient {}
class MockLocalStorage extends Mock implements LocalStorage {}
class MockAnalyticsService extends Mock implements AnalyticsService {}

// Use Cases
class MockLoginUseCase extends Mock implements LoginUseCase {}
class MockGetUserUseCase extends Mock implements GetUserUseCase {}

// Register fallback values
void registerFallbackValues() {
  registerFallbackValue(User(id: '', name: '', email: ''));
  registerFallbackValue(LoginRequest(email: '', password: ''));
  registerFallbackValue(OvertimeRequest(
    startDate: DateTime.now(),
    endDate: DateTime.now(),
    duration: 0,
  ));
}
```

### Using Mocks

```dart
import '../../../../new_power/flutter-test-master/steering/helpers/mocks.dart';

void main() {
  setUpAll(() {
    registerFallbackValues();
  });

  late MockUserRepository mockRepo;

  setUp(() {
    mockRepo = MockUserRepository();
  });

  test('example', () {
    when(() => mockRepo.getUser(any()))
        .thenAnswer((_) async => User(id: '1', name: 'Test'));
    // ...
  });
}
```

## Fake Implementations

```dart
// test/helpers/fakes.dart

/// Fake implementation for testing without network
class FakeUserRepository implements UserRepository {
  final List<User> _users = [];

  @override
  Future<List<User>> getUsers() async => _users;

  @override
  Future<User> getUser(String id) async {
    return _users.firstWhere(
      (u) => u.id == id,
      orElse: () => throw NotFoundException('User not found'),
    );
  }

  @override
  Future<User> createUser(CreateUserRequest request) async {
    final user = User(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: request.name,
      email: request.email,
    );
    _users.add(user);
    return user;
  }

  @override
  Future<void> deleteUser(String id) async {
    _users.removeWhere((u) => u.id == id);
  }

  // Helper methods for tests
  void seedUsers(List<User> users) {
    _users.addAll(users);
  }

  void clear() {
    _users.clear();
  }
}

/// Fake local storage for testing
class FakeLocalStorage implements LocalStorage {
  final Map<String, dynamic> _data = {};

  @override
  Future<void> write(String key, dynamic value) async {
    _data[key] = value;
  }

  @override
  Future<T?> read<T>(String key) async {
    return _data[key] as T?;
  }

  @override
  Future<void> delete(String key) async {
    _data.remove(key);
  }

  @override
  Future<void> clear() async {
    _data.clear();
  }
}
```

## Test Data Factories

```dart
// test/helpers/factories.dart

class UserFactory {
  static int _counter = 0;

  static User create({
    String? id,
    String? name,
    String? email,
    UserRole? role,
  }) {
    _counter++;
    return User(
      id: id ?? 'user-$_counter',
      name: name ?? 'Test User $_counter',
      email: email ?? 'user$_counter@test.com',
      role: role ?? UserRole.employee,
    );
  }

  static List<User> createList(int count, {UserRole? role}) {
    return List.generate(count, (_) => create(role: role));
  }

  static User admin({String? name}) {
    return create(name: name, role: UserRole.admin);
  }

  static User manager({String? name}) {
    return create(name: name, role: UserRole.manager);
  }
}

class OvertimeFactory {
  static int _counter = 0;

  static Overtime create({
    String? id,
    String? userId,
    DateTime? startDate,
    int? duration,
    OvertimeStatus? status,
  }) {
    _counter++;
    final start = startDate ?? DateTime.now();
    final dur = duration ?? 60;

    return Overtime(
      id: id ?? 'overtime-$_counter',
      userId: userId ?? 'user-1',
      organizationId: 'org-1',
      startDate: start,
      endDate: start.add(Duration(minutes: dur)),
      duration: dur,
      status: status ?? OvertimeStatus.pending,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  static List<Overtime> createList(int count, {OvertimeStatus? status}) {
    return List.generate(count, (_) => create(status: status));
  }

  static Overtime pending() => create(status: OvertimeStatus.pending);
  static Overtime approved() => create(status: OvertimeStatus.approved);
  static Overtime rejected() => create(status: OvertimeStatus.rejected);
}
```

## Custom Matchers

```dart
// test/helpers/matchers.dart
import 'package:flutter_test/flutter_test.dart';

/// Matcher for valid User
Matcher isValidUser = isA<User>()
    .having((u) => u.id, 'id', isNotEmpty)
    .having((u) => u.name, 'name', isNotEmpty)
    .having((u) => u.email, 'email', contains('@'));

/// Matcher for User with specific role
Matcher hasRole(UserRole role) => isA<User>()
    .having((u) => u.role, 'role', equals(role));

/// Matcher for exception with message
Matcher hasErrorMessage(String message) => isA<AppException>()
    .having((e) => e.message, 'message', contains(message));

/// Matcher for AsyncValue states
Matcher isAsyncLoading<T>() => isA<AsyncValue<T>>()
    .having((v) => v.isLoading, 'isLoading', isTrue);

Matcher isAsyncData<T>(T data) => isA<AsyncValue<T>>()
    .having((v) => v.value, 'value', equals(data));

Matcher isAsyncError<T>() => isA<AsyncValue<T>>()
    .having((v) => v.hasError, 'hasError', isTrue);

/// Matcher for list ordering
Matcher isSortedBy<T>(Comparable Function(T) selector) {
  return predicate<List<T>>((list) {
    for (var i = 0; i < list.length - 1; i++) {
      if (selector(list[i]).compareTo(selector(list[i + 1])) > 0) {
        return false;
      }
    }
    return true;
  }, 'is sorted');
}

// Usage
expect(user, isValidUser);
expect(user, hasRole(UserRole.admin));
expect(() => login(), throwsA(hasErrorMessage('Invalid')));
expect(users, isSortedBy<User>((u) => u.name));
```

## Widget Test Helpers

```dart
// test/helpers/pump_app.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

extension PumpApp on WidgetTester {
  /// Pump widget with MaterialApp and ProviderScope
  Future<void> pumpApp(
    Widget widget, {
    List<Override> overrides = const [],
    ThemeData? theme,
  }) async {
    await pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          theme: theme,
          debugShowCheckedModeBanner: false,
          home: widget,
        ),
      ),
    );
  }

  /// Pump widget with Scaffold wrapper
  Future<void> pumpAppWithScaffold(
    Widget widget, {
    List<Override> overrides = const [],
  }) async {
    await pumpApp(
      Scaffold(body: widget),
      overrides: overrides,
    );
  }

  /// Pump widget with GoRouter
  Future<void> pumpAppWithRouter(
    GoRouter router, {
    List<Override> overrides = const [],
  }) async {
    await pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp.router(
          routerConfig: router,
          debugShowCheckedModeBanner: false,
        ),
      ),
    );
  }

  /// Get ProviderContainer from widget tree
  ProviderContainer getContainer() {
    final element = this.element(find.byType(ProviderScope));
    return ProviderScope.containerOf(element);
  }
}

/// Create a test GoRouter
GoRouter createTestRouter({
  String initialLocation = '/',
  required List<RouteBase> routes,
}) {
  return GoRouter(
    initialLocation: initialLocation,
    routes: routes,
  );
}
```

## Provider Container Helper

```dart
// test/helpers/test_helpers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Creates a ProviderContainer with automatic disposal
ProviderContainer createContainer({
  List<Override> overrides = const [],
  ProviderContainer? parent,
}) {
  final container = ProviderContainer(
    overrides: overrides,
    parent: parent,
  );
  addTearDown(container.dispose);
  return container;
}

/// Extension for easier async provider testing
extension ProviderContainerX on ProviderContainer {
  /// Wait for async provider and return value
  Future<T> readAsync<T>(ProviderListenable<AsyncValue<T>> provider) async {
    final value = read(provider);
    if (value is AsyncData<T>) {
      return value.value;
    }
    return await read(provider.future);
  }

  /// Listen and collect all state changes
  List<T> collectStates<T>(ProviderListenable<T> provider) {
    final states = <T>[];
    listen(
      provider,
      (_, next) => states.add(next),
      fireImmediately: true,
    );
    return states;
  }
}
```

## JSON Fixtures

```dart
// test/helpers/fixtures.dart
import 'dart:convert';
import 'dart:io';

class Fixtures {
  static final _cache = <String, dynamic>{};

  static Future<Map<String, dynamic>> loadJson(String path) async {
    if (_cache.containsKey(path)) {
      return _cache[path] as Map<String, dynamic>;
    }

    final file = File('test/fixtures/$path');
    final content = await file.readAsString();
    final json = jsonDecode(content) as Map<String, dynamic>;
    _cache[path] = json;
    return json;
  }

  static Future<List<dynamic>> loadJsonList(String path) async {
    final file = File('test/fixtures/$path');
    final content = await file.readAsString();
    return jsonDecode(content) as List<dynamic>;
  }
}

// Usage
test('should parse user response', () async {
  final json = await Fixtures.loadJson('api_responses/user_response.json');
  final user = User.fromJson(json);
  expect(user.name, equals('John Doe'));
});
```

## Global Test Configuration

```dart
// test/flutter_test_config.dart
import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import '../../../../new_power/flutter-test-master/steering/helpers/mocks.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  // Register fallback values for mocktail
  registerFallbackValues();

  // Set up global test configuration
  TestWidgetsFlutterBinding.ensureInitialized();

  // Run tests
  await testMain();
}
```

## Common Test Patterns

### Setup and Teardown

```dart
void main() {
  late MockUserRepository mockRepo;
  late GetUserUseCase useCase;

  setUpAll(() {
    // Run once before all tests
    registerFallbackValues();
  });

  setUp(() {
    // Run before each test
    mockRepo = MockUserRepository();
    useCase = GetUserUseCase(mockRepo);
  });

  tearDown(() {
    // Run after each test
    reset(mockRepo);
  });

  tearDownAll(() {
    // Run once after all tests
  });

  // Tests...
}
```

### Grouping Tests

```dart
void main() {
  group('UserRepository', () {
    group('getUser', () {
      test('should return user when found', () { ... });
      test('should throw when not found', () { ... });
    });

    group('createUser', () {
      test('should create and return user', () { ... });
      test('should throw on duplicate email', () { ... });
    });
  });
}
```

### Parameterized Tests

```dart
void main() {
  final testCases = [
    ('valid@email.com', true),
    ('invalid', false),
    ('', false),
    ('test@domain.org', true),
  ];

  for (final (email, isValid) in testCases) {
    test('email "$email" should be ${isValid ? "valid" : "invalid"}', () {
      final result = Validators.isValidEmail(email);
      expect(result, equals(isValid));
    });
  }
}
```

### Async Test Helpers

```dart
/// Wait for condition with timeout
Future<void> waitFor(
  bool Function() condition, {
  Duration timeout = const Duration(seconds: 5),
  Duration interval = const Duration(milliseconds: 100),
}) async {
  final stopwatch = Stopwatch()..start();
  while (!condition()) {
    if (stopwatch.elapsed > timeout) {
      throw TimeoutException('Condition not met within timeout');
    }
    await Future.delayed(interval);
  }
}

// Usage
await waitFor(() => container.read(userProvider).hasValue);
```

## Running Tests

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run specific directory
flutter test test/features/auth/

# Run tests matching pattern
flutter test --name "should login"

# Run with verbose output
flutter test --reporter expanded

# Run in random order
flutter test --test-randomize-ordering-seed random
```
