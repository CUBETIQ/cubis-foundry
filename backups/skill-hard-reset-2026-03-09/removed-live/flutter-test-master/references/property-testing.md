# Property-Based Testing Guide

## Overview

Property-based testing (PBT) generates random inputs to verify that certain properties always hold true. Instead of testing specific examples, you define invariants that must be satisfied for any valid input. This approach finds edge cases you might never think to test manually.

## When to Use Property-Based Testing

- Data transformations (serialization, parsing)
- Mathematical operations (sorting, filtering)
- State machine transitions
- Invariants that must always hold
- Finding edge cases in complex logic
- Testing with large input spaces

## Setup with Glados

### Installation

```yamlTesting pyramid guidance (unit → widget → integration)
Given-When-Then test structure
Mocktail mocking patterns
Riverpod provider testing (StateProvider, Notifier, AsyncNotifier)
Widget testing with finders, matchers, and user interactions
Golden tests for visual regression
Property-based testing with Glados (based on your existing overtime tests)
Reusable test utilities and factories
dev_dependencies:
  glados: ^0.3.0
```

### Basic Usage

```dart
import 'package:glados/glados.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // Single input
  Glados(any.int).test('absolute value is non-negative', (value) {
    expect(value.abs(), greaterThanOrEqualTo(0));
  });

  // Two inputs
  Glados2(any.int, any.int).test('addition is commutative', (a, b) {
    expect(a + b, equals(b + a));
  });

  // Three inputs
  Glados3(any.int, any.int, any.int).test(
    'addition is associative',
    (a, b, c) {
      expect((a + b) + c, equals(a + (b + c)));
    },
  );
}
```

## Built-in Generators

### Primitive Types

```dart
any.int                    // Any integer
any.positiveInt            // Positive integers (> 0)
any.nonNegativeInt         // Non-negative integers (>= 0)
any.intInRange(0, 100)     // Integer in range [0, 100]

any.double                 // Any double
any.positiveDouble         // Positive doubles

any.bool                   // true or false

any.letter                 // Single letter (a-z, A-Z)
any.letterOrDigit          // Letter or digit
any.letterOrDigits         // String of letters/digits
```

### Collections

```dart
any.list(any.int)                      // List<int>
any.listWithLength(5, any.int)         // List<int> with exactly 5 items
any.listWithLengthInRange(1, 10, any.int)  // List<int> with 1-10 items

any.set(any.int)                       // Set<int>
any.map(any.string, any.int)           // Map<String, int>
```

### Choosing from Values

```dart
// Choose from enum values
any.choose(Status.values)

// Choose from specific values
any.choose(['red', 'green', 'blue'])
```

## Custom Generators

### Simple Custom Generator

```dart
extension AnyUser on Any {
  Generator<User> get user => combine2(
    any.letterOrDigits,
    any.positiveInt,
    (name, age) => User(name: name.isEmpty ? 'default' : name, age: age),
  );
}

// Usage
Glados(any.user).test('user has valid name', (user) {
  expect(user.name.isNotEmpty, isTrue);
});
```

### Complex Custom Generator

```dart
extension AnyOvertime on Any {
  /// Generator for non-empty strings
  Generator<String> get nonEmptyString =>
      any.letterOrDigits.map((s) => s.isEmpty ? 'a' : s);

  /// Generator for OvertimeStatus enum
  Generator<OvertimeStatus> get overtimeStatus =>
      choose(OvertimeStatus.values);

  /// Generator for DateTime within a reasonable range
  Generator<DateTime> get overtimeDate => combine3(
    intInRange(2020, 2030), // year
    intInRange(1, 12),      // month
    intInRange(1, 28),      // day (safe for all months)
    (year, month, day) => DateTime(year, month, day),
  );

  /// Generator for Overtime entity
  Generator<Overtime> get overtime => combine5(
    nonEmptyString,         // id
    nonEmptyString,         // userId
    overtimeDate,           // startDate
    overtimeStatus,         // status
    intInRange(30, 480),    // duration in minutes
    (id, userId, startDate, status, duration) => Overtime(
      id: id,
      userId: userId,
      organizationId: 'org1',
      startDate: startDate,
      endDate: startDate.add(Duration(minutes: duration)),
      duration: duration,
      status: status,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  );

  /// Generator for list of Overtime entities
  Generator<List<Overtime>> get overtimeList =>
      any.listWithLengthInRange(0, 20, overtime);
}
```

### Generator Combinators

```dart
// Map: Transform generated values
Generator<String> get uppercaseName =>
    any.letterOrDigits.map((s) => s.toUpperCase());

// FlatMap: Chain generators
Generator<User> get userWithEmail => any.user.flatMap((user) =>
    any.letterOrDigits.map((domain) =>
        user.copyWith(email: '${user.name}@$domain.com')));

// Where: Filter generated values
Generator<int> get evenNumber =>
    any.int.where((n) => n % 2 == 0);

// Combine: Combine multiple generators
Generator<Point> get point => combine2(
    any.double,
    any.double,
    (x, y) => Point(x, y));
```

## Property Patterns

### Roundtrip Property

```dart
// Encoding then decoding should return original value
Glados(any.user).test('JSON roundtrip preserves data', (user) {
  final json = user.toJson();
  final decoded = User.fromJson(json);
  expect(decoded, equals(user));
});
```

