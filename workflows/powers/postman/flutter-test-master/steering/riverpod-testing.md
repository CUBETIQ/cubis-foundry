# Riverpod Testing Guide

## Overview

Riverpod provides excellent testing support through `ProviderContainer` for unit tests and `ProviderScope` overrides for widget tests. This guide covers patterns for testing all types of Riverpod providers.

## Setup

### Dependencies

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mocktail: ^1.0.3
```

### Test Helpers

```dart
// test/helpers/provider_container.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Creates a ProviderContainer for testing with automatic disposal
ProviderContainer createContainer({
  List<Override> overrides = const [],
}) {
  final container = ProviderContainer(overrides: overrides);
  addTearDown(container.dispose);
  return container;
}
```

## Unit Testing Providers

### Testing Simple Providers

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// Provider to test
final counterProvider = StateProvider<int>((ref) => 0);

void main() {
  test('should have initial value of 0', () {
    final container = createContainer();

    expect(container.read(counterProvider), equals(0));
  });

  test('should increment counter', () {
    final container = createContainer();

    container.read(counterProvider.notifier).state++;

    expect(container.read(counterProvider), equals(1));
  });
}
```

### Testing Notifier Providers

```dart
// Provider to test
@riverpod
class Counter extends _$Counter {
  @override
  int build() => 0;

  void increment() => state++;
  void decrement() => state--;
  void reset() => state = 0;
}

// Test
void main() {
  group('Counter', () {
    test('should have initial value of 0', () {
      final container = createContainer();

      expect(container.read(counterProvider), equals(0));
    });

    test('should increment', () {
      final container = createContainer();

      container.read(counterProvider.notifier).increment();

      expect(container.read(counterProvider), equals(1));
    });

    test('should decrement', () {
      final container = createContainer();
      container.read(counterProvider.notifier).increment();

      container.read(counterProvider.notifier).decrement();

      expect(container.read(counterProvider), equals(0));
    });

    test('should reset to 0', () {
      final container = createContainer();
      container.read(counterProvider.notifier).increment();
      container.read(counterProvider.notifier).increment();

      container.read(counterProvider.notifier).reset();

      expect(container.read(counterProvider), equals(0));
    });
  });
}
```

### Testing AsyncNotifier Providers

```dart
// Provider to test
@riverpod
class UserList extends _$UserList {
  @override
  Future<List<User>> build() async {
    return ref.read(userRepositoryProvider).getUsers();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() =>
      ref.read(userRepositoryProvider).getUsers()
    );
  }

  Future<void> addUser(User user) async {
    await ref.read(userRepositoryProvider).createUser(user);
    ref.invalidateSelf();
  }
}

// Test
class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late MockUserRepository mockRepo;

  setUp(() {
    mockRepo = MockUserRepository();
  });

  group('UserList', () {
    test('should load users on build', () async {
      final users = [User(id: '1', name: 'John')];
      when(() => mockRepo.getUsers()).thenAnswer((_) async => users);

      final container = createContainer(
        overrides: [
          userRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      // Wait for async build
      await container.read(userListProvider.future);

      expect(
        container.read(userListProvider).value,
        equals(users),
      );
    });

    test('should handle loading state', () async {
      when(() => mockRepo.getUsers()).thenAnswer(
        (_) => Future.delayed(
          const Duration(milliseconds: 100),
          () => <User>[],
        ),
      );

      final container = createContainer(
        overrides: [
          userRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      // Initially loading
      expect(container.read(userListProvider).isLoading, isTrue);

      // Wait for completion
      await container.read(userListProvider.future);

      expect(container.read(userListProvider).isLoading, isFalse);
    });

    test('should handle error state', () async {
      when(() => mockRepo.getUsers())
          .thenThrow(Exception('Network error'));

      final container = createContainer(
        overrides: [
          userRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      // Wait and catch error
      try {
        await container.read(userListProvider.future);
      } catch (_) {}

      expect(container.read(userListProvider).hasError, isTrue);
    });

    test('should refresh users', () async {
      final initialUsers = [User(id: '1', name: 'John')];
      final refreshedUsers = [
        User(id: '1', name: 'John'),
        User(id: '2', name: 'Jane'),
      ];

      var callCount = 0;
      when(() => mockRepo.getUsers()).thenAnswer((_) async {
        callCount++;
        return callCount == 1 ? initialUsers : refreshedUsers;
      });

      final container = createContainer(
        overrides: [
          userRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      await container.read(userListProvider.future);
      expect(container.read(userListProvider).value, hasLength(1));

      await container.read(userListProvider.notifier).refresh();
      expect(container.read(userListProvider).value, hasLength(2));
    });
  });
}
```

