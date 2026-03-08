# Unit Testing Guide

## Overview

Unit tests verify individual functions, methods, and classes in isolation. They are the foundation of your test suite - fast, focused, and numerous.

## When to Write Unit Tests

- Pure functions (utilities, formatters, validators)
- Business logic (use cases, domain services)
- Data transformations (mappers, serializers)
- State management logic (notifiers, controllers)
- Repository implementations (with mocked data sources)

## Test Structure

### File Organization

```
test/
├── core/
│   ├── utils/
│   │   ├── date_utils_test.dart
│   │   ├── string_utils_test.dart
│   │   └── validators_test.dart
│   └── network/
│       └── api_client_test.dart
└── features/
    └── auth/
        ├── data/
        │   └── auth_repository_test.dart
        └── auth_controller_test.dart
```

### Basic Test Template

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ClassName', () {
    late ClassName sut; // System Under Test

    setUp(() {
      sut = ClassName();
    });

    group('methodName', () {
      test('should return expected result when condition is met', () {
        // Given
        final input = 'test';

        // When
        final result = sut.methodName(input);

        // Then
        expect(result, equals('expected'));
      });

      test('should throw exception when input is invalid', () {
        // Given
        final invalidInput = '';

        // When & Then
        expect(
          () => sut.methodName(invalidInput),
          throwsA(isA<ValidationException>()),
        );
      });
    });
  });
}
```

## Testing Pure Functions

### Utility Functions

```dart
// lib/core/utils/date_utils.dart
String formatDate(DateTime date) {
  return '${date.day}/${date.month}/${date.year}';
}

bool isSameDay(DateTime date1, DateTime date2) {
  return date1.year == date2.year &&
      date1.month == date2.month &&
      date1.day == date2.day;
}

// test/core/utils/date_utils_test.dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('formatDate', () {
    test('should format date as DD/MM/YYYY', () {
      final date = DateTime(2024, 1, 15);
      expect(formatDate(date), equals('15/1/2024'));
    });

    test('should handle single digit day and month', () {
      final date = DateTime(2024, 5, 3);
      expect(formatDate(date), equals('3/5/2024'));
    });
  });

  group('isSameDay', () {
    test('should return true for same day different times', () {
      final date1 = DateTime(2024, 1, 15, 10, 30);
      final date2 = DateTime(2024, 1, 15, 14, 45);
      expect(isSameDay(date1, date2), isTrue);
    });

    test('should return false for different days', () {
      final date1 = DateTime(2024, 1, 15);
      final date2 = DateTime(2024, 1, 16);
      expect(isSameDay(date1, date2), isFalse);
    });
  });
}
```

### Validators

```dart
// lib/core/utils/validators.dart
class Validators {
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Invalid email format';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }
}

// test/core/utils/validators_test.dart
void main() {
  group('Validators', () {
    group('email', () {
      test('should return null for valid email', () {
        expect(Validators.email('test@example.com'), isNull);
      });

      test('should return error for empty email', () {
        expect(Validators.email(''), equals('Email is required'));
        expect(Validators.email(null), equals('Email is required'));
      });

      test('should return error for invalid format', () {
        expect(Validators.email('invalid'), equals('Invalid email format'));
        expect(Validators.email('test@'), equals('Invalid email format'));
      });
    });

    group('password', () {
      test('should return null for valid password', () {
        expect(Validators.password('password123'), isNull);
      });

      test('should return error for short password', () {
        expect(
          Validators.password('short'),
          equals('Password must be at least 8 characters'),
        );
      });
    });
  });
}
```

## Testing with Mocks (Mocktail)

### Setup

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// Create mock classes
class MockUserRepository extends Mock implements UserRepository {}
class MockAuthService extends Mock implements AuthService {}

// Register fallback values for custom types
void main() {
  setUpAll(() {
    registerFallbackValue(User(id: '', name: ''));
    registerFallbackValue(LoginRequest(email: '', password: ''));
  });
}
```

### Mocking Methods

```dart
void main() {
  late MockUserRepository mockRepo;
  late GetUserUseCase useCase;

  setUp(() {
    mockRepo = MockUserRepository();
    useCase = GetUserUseCase(mockRepo);
  });

  group('GetUserUseCase', () {
    test('should return user when repository succeeds', () async {
      // Arrange
      final expectedUser = User(id: '123', name: 'John');
      when(() => mockRepo.getUser('123'))
          .thenAnswer((_) async => expectedUser);

      // Act
      final result = await useCase.execute('123');

      // Assert
      expect(result, equals(expectedUser));
      verify(() => mockRepo.getUser('123')).called(1);
    });

    test('should throw when repository fails', () async {
      // Arrange
      when(() => mockRepo.getUser(any()))
          .thenThrow(NetworkException('No connection'));

      // Act & Assert
      expect(
        () => useCase.execute('123'),
        throwsA(isA<NetworkException>()),
      );
    });
  });
}
```

### Verifying Interactions

```dart
test('should call repository with correct parameters', () async {
  when(() => mockRepo.createUser(any()))
      .thenAnswer((_) async => User(id: '1', name: 'John'));

  await useCase.execute(CreateUserRequest(name: 'John', email: 'john@test.com'));

  // Verify called once
  verify(() => mockRepo.createUser(any())).called(1);

  // Verify with specific arguments
  verify(() => mockRepo.createUser(
    argThat(
      isA<CreateUserRequest>()
          .having((r) => r.name, 'name', 'John')
          .having((r) => r.email, 'email', 'john@test.com'),
    ),
  )).called(1);

  // Verify never called
  verifyNever(() => mockRepo.deleteUser(any()));
});
```

