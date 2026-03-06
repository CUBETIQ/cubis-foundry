---
name: "flutter-test-master"
description: "Comprehensive Flutter testing guide covering unit tests, widget tests, integration tests, golden tests, and Riverpod provider testing with mocktail"
---
# Flutter Test Master

## Overview

Master Flutter testing with comprehensive patterns for unit tests, widget tests, integration tests, golden tests, and Riverpod provider testing. This power provides battle-tested patterns, best practices, and ready-to-use templates for building robust test suites.

## Available Steering Files

- **unit-testing.md** - Unit test patterns for pure Dart logic and repositories
- **widget-testing.md** - Widget test patterns with WidgetTester, finders, and matchers
- **riverpod-testing.md** - Riverpod provider testing with ProviderContainer and mocking
- **integration-testing.md** - E2E tests on real devices/emulators with login automation (Patrol)
- **golden-testing.md** - Golden (snapshot) tests for UI regression detection
- **property-testing.md** - Property-based testing with Glados for exhaustive coverage
- **test-utilities.md** - Common test utilities, helpers, and setup patterns

## Testing Pyramid

Follow the testing pyramid principle for optimal coverage:

```
          /\
         /  \  Integration/E2E (few - on device)
        /----\
       /      \  Widget Tests (some)
      /--------\
     /          \  Unit Tests (many)
    /------------\
```

| Test Type   | Speed    | Scope                 | When to Use                              |
| ----------- | -------- | --------------------- | ---------------------------------------- |
| Unit        | Fast     | Single function/class | Business logic, utilities, models        |
| Widget      | Medium   | Single widget         | UI components, user interactions         |
| Integration | Slow     | Full app on device    | Critical user journeys (login, checkout) |
| Golden      | Medium   | Visual snapshot       | UI regression detection                  |
| Property    | Variable | Exhaustive inputs     | Edge cases, invariants                   |

## Quick Start

### 1. Project Setup

```yaml
# pubspec.yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  mocktail: ^1.0.3
  glados: ^0.3.0 # Property-based testing
  patrol: ^3.13.0 # E2E testing on real devices
```

### 2. Test File Structure

```
test/
├── core/
│   ├── network/
│   │   └── api_client_test.dart
│   └── utils/
│       └── date_utils_test.dart
├── features/
│   └── <feature>/
│       ├── data/
│       │   └── <feature>_repository_test.dart
│       ├── <feature>_controller_test.dart
│       └── views/
│           └── <feature>_view_test.dart
├── helpers/
│   ├── mocks.dart
│   ├── test_helpers.dart
│   └── pump_app.dart
└── widget_test.dart
```

### 3. Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/features/auth/auth_test.dart

# Run with coverage
flutter test --coverage

# Run tests matching pattern
flutter test --name "should login"

# Update golden files
flutter test --update-goldens

# Run integration tests on device/emulator
flutter test integration_test/app_test.dart

# Run with Patrol (E2E)
patrol test
```

## Core Testing Patterns

### Given-When-Then Structure

```dart
test('should return user when login succeeds', () async {
  // Given (Arrange)
  final mockRepo = MockAuthRepository();
  when(() => mockRepo.login(any(), any()))
      .thenAnswer((_) async => User(id: '1', name: 'John'));

  // When (Act)
  final result = await mockRepo.login('email', 'password');

  // Then (Assert)
  expect(result.name, equals('John'));
  verify(() => mockRepo.login('email', 'password')).called(1);
});
```

### Test Naming Convention

```dart
// Pattern: should_[expected behavior]_when_[condition]
test('should return empty list when no items exist', () { ... });
test('should throw AuthException when credentials invalid', () { ... });
test('should update state when mutation succeeds', () { ... });
```

## Unit Testing Essentials

### Testing Pure Functions

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DateUtils', () {
    test('should format date correctly', () {
      final date = DateTime(2024, 1, 15);
      expect(formatDate(date), equals('Jan 15, 2024'));
    });

    test('should return true for same day', () {
      final date1 = DateTime(2024, 1, 15, 10, 30);
      final date2 = DateTime(2024, 1, 15, 14, 45);
      expect(isSameDay(date1, date2), isTrue);
    });
  });
}
```

### Testing with Mocktail

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// Create mock class
class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late MockUserRepository mockRepo;

  setUp(() {
    mockRepo = MockUserRepository();
  });

  test('should return user from repository', () async {
    // Arrange
    when(() => mockRepo.getUser('123'))
        .thenAnswer((_) async => Result.success(User(id: '123', name: 'John')));

    // Act
    final result = await mockRepo.getUser('123');

    // Assert
    expect(result.isSuccess, isTrue);
    verify(() => mockRepo.getUser('123')).called(1);
  });
}
```

## Widget Testing Essentials

### Basic Widget Test

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('should display title text', (tester) async {
    // Arrange & Act
    await tester.pumpWidget(
      const MaterialApp(
        home: MyWidget(title: 'Hello'),
      ),
    );

    // Assert
    expect(find.text('Hello'), findsOneWidget);
  });

  testWidgets('should navigate on button tap', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

    // Find and tap button
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    // Verify navigation
    expect(find.byType(HomeScreen), findsOneWidget);
  });
}
```

### Common Finders