## Listening to Provider Changes

```dart
test('should track state changes', () async {
  final container = createContainer();
  final states = <int>[];

  container.listen(
    counterProvider,
    (previous, next) => states.add(next),
    fireImmediately: true,
  );

  container.read(counterProvider.notifier).increment();
  container.read(counterProvider.notifier).increment();
  container.read(counterProvider.notifier).decrement();

  expect(states, equals([0, 1, 2, 1]));
});
```

## Mocking Providers

### Override with Value

```dart
test('should use mocked value', () {
  final container = createContainer(
    overrides: [
      userProvider.overrideWithValue(User(id: '1', name: 'Mock User')),
    ],
  );

  expect(container.read(userProvider).name, equals('Mock User'));
});
```

### Override with Provider

```dart
test('should use mocked provider', () {
  final container = createContainer(
    overrides: [
      userRepositoryProvider.overrideWith((ref) => MockUserRepository()),
    ],
  );

  expect(
    container.read(userRepositoryProvider),
    isA<MockUserRepository>(),
  );
});
```

### Override Async Provider

```dart
test('should override async provider', () async {
  final container = createContainer(
    overrides: [
      userListProvider.overrideWith((ref) async {
        return [User(id: '1', name: 'Test User')];
      }),
    ],
  );

  final users = await container.read(userListProvider.future);
  expect(users, hasLength(1));
});
```

## Widget Testing with Riverpod

### Basic Widget Test

```dart
testWidgets('should display user name', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        userProvider.overrideWithValue(User(id: '1', name: 'John')),
      ],
      child: const MaterialApp(home: ProfileScreen()),
    ),
  );

  expect(find.text('John'), findsOneWidget);
});
```

### Testing Loading States

```dart
testWidgets('should show loading indicator', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        userListProvider.overrideWith((ref) async {
          await Future.delayed(const Duration(seconds: 1));
          return <User>[];
        }),
      ],
      child: const MaterialApp(home: UserListScreen()),
    ),
  );

  // Initially shows loading
  expect(find.byType(CircularProgressIndicator), findsOneWidget);

  // Wait for data
  await tester.pumpAndSettle();

  // Loading gone
  expect(find.byType(CircularProgressIndicator), findsNothing);
});
```

### Testing Error States

```dart
testWidgets('should show error message', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        userListProvider.overrideWith((ref) {
          throw Exception('Network error');
        }),
      ],
      child: const MaterialApp(home: UserListScreen()),
    ),
  );

  await tester.pumpAndSettle();

  expect(find.text('Network error'), findsOneWidget);
});
```

### Testing User Interactions

```dart
testWidgets('should increment counter on tap', (tester) async {
  await tester.pumpWidget(
    const ProviderScope(
      child: MaterialApp(home: CounterScreen()),
    ),
  );

  expect(find.text('0'), findsOneWidget);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();

  expect(find.text('1'), findsOneWidget);
});
```

### Accessing Container in Widget Tests

```dart
testWidgets('should access container', (tester) async {
  await tester.pumpWidget(
    const ProviderScope(
      child: MaterialApp(home: CounterScreen()),
    ),
  );

  // Get container from context
  final element = tester.element(find.byType(CounterScreen));
  final container = ProviderScope.containerOf(element);

  // Read provider directly
  expect(container.read(counterProvider), equals(0));

  // Modify state
  container.read(counterProvider.notifier).increment();
  await tester.pump();

  expect(find.text('1'), findsOneWidget);
});
```

## Testing Provider Dependencies