### Idempotence Property

```dart
// Applying operation twice should equal applying once
Glados(any.list(any.int)).test('sorting is idempotent', (list) {
  final sortedOnce = [...list]..sort();
  final sortedTwice = [...sortedOnce]..sort();
  expect(sortedTwice, equals(sortedOnce));
});
```

### Invariant Property

```dart
// Property that must always hold
Glados(any.list(any.int)).test('sorted list is ordered', (list) {
  final sorted = [...list]..sort();
  for (var i = 0; i < sorted.length - 1; i++) {
    expect(sorted[i], lessThanOrEqualTo(sorted[i + 1]));
  }
});
```

### Inverse Property

```dart
// Operation and its inverse cancel out
Glados(any.int).test('negate is self-inverse', (n) {
  expect(-(-n), equals(n));
});
```

### Partition Property

```dart
// Filtering by each status partitions the list
Glados(any.overtimeList).test('status filter partitions list', (items) {
  var totalFiltered = 0;
  for (final status in OvertimeStatus.values) {
    totalFiltered += items.where((i) => i.status == status).length;
  }
  expect(totalFiltered, equals(items.length));
});
```

### Commutativity Property

```dart
Glados2(any.int, any.int).test('addition is commutative', (a, b) {
  expect(a + b, equals(b + a));
});
```

### Associativity Property

```dart
Glados3(any.int, any.int, any.int).test('addition is associative', (a, b, c) {
  expect((a + b) + c, equals(a + (b + c)));
});
```

## Real-World Examples

### Testing Filtering Logic

```dart
void main() {
  group('Date-Based Filtering', () {
    Glados2(
      any.overtimeList,
      any.overtimeDate,
    ).test('filtering by date returns only matching records', (items, date) {
      final filtered = items.where((item) =>
          _isSameDay(item.startDate, date)).toList();

      for (final item in filtered) {
        expect(
          _isSameDay(item.startDate, date),
          isTrue,
          reason: 'Filtered item should match selected date',
        );
      }
    });

    Glados2(
      any.overtimeList,
      any.overtimeDate,
    ).test('filtering preserves all matching records', (items, date) {
      final filtered = items.where((item) =>
          _isSameDay(item.startDate, date)).toList();
      final expectedCount = items.where((item) =>
          _isSameDay(item.startDate, date)).length;

      expect(filtered.length, equals(expectedCount));
    });
  });
}

bool _isSameDay(DateTime date1, DateTime date2) {
  return date1.year == date2.year &&
      date1.month == date2.month &&
      date1.day == date2.day;
}
```

### Testing CRUD Operations

```dart
void main() {
  group('Create Operation', () {
    Glados2(
      any.overtimeList,
      any.overtime,
    ).test('create adds item to list', (originalList, newItem) {
      final updatedList = [...originalList, newItem];

      expect(updatedList.length, equals(originalList.length + 1));
      expect(updatedList.any((item) => item.id == newItem.id), isTrue);
    });
  });

  group('Delete Operation', () {
    Glados(any.overtimeList).test('delete removes item from list', (list) {
      if (list.isEmpty) return;

      final itemToDelete = list.first;
      final updatedList = list.where((i) => i.id != itemToDelete.id).toList();

      expect(updatedList.any((i) => i.id == itemToDelete.id), isFalse);
    });

    Glados(any.overtimeList).test('delete preserves other items', (list) {
      if (list.isEmpty) return;

      final itemToDelete = list.first;
      final updatedList = list.where((i) => i.id != itemToDelete.id).toList();

      for (final item in list) {
        if (item.id != itemToDelete.id) {
          expect(updatedList.any((i) => i.id == item.id), isTrue);
        }
      }
    });
  });
}
```

### Testing Validators

```dart
extension AnyEmail on Any {
  Generator<String> get validEmail => combine2(
    any.letterOrDigits.where((s) => s.isNotEmpty),
    any.choose(['gmail.com', 'yahoo.com', 'test.org']),
    (local, domain) => '$local@$domain',
  );

  Generator<String> get invalidEmail => any.choose([
    '',
    'noatsign',
    '@nodomain',
    'spaces in@email.com',
  ]);
}

void main() {
  Glados(any.validEmail).test('accepts valid emails', (email) {
    expect(Validators.email(email), isNull);
  });

  Glados(any.invalidEmail).test('rejects invalid emails', (email) {
    expect(Validators.email(email), isNotNull);
  });
}
```

## Best Practices

### DO ✅

- Focus on properties, not specific values
- Use meaningful property names
- Create reusable generators for domain types
- Test edge cases explicitly alongside PBT
- Use `where` to constrain inputs when needed
- Document what property is being tested

### DON'T ❌

- Don't test implementation details
- Don't use PBT for simple equality checks
- Don't ignore shrinking (it helps find minimal failing cases)
- Don't make generators too complex

## Debugging Failed Tests

When a property test fails, Glados will shrink the input to find the minimal failing case:

```
Falsified after 42 tests. Shrunk 5 times.
Counter-example: [1, 0, -1]
```

Use this minimal example to understand and fix the bug.

## Running Property Tests

```bash
# Run all tests (including property tests)
flutter test

# Run with more iterations
# (Configure in test file or use environment variable)
flutter test --dart-define=GLADOS_ITERATIONS=1000
```
