# Testing Patterns Reference

## Layer 1: Repository Test (in-memory Drift + mocktail)
```dart
void main() {
  late AppDatabase db;
  late Mock<N>Api mockApi;
  late MockOutboxService mockOutbox;
  late MockConnectivityService mockConnectivity;
  late <N>Repository sut;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    mockApi = Mock<N>Api();
    mockOutbox = MockOutboxService();
    mockConnectivity = MockConnectivityService();
    when(() => mockConnectivity.isOnline).thenAnswer((_) async => false);
    sut = <N>Repository(
      dao: <N>Dao(db),
      api: mockApi,
      outbox: mockOutbox,
      connectivity: mockConnectivity,
    );
  });

  tearDown(() => db.close());

  group('create', () {
    test('writes to local DB immediately', () async {
      await sut.create(fake<N>Input());
      final items = await db.<n>Dao.getAll();
      expect(items.length, 1);
    });

    test('enqueues in outbox with operationId', () async {
      await sut.create(fake<N>Input());
      verify(() => mockOutbox.enqueue(
        operationId: any(named: 'operationId'),
        feature: '<n>',
        operation: 'create',
        payload: any(named: 'payload'),
      )).called(1);
    });

    test('does NOT call API directly', () async {
      await sut.create(fake<N>Input());
      verifyNever(() => mockApi.create(any()));
    });
  });

  group('syncFromRemote', () {
    test('upserts all remote records into local DB', () async {
      when(() => mockApi.getAll()).thenAnswer((_) async => [fake<N>Dto()]);
      await sut.syncFromRemote();
      final items = await db.<n>Dao.getAll();
      expect(items.length, 1);
    });
  });
}
```

## Layer 2: Service Test (pure Dart — no Flutter, no Riverpod)
```dart
void main() {
  late <N>Service sut;
  late Mock<N>Repository mockRepo;

  setUp(() {
    mockRepo = Mock<N>Repository();
    sut = <N>Service(repository: mockRepo, /* other deps */);
  });

  group('<operation>', () {
    test('returns Left when <failure condition>', () async {
      // Arrange: set up conditions that trigger failure
      final result = await sut.<operation>(/* bad input */);
      expect(result.isLeft(), true);
      result.fold(
        (err) => expect(err, isA<ClientError>()),
        (_) => fail('should have been Left'),
      );
    });

    test('returns Right on success', () async {
      when(() => mockRepo.<action>(any())).thenAnswer((_) async => fake<N>());
      final result = await sut.<operation>(/* valid input */);
      expect(result.isRight(), true);
    });
  });
}
```

## Layer 3: Notifier Test (ProviderContainer)
```dart
void main() {
  late ProviderContainer container;

  ProviderContainer makeContainer({List<Override> overrides = const []}) =>
    ProviderContainer(overrides: [
      <n>RepositoryProvider.overrideWith((_) => Fake<N>Repository()),
      ...overrides,
    ]);

  tearDown(() => container.dispose());

  test('initial state is AppState.loading()', () {
    container = makeContainer();
    expect(container.read(<n>NotifierProvider), const AppState.loading());
  });

  test('transitions to AppState.data when items exist', () async {
    container = makeContainer();
    await container.pump(); // allow stream to emit
    expect(container.read(<n>NotifierProvider), isA<_Data>());
  });

  test('transitions to AppState.empty when no items', () async {
    container = makeContainer(overrides: [
      <n>RepositoryProvider.overrideWith((_) => Empty<N>Repository()),
    ]);
    await container.pump();
    expect(container.read(<n>NotifierProvider), const AppState.empty());
  });

  test('error state contains non-empty requestId', () async {
    container = makeContainer(overrides: [
      <n>RepositoryProvider.overrideWith((_) => Failing<N>Repository()),
    ]);
    await container.pump();
    final state = container.read(<n>NotifierProvider);
    expect(state, isA<_Error>());
    expect((state as _Error).error.requestId, isNotEmpty);
  });
}
```

## Layer 4: Widget Test (all 5 AppState variants)
```dart
void main() {
  Widget buildSubject(AppState<List<<N>>> state) =>
    ProviderScope(
      overrides: [
        <n>NotifierProvider.overrideWith((_) => FixedState<N>Notifier(state)),
      ],
      child: const MaterialApp(home: <N>ListPage()),
    );

  testWidgets('shows LoadingView in loading state', (tester) async {
    await tester.pumpWidget(buildSubject(const AppState.loading()));
    expect(find.byType(LoadingView), findsOneWidget);
  });

  testWidgets('shows EmptyView in empty state', (tester) async {
    await tester.pumpWidget(buildSubject(const AppState.empty()));
    expect(find.byType(EmptyView), findsOneWidget);
  });

  testWidgets('shows data in data state', (tester) async {
    await tester.pumpWidget(buildSubject(AppState.data([fake<N>()])));
    expect(find.byType(<N>Card), findsOneWidget);
  });

  testWidgets('shows ErrorView with selectable requestId', (tester) async {
    final err = AppError.network(requestId: 'test-req-id', userMessage: 'Oops');
    await tester.pumpWidget(buildSubject(AppState.error(err)));
    expect(find.byType(ErrorView), findsOneWidget);
    expect(find.textContaining('test-req-id'), findsOneWidget);
  });

  testWidgets('shows DeadLetterView with retry button', (tester) async {
    final err = AppError.syncDead(requestId: 'dlq-id', feature: '<n>',
      operation: 'create', userMessage: 'Failed', errorLog: []);
    await tester.pumpWidget(buildSubject(
      AppState.deadLetter(error: err, requestId: 'dlq-id'),
    ));
    expect(find.byType(DeadLetterView), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
  });
}
```

## Layer 5: Golden Test (shared widgets)
```dart
void main() {
  testGoldens('ErrorView renders correctly', (tester) async {
    await loadAppFonts();
    await tester.pumpWidgetBuilder(
      ErrorView(
        error: AppError.network(requestId: 'abc-123', userMessage: 'No connection'),
        onRetry: () {},
      ),
      surfaceSize: const Size(400, 300),
    );
    await screenMatchesGolden(tester, 'error_view');
  });
}
```

## Fake Repository Helpers
```dart
// Always create typed fakes — never use mocks for repositories in widget tests
class Fake<N>Repository implements <N>Repository {
  final List<<N>> items;
  Fake<N>Repository({this.items = const []});

  @override Stream<List<<N>>> watchAll() => Stream.value(items);
  @override Future<bool> isEmpty() async => items.isEmpty;
  @override Future<<N>> create(Create<N>Input input) async => fake<N>();
  @override Future<void> syncFromRemote() async {}
}

class Failing<N>Repository implements <N>Repository {
  @override Stream<List<<N>>> watchAll() => Stream.error(
    Exception('DB error'), StackTrace.empty,
  );
  // ... other methods throw
}
```