```dart
// Providers with dependencies
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepositoryImpl(ref.read(apiClientProvider));
});

final getUserUseCaseProvider = Provider<GetUserUseCase>((ref) {
  return GetUserUseCase(ref.read(userRepositoryProvider));
});

// Test
void main() {
  test('should inject dependencies correctly', () {
    final mockApiClient = MockApiClient();

    final container = createContainer(
      overrides: [
        apiClientProvider.overrideWithValue(mockApiClient),
      ],
    );

    // Repository should use mocked API client
    final repo = container.read(userRepositoryProvider);
    expect(repo, isA<UserRepositoryImpl>());

    // UseCase should use repository with mocked client
    final useCase = container.read(getUserUseCaseProvider);
    expect(useCase, isA<GetUserUseCase>());
  });
}
```

## Testing Family Providers

```dart
// Family provider
@riverpod
Future<User> user(Ref ref, String userId) async {
  return ref.read(userRepositoryProvider).getUser(userId);
}

// Test
void main() {
  test('should fetch user by id', () async {
    final mockRepo = MockUserRepository();
    when(() => mockRepo.getUser('123'))
        .thenAnswer((_) async => User(id: '123', name: 'John'));

    final container = createContainer(
      overrides: [
        userRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );

    final user = await container.read(userProvider('123').future);

    expect(user.id, equals('123'));
    expect(user.name, equals('John'));
  });

  test('should cache family providers', () async {
    final mockRepo = MockUserRepository();
    when(() => mockRepo.getUser(any()))
        .thenAnswer((_) async => User(id: '123', name: 'John'));

    final container = createContainer(
      overrides: [
        userRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );

    // First call
    await container.read(userProvider('123').future);
    // Second call (should use cache)
    await container.read(userProvider('123').future);

    // Should only call repository once
    verify(() => mockRepo.getUser('123')).called(1);
  });
}
```

## Testing Provider Invalidation

```dart
test('should refetch after invalidation', () async {
  var callCount = 0;
  final mockRepo = MockUserRepository();
  when(() => mockRepo.getUsers()).thenAnswer((_) async {
    callCount++;
    return [User(id: '$callCount', name: 'User $callCount')];
  });

  final container = createContainer(
    overrides: [
      userRepositoryProvider.overrideWithValue(mockRepo),
    ],
  );

  // First fetch
  await container.read(userListProvider.future);
  expect(callCount, equals(1));

  // Invalidate
  container.invalidate(userListProvider);

  // Should refetch
  await container.read(userListProvider.future);
  expect(callCount, equals(2));
});
```

## Testing AutoDispose Providers

```dart
test('should dispose when no longer listened', () async {
  var disposed = false;

  final testProvider = Provider.autoDispose<String>((ref) {
    ref.onDispose(() => disposed = true);
    return 'test';
  });

  final container = createContainer();

  // Start listening
  final sub = container.listen(testProvider, (_, __) {});
  expect(disposed, isFalse);

  // Stop listening
  sub.close();
  expect(disposed, isTrue);
});
```

## Common Patterns

### Test Helper for Async Providers

```dart
extension AsyncProviderX<T> on ProviderContainer {
  /// Waits for an async provider to complete and returns the value
  Future<T> readAsync<T>(ProviderListenable<AsyncValue<T>> provider) async {
    final value = read(provider);
    if (value is AsyncData<T>) {
      return value.value;
    }
    return await read(provider.future);
  }
}

// Usage
test('example', () async {
  final container = createContainer();
  final users = await container.readAsync(userListProvider);
  expect(users, isNotEmpty);
});
```

### Mocking Notifier Methods

```dart
// Instead of mocking the notifier, mock its dependencies
test('should call repository on addUser', () async {
  final mockRepo = MockUserRepository();
  when(() => mockRepo.createUser(any())).thenAnswer((_) async {});
  when(() => mockRepo.getUsers()).thenAnswer((_) async => []);

  final container = createContainer(
    overrides: [
      userRepositoryProvider.overrideWithValue(mockRepo),
    ],
  );

  await container.read(userListProvider.future);
  await container.read(userListProvider.notifier).addUser(
    User(id: '1', name: 'New User'),
  );

  verify(() => mockRepo.createUser(any())).called(1);
});
```
