# Riverpod 3 testing

This guide focuses on provider/controller tests and widget tests for Riverpod 3 + codegen.

## Core idea

- In tests, control dependencies via `ProviderContainer(overrides: ...)` or `ProviderScope(overrides: ...)`.
- Never hit real network/db in unit tests.
- Prefer fakes over heavy mocks when practical.

## 1) Unit test a simple provider

```dart
test('counter defaults to 0', () {
  final container = ProviderContainer();
  addTearDown(container.dispose);

  expect(container.read(counterProvider), 0);
});
```

## 2) Unit test an AsyncNotifier (happy path)

```dart
class FakeOrdersRepository implements OrdersRepository {
  @override
  Future<List<Order>> getOrders() async => [Order(id: '1')];
}

test('OrdersController loads data', () async {
  final container = ProviderContainer(
    overrides: [
      ordersRepositoryProvider.overrideWithValue(FakeOrdersRepository()),
    ],
  );
  addTearDown(container.dispose);

  final state = await container.read(ordersControllerProvider.future);
  expect(state.items, isNotEmpty);
});
```

## 3) Unit test error path

```dart
class FakeFailOrdersRepository implements OrdersRepository {
  @override
  Future<List<Order>> getOrders() async => throw Exception('network');
}

test('OrdersController exposes error on failure', () async {
  final container = ProviderContainer(
    overrides: [
      ordersRepositoryProvider.overrideWithValue(FakeFailOrdersRepository()),
    ],
  );
  addTearDown(container.dispose);

  expect(
    () => container.read(ordersControllerProvider.future),
    throwsException,
  );
});
```

## 4) Unit test `refresh()`

```dart
class CountingOrdersRepository implements OrdersRepository {
  int calls = 0;

  @override
  Future<List<Order>> getOrders() async {
    calls++;
    return [Order(id: '$calls')];
  }
}

test('refresh re-runs build()', () async {
  final repo = CountingOrdersRepository();
  final container = ProviderContainer(
    overrides: [ordersRepositoryProvider.overrideWithValue(repo)],
  );
  addTearDown(container.dispose);

  final first = await container.read(ordersControllerProvider.future);
  expect(first.items.single.id, '1');
  expect(repo.calls, 1);

  await container.read(ordersControllerProvider.notifier).refresh();

  final second = await container.read(ordersControllerProvider.future);
  expect(second.items.single.id, '2');
  expect(repo.calls, 2);
});
```

## 5) Family parameter stability test

```dart
test('family parameter equality reuses provider instance', () {
  final container = ProviderContainer();
  addTearDown(container.dispose);

  final q1 = OrdersQuery(status: 'open', page: 1);
  final q2 = OrdersQuery(status: 'open', page: 1);

  final a = container.read(ordersListProvider(q1));
  final b = container.read(ordersListProvider(q2));

  expect(identical(a, b), isTrue);
});
```

## 6) Paging controller test

```dart
class FakePagedRepo implements OrdersRepository {
  int page = 0;

  @override
  Future<OrderPage> fetchPage({String? cursor}) async {
    page++;
    if (page == 1) return OrderPage(items: [Order(id: 'a')], nextCursor: 'c2');
    if (page == 2) return OrderPage(items: [Order(id: 'b')], nextCursor: null);
    return OrderPage(items: const [], nextCursor: null);
  }
}
```

Validate:
- first page loads,
- `loadMore` appends immutably,
- `hasMore` flips to false when no cursor.

## 7) Widget test (loading -> data)

```dart
testWidgets('shows list when data loaded', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        ordersRepositoryProvider.overrideWithValue(FakeOrdersRepository()),
      ],
      child: const MaterialApp(home: OrdersView()),
    ),
  );

  await tester.pump();
  expect(find.text('1'), findsOneWidget);
});
```

## 8) Loop regression test

If a screen previously had rebuild loops:
- pump widget,
- call `pumpAndSettle` with timeout,
- assert it settles.
