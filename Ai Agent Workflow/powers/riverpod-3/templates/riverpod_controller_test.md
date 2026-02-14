```dart
// templates/riverpod_controller_test.tmpl
//
// Copy into: test/unit/<feature>/<feature>_controller_test.dart
// Adjust providers + fakes.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  test('controller loads data', () async {
    final container = ProviderContainer(
      overrides: [
        // repositoryProvider.overrideWithValue(FakeRepo()),
      ],
    );
    addTearDown(container.dispose);

    // final state = await container.read(controllerProvider(args...).future);
    // expect(state, ...);
  });

  test('refresh re-runs build', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    // await container.read(controllerProvider(args...).notifier).refresh();
  });
}
```