```dart
// By type
find.byType(ElevatedButton)
find.byType(TextField)

// By text
find.text('Submit')
find.textContaining('Hello')

// By key
find.byKey(const Key('login_button'))

// By icon
find.byIcon(Icons.add)

// By widget predicate
find.byWidgetPredicate((widget) => widget is Text && widget.data == 'Hello')

// Descendant finder
find.descendant(
  of: find.byType(Card),
  matching: find.text('Title'),
)
```

### Common Matchers

```dart
// Widget count
expect(find.byType(ListTile), findsNWidgets(3));
expect(find.text('Error'), findsNothing);
expect(find.byType(CircularProgressIndicator), findsOneWidget);

// Widget properties
expect(
  tester.widget<Text>(find.text('Hello')).style?.color,
  equals(Colors.red),
);
```

## Riverpod Testing

### Unit Testing Providers

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('should return initial state', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final state = container.read(counterProvider);
    expect(state, equals(0));
  });

  test('should increment counter', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(counterProvider.notifier).increment();
    expect(container.read(counterProvider), equals(1));
  });
}
```

### Widget Testing with Riverpod

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('should display user name', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          userProvider.overrideWith((ref) => User(name: 'John')),
        ],
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );

    expect(find.text('John'), findsOneWidget);
  });
}
```

### Mocking Async Providers

```dart
testWidgets('should show loading then data', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        userProvider.overrideWith(
          (ref) => AsyncValue.data(User(name: 'John')),
        ),
      ],
      child: const MaterialApp(home: ProfileScreen()),
    ),
  );

  await tester.pumpAndSettle();
  expect(find.text('John'), findsOneWidget);
});
```

## Property-Based Testing with Glados

### Basic Property Test

```dart
import 'package:glados/glados.dart';

void main() {
  Glados(any.int).test('absolute value is non-negative', (value) {
    expect(value.abs(), greaterThanOrEqualTo(0));
  });

  Glados2(any.int, any.int).test('addition is commutative', (a, b) {
    expect(a + b, equals(b + a));
  });
}
```

### Custom Generators

```dart
extension AnyUser on Any {
  Generator<User> get user => combine2(
    any.letterOrDigits,
    any.positiveInt,
    (name, age) => User(name: name, age: age),
  );
}

void main() {
  Glados(any.user).test('user name is not empty', (user) {
    expect(user.name.isNotEmpty, isTrue);
  });
}
```

## Integration Testing (E2E on Device)

For full app testing on real devices/emulators with login automation, use **Patrol**:

```dart
// integration_test/app_test.dart
import 'package:patrol/patrol.dart';

void main() {
  patrolTest('Login and navigate to home', ($) async {
    await $.pumpWidgetAndSettle(createApp());

    // Enter credentials (from environment variables)
    await $(#email_field).enterText('test@example.com');
    await $(#password_field).enterText('password123');
    await $(#login_button).tap();

    // Wait for home screen
    await $.pumpAndSettle(timeout: const Duration(seconds: 10));
    expect($(#home_screen), findsOneWidget);
  });
}
```

Run with credentials:

```bash
patrol test --dart-define=TEST_EMAIL=user@test.com --dart-define=TEST_PASSWORD=pass123
```

See **integration-testing.md** steering file for full patterns including:

- Page Object pattern (Robots)
- Native permission handling
- CI/CD integration
- Test configuration

## Best Practices

### DO ✅

- Write tests BEFORE fixing bugs (TDD for bug fixes)
- Use descriptive test names with given-when-then
- Keep tests independent and isolated
- Mock external dependencies
- Test edge cases and error scenarios
- Use `setUp` and `tearDown` for common setup
- Group related tests with `group()`

### DON'T ❌

- Don't test implementation details
- Don't share state between tests
- Don't use real network calls in unit tests
- Don't test third-party code
- Don't write flaky tests (avoid `sleep()`)
- Don't ignore failing tests

## Troubleshooting

### Common Issues

**Test hangs or times out:**

```dart
// Use pumpAndSettle with timeout
await tester.pumpAndSettle(const Duration(seconds: 5));

// Or pump specific frames
await tester.pump(const Duration(milliseconds: 100));
```

**Widget not found:**

```dart
// Ensure widget is pumped
await tester.pumpWidget(widget);
await tester.pumpAndSettle(); // Wait for animations

// Check if widget is in tree
debugDumpApp(); // Prints widget tree
```

**Provider not found:**

```dart
// Wrap with ProviderScope
await tester.pumpWidget(
  ProviderScope(
    child: MaterialApp(home: MyWidget()),
  ),
);
```

**Golden test fails on CI:**

```dart
// Use font configuration
await loadAppFonts();

// Or skip on CI
testWidgets('golden test', (tester) async {
  // ...
}, skip: Platform.environment.containsKey('CI'));
```

## Commands Reference

```bash
# Run all tests
flutter test

# Run with verbose output
flutter test --reporter expanded

# Run specific file
flutter test test/path/to/test.dart

# Run tests matching name
flutter test --name "login"

# Generate coverage report
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Update golden files
flutter test --update-goldens

# Run tests in random order
flutter test --test-randomize-ordering-seed random

# Integration tests on device
flutter test integration_test/app_test.dart

# Patrol E2E tests
patrol test
patrol test -d <device_id>
patrol test --dart-define=TEST_EMAIL=user@test.com
```