### Capturing Arguments

```dart
test('should capture and verify arguments', () async {
  when(() => mockRepo.updateUser(any()))
      .thenAnswer((_) async => User(id: '1', name: 'Updated'));

  await useCase.execute(UpdateUserRequest(id: '1', name: 'Updated'));

  final captured = verify(() => mockRepo.updateUser(captureAny())).captured;
  final request = captured.first as UpdateUserRequest;

  expect(request.id, equals('1'));
  expect(request.name, equals('Updated'));
});
```

## Testing Async Code

### Futures

```dart
test('should handle async operations', () async {
  when(() => mockRepo.fetchData())
      .thenAnswer((_) async => ['item1', 'item2']);

  final result = await useCase.execute();

  expect(result, hasLength(2));
});

test('should handle delayed responses', () async {
  when(() => mockRepo.fetchData()).thenAnswer(
    (_) => Future.delayed(
      const Duration(milliseconds: 100),
      () => ['item'],
    ),
  );

  final result = await useCase.execute();
  expect(result, isNotEmpty);
});
```

### Streams

```dart
test('should emit values from stream', () async {
  when(() => mockRepo.watchUser('123')).thenAnswer(
    (_) => Stream.fromIterable([
      User(id: '123', name: 'John'),
      User(id: '123', name: 'John Updated'),
    ]),
  );

  final stream = useCase.watch('123');

  await expectLater(
    stream,
    emitsInOrder([
      isA<User>().having((u) => u.name, 'name', 'John'),
      isA<User>().having((u) => u.name, 'name', 'John Updated'),
    ]),
  );
});

test('should handle stream errors', () async {
  when(() => mockRepo.watchUser(any())).thenAnswer(
    (_) => Stream.error(NetworkException('Connection lost')),
  );

  await expectLater(
    useCase.watch('123'),
    emitsError(isA<NetworkException>()),
  );
});
```

## Testing Repository Implementations

```dart
class MockApiClient extends Mock implements ApiClient {}
class MockLocalDatabase extends Mock implements LocalDatabase {}

void main() {
  late MockApiClient mockApi;
  late MockLocalDatabase mockDb;
  late UserRepositoryImpl repository;

  setUp(() {
    mockApi = MockApiClient();
    mockDb = MockLocalDatabase();
    repository = UserRepositoryImpl(mockApi, mockDb);
  });

  group('getUser', () {
    test('should return cached user when available', () async {
      // Arrange
      final cachedUser = User(id: '123', name: 'Cached');
      when(() => mockDb.getUser('123'))
          .thenAnswer((_) async => cachedUser);

      // Act
      final result = await repository.getUser('123');

      // Assert
      expect(result, equals(cachedUser));
      verifyNever(() => mockApi.fetchUser(any()));
    });

    test('should fetch from API when cache is empty', () async {
      // Arrange
      final apiUser = User(id: '123', name: 'API');
      when(() => mockDb.getUser('123'))
          .thenAnswer((_) async => null);
      when(() => mockApi.fetchUser('123'))
          .thenAnswer((_) async => apiUser);
      when(() => mockDb.saveUser(any()))
          .thenAnswer((_) async {});

      // Act
      final result = await repository.getUser('123');

      // Assert
      expect(result, equals(apiUser));
      verify(() => mockDb.saveUser(apiUser)).called(1);
    });
  });
}
```

## Edge Cases to Test

### Null and Empty Values

```dart
group('edge cases', () {
  test('should handle null input', () {
    expect(() => sut.process(null), throwsArgumentError);
  });

  test('should handle empty string', () {
    expect(sut.process(''), equals(''));
  });

  test('should handle empty list', () {
    expect(sut.processItems([]), isEmpty);
  });
});
```

### Boundary Conditions

```dart
group('boundary conditions', () {
  test('should handle minimum value', () {
    expect(sut.calculate(0), equals(0));
  });

  test('should handle maximum value', () {
    expect(sut.calculate(int.maxFinite.toInt()), isPositive);
  });

  test('should handle negative values', () {
    expect(sut.calculate(-1), equals(1)); // absolute value
  });
});
```

### Error Scenarios

```dart
group('error handling', () {
  test('should throw on network error', () async {
    when(() => mockApi.fetch()).thenThrow(SocketException('No connection'));

    expect(
      () => repository.getData(),
      throwsA(isA<NetworkException>()),
    );
  });

  test('should throw on timeout', () async {
    when(() => mockApi.fetch()).thenThrow(TimeoutException('Timeout'));

    expect(
      () => repository.getData(),
      throwsA(isA<TimeoutException>()),
    );
  });
});
```

## Test Utilities

### Custom Matchers

```dart
// test/helpers/matchers.dart
Matcher isValidUser = isA<User>()
    .having((u) => u.id, 'id', isNotEmpty)
    .having((u) => u.name, 'name', isNotEmpty);

Matcher hasError(String message) => isA<AppException>()
    .having((e) => e.message, 'message', contains(message));

// Usage
expect(result, isValidUser);
expect(() => sut.validate(), throwsA(hasError('Invalid')));
```

### Test Data Factories

```dart
// test/helpers/factories.dart
class UserFactory {
  static User create({
    String? id,
    String? name,
    String? email,
  }) {
    return User(
      id: id ?? 'test-id-${DateTime.now().millisecondsSinceEpoch}',
      name: name ?? 'Test User',
      email: email ?? 'test@example.com',
    );
  }

  static List<User> createList(int count) {
    return List.generate(count, (i) => create(id: 'user-$i'));
  }
}

// Usage
final user = UserFactory.create(name: 'John');
final users = UserFactory.createList(5);
```
