# Isolate and Concurrency Patterns

## Isolate.run — Simple Compute Offload

```dart
// Isolate.run for one-shot heavy computation (Dart 3.0+)
Future<List<SearchResult>> searchIndex(String query) async {
  final data = await loadIndexData();

  // Runs in a new isolate — no main-isolate jank
  return await Isolate.run(() {
    return performSearch(data, query); // data is copied to isolate
  });
}

// In Flutter, use compute() for the same purpose
final results = await compute(performSearch, (data, query));
```

## Long-Lived Isolates with Ports

```dart
// Long-lived worker for continuous processing
class ImageProcessor {
  late final Isolate _isolate;
  late final SendPort _sendPort;
  final ReceivePort _receivePort = ReceivePort();
  final Map<int, Completer<Uint8List>> _pending = {};
  int _nextId = 0;

  Future<void> start() async {
    _isolate = await Isolate.spawn(_workerEntryPoint, _receivePort.sendPort);

    // First message from worker is its SendPort
    final completer = Completer<SendPort>();
    _receivePort.listen((message) {
      if (message is SendPort) {
        completer.complete(message);
      } else if (message is (int, Uint8List)) {
        final (id, result) = message;
        _pending.remove(id)?.complete(result);
      }
    });
    _sendPort = await completer.future;
  }

  Future<Uint8List> processImage(Uint8List imageData) {
    final id = _nextId++;
    final completer = Completer<Uint8List>();
    _pending[id] = completer;
    _sendPort.send((id, imageData));
    return completer.future;
  }

  void dispose() {
    _isolate.kill(priority: Isolate.immediate);
    _receivePort.close();
  }

  static void _workerEntryPoint(SendPort mainPort) {
    final workerPort = ReceivePort();
    mainPort.send(workerPort.sendPort);

    workerPort.listen((message) {
      if (message is (int, Uint8List)) {
        final (id, data) = message;
        final result = _applyFilters(data); // heavy work
        mainPort.send((id, result));
      }
    });
  }

  static Uint8List _applyFilters(Uint8List data) {
    // ... image processing
    return data;
  }
}
```

## Stream-Based Concurrency

```dart
// StreamController for event-driven architecture
class EventBus {
  final _controller = StreamController<AppEvent>.broadcast();

  Stream<AppEvent> get events => _controller.stream;

  // Type-filtered streams
  Stream<T> on<T extends AppEvent>() =>
      _controller.stream.whereType<T>();

  void emit(AppEvent event) => _controller.add(event);

  void dispose() => _controller.close();
}

// Usage
final bus = EventBus();
bus.on<OrderCreated>().listen((event) {
  notifyUser(event.orderId);
});
bus.emit(OrderCreated(orderId: 42));
```

## Stream Transformations

```dart
// Debounce search input
Stream<String> debounce(Stream<String> input, Duration delay) async* {
  Timer? timer;
  String? lastValue;

  await for (final value in input) {
    lastValue = value;
    timer?.cancel();
    timer = Timer(delay, () {});
    await Future.delayed(delay);
    if (lastValue == value) yield value;
  }
}

// Rate limiting with Stream.asyncMap
Stream<Response> rateLimited(
  Stream<Request> requests, {
  Duration interval = const Duration(milliseconds: 100),
}) {
  return requests.asyncMap((request) async {
    await Future.delayed(interval);
    return await processRequest(request);
  });
}

// Cancellation pattern
class DataFetcher {
  StreamSubscription? _subscription;

  void startListening(Stream<Update> updates) {
    // Cancel previous subscription before starting new one
    _subscription?.cancel();
    _subscription = updates.listen(
      (update) => handleUpdate(update),
      onError: (e) => handleError(e),
      onDone: () => handleDone(),
    );
  }

  void dispose() {
    _subscription?.cancel(); // always cancel in dispose
    _subscription = null;
  }
}
```

## Zones for Error Handling

```dart
// Run code in a zone to catch uncaught async errors
void main() {
  runZonedGuarded(
    () => runApp(const MyApp()),
    (error, stackTrace) {
      // Catches uncaught errors from async code
      reportError(error, stackTrace);
    },
  );
}
```

## Concurrency Rules

| Rule                                                       | Reason                                         |
| ---------------------------------------------------------- | ---------------------------------------------- |
| Never do heavy compute on main isolate                     | Causes UI jank (>16ms blocks drop frames)      |
| Use `Isolate.run` for one-shot work                        | Simpler than managing ports                    |
| Use persistent isolates for ongoing work                   | Avoids spawn/teardown overhead per task        |
| Cancel stream subscriptions in `dispose()`                 | Prevents memory leaks and ghost listeners      |
| Don't share mutable state across isolates                  | Isolates have separate heaps — send copies     |
| Use `TransferableTypedData` for large buffers              | Avoids copying overhead for byte arrays        |
| Use `StreamController.broadcast()` only for multi-listener | Single-listener controllers are more efficient |
