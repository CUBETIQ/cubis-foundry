# Testing and Mocking

## Test Structure

```dart
import 'package:test/test.dart';

void main() {
  group('OrderService', () {
    late OrderService sut;
    late MockOrderRepository mockRepo;

    setUp(() {
      mockRepo = MockOrderRepository();
      sut = OrderService(repository: mockRepo);
    });

    test('getOrder returns order when exists', () async {
      // Arrange
      final expected = Order(id: 1, product: 'Widget');
      when(() => mockRepo.findById(1)).thenAnswer((_) async => expected);

      // Act
      final result = await sut.getOrder(1);

      // Assert
      expect(result, equals(expected));
      verify(() => mockRepo.findById(1)).called(1);
    });

    test('getOrder throws when not found', () {
      when(() => mockRepo.findById(any())).thenAnswer((_) async => null);

      expect(
        () => sut.getOrder(999),
        throwsA(isA<OrderNotFoundException>()),
      );
    });
  });
}
```

## Mocking with Mocktail

```dart
import 'package:mocktail/mocktail.dart';

// Create mocks — no code generation needed
class MockAuthService extends Mock implements AuthService {}
class MockHttpClient extends Mock implements Client {}

// Register fallback values for custom types
void main() {
  setUpAll(() {
    registerFallbackValue(User(name: 'fallback', email: 'f@b.com'));
    registerFallbackValue(Uri.parse('https://example.com'));
  });

  test('login calls API with credentials', () async {
    final mockHttp = MockHttpClient();
    final service = AuthService(client: mockHttp);

    when(() => mockHttp.post(
      any(),
      body: any(named: 'body'),
      headers: any(named: 'headers'),
    )).thenAnswer((_) async => Response('{"token":"abc"}', 200));

    final token = await service.login('user', 'pass');

    expect(token, 'abc');
    verify(() => mockHttp.post(
      Uri.parse('https://api.example.com/login'),
      body: '{"username":"user","password":"pass"}',
      headers: any(named: 'headers'),
    )).called(1);
  });
}
```

## Async Test Patterns

```dart
test('stream emits values in order', () async {
  final controller = StreamController<int>();

  // expectLater for async matchers
  expectLater(
    controller.stream,
    emitsInOrder([1, 2, 3, emitsDone]),
  );

  controller
    ..add(1)
    ..add(2)
    ..add(3)
    ..close();
});

test('completes within timeout', () async {
  final future = fetchData();
  await expectLater(
    future.timeout(const Duration(seconds: 5)),
    completes,
  );
});

// Fake async for timer-dependent code
import 'package:fake_async/fake_async.dart';

test('debounce fires after delay', () {
  fakeAsync((async) {
    var fired = false;
    debounce(
      duration: const Duration(milliseconds: 300),
      callback: () => fired = true,
    );

    async.elapse(const Duration(milliseconds: 200));
    expect(fired, isFalse); // not yet

    async.elapse(const Duration(milliseconds: 150));
    expect(fired, isTrue); // fired after 300ms total
  });
});
```

## Flutter Widget Testing

```dart
import 'package:flutter_test/flutter_test.dart';

testWidgets('login button triggers auth flow', (tester) async {
  final mockAuth = MockAuthService();
  when(() => mockAuth.login(any(), any()))
      .thenAnswer((_) async => AuthResult.success);

  await tester.pumpWidget(
    MaterialApp(
      home: LoginScreen(authService: mockAuth),
    ),
  );

  // Find and interact with widgets
  await tester.enterText(find.byKey(const Key('email-field')), 'alice@test.com');
  await tester.enterText(find.byKey(const Key('password-field')), 'secret');
  await tester.tap(find.byKey(const Key('login-button')));
  await tester.pumpAndSettle(); // wait for animations

  // Verify navigation or state change
  expect(find.text('Welcome, Alice'), findsOneWidget);
  verify(() => mockAuth.login('alice@test.com', 'secret')).called(1);
});

testWidgets('shows error on failed login', (tester) async {
  final mockAuth = MockAuthService();
  when(() => mockAuth.login(any(), any()))
      .thenThrow(AuthException('Invalid credentials'));

  await tester.pumpWidget(
    MaterialApp(home: LoginScreen(authService: mockAuth)),
  );

  await tester.tap(find.byKey(const Key('login-button')));
  await tester.pumpAndSettle();

  expect(find.text('Invalid credentials'), findsOneWidget);
});
```

## Golden Tests

```dart
testWidgets('profile card matches golden', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: ProfileCard(
          user: User(name: 'Alice', avatar: 'default.png'),
        ),
      ),
    ),
  );

  await expectLater(
    find.byType(ProfileCard),
    matchesGoldenFile('goldens/profile_card.png'),
  );
});

// Update goldens: flutter test --update-goldens
// CI: flutter test (fails if pixels differ)
```

## Coverage-Driven CI

```bash
# Run with coverage
dart test --coverage=coverage
flutter test --coverage

# Generate HTML report
dart pub global activate coverage
dart pub global run coverage:format_coverage \
  --lcov --in=coverage --out=coverage/lcov.info \
  --report-on=lib

genhtml coverage/lcov.info -o coverage/html
# Open coverage/html/index.html

# CI enforcement — fail below threshold
# In CI pipeline:
# lcov --summary coverage/lcov.info | grep "lines" | awk -F'%' '{if ($1 < 80) exit 1}'
```

## Test Organization

```
test/
├── unit/                    # Pure logic, fast, mocked dependencies
│   ├── models/
│   │   └── order_test.dart
│   └── services/
│       └── order_service_test.dart
├── widget/                  # Flutter widget tests
│   └── screens/
│       └── login_screen_test.dart
├── integration/             # Real dependencies, slower
│   └── api/
│       └── order_api_test.dart
├── goldens/                 # Golden image files
│   └── profile_card.png
└── fixtures/                # Shared test data
    └── sample_order.json
```
