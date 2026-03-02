# Golden Testing Guide

## Overview

Golden tests (snapshot tests) capture a visual representation of your widgets and compare them against a "golden" reference image. They're excellent for catching unintended UI regressions.

## When to Use Golden Tests

- Design system components
- Complex layouts that should remain consistent
- Theme changes verification
- Responsive design breakpoints
- Before/after refactoring UI code

## Setup

### Basic Configuration

```dart
// test/helpers/golden_test_helper.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Load fonts for golden tests
Future<void> loadAppFonts() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  // Fonts are loaded automatically in Flutter 3.x
}

/// Wrapper for consistent golden test setup
Future<void> goldenTest(
  WidgetTester tester,
  Widget widget,
  String goldenFileName, {
  Size size = const Size(400, 800),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);

  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      home: widget,
    ),
  );
  await tester.pumpAndSettle();

  await expectLater(
    find.byType(MaterialApp),
    matchesGoldenFile('goldens/$goldenFileName.png'),
  );
}
```

### Directory Structure

```
test/
├── goldens/
│   ├── buttons/
│   │   ├── primary_button.png
│   │   └── secondary_button.png
│   ├── screens/
│   │   ├── login_screen.png
│   │   └── home_screen.png
│   └── components/
│       ├── user_card.png
│       └── status_badge.png
└── golden_tests/
    ├── button_golden_test.dart
    └── screen_golden_test.dart
```

## Writing Golden Tests

### Basic Golden Test

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MyButton golden test', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: MyButton(
              label: 'Click Me',
              onPressed: () {},
            ),
          ),
        ),
      ),
    );

    await expectLater(
      find.byType(MyButton),
      matchesGoldenFile('goldens/my_button.png'),
    );
  });
}
```

### Golden Test with Fixed Size

```dart
testWidgets('LoginScreen golden test', (tester) async {
  // Set fixed screen size for consistency
  tester.view.physicalSize = const Size(375, 812); // iPhone X
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);

  await tester.pumpWidget(
    const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: LoginScreen(),
    ),
  );
  await tester.pumpAndSettle();

  await expectLater(
    find.byType(LoginScreen),
    matchesGoldenFile('goldens/screens/login_screen.png'),
  );
});
```

### Testing Multiple States

```dart
void main() {
  group('StatusBadge golden tests', () {
    for (final status in Status.values) {
      testWidgets('StatusBadge - ${status.name}', (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: Center(
                child: StatusBadge(status: status),
              ),
            ),
          ),
        );

        await expectLater(
          find.byType(StatusBadge),
          matchesGoldenFile('goldens/status_badge_${status.name}.png'),
        );
      });
    }
  });
}
```

### Testing Themes

```dart
void main() {
  group('Button theme golden tests', () {
    testWidgets('light theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: lightTheme,
          home: const Scaffold(body: Center(child: MyButton())),
        ),
      );

      await expectLater(
        find.byType(MyButton),
        matchesGoldenFile('goldens/button_light.png'),
      );
    });

    testWidgets('dark theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: darkTheme,
          home: const Scaffold(body: Center(child: MyButton())),
        ),
      );

      await expectLater(
        find.byType(MyButton),
        matchesGoldenFile('goldens/button_dark.png'),
      );
    });
  });
}
```

### Testing Responsive Layouts

```dart
void main() {
  final screenSizes = {
    'mobile': const Size(375, 812),
    'tablet': const Size(768, 1024),
    'desktop': const Size(1440, 900),
  };

  group('ResponsiveLayout golden tests', () {
    for (final entry in screenSizes.entries) {
      testWidgets('${entry.key} layout', (tester) async {
        tester.view.physicalSize = entry.value;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(
          const MaterialApp(
            debugShowCheckedModeBanner: false,
            home: ResponsiveLayout(),
          ),
        );
        await tester.pumpAndSettle();

        await expectLater(
          find.byType(ResponsiveLayout),
          matchesGoldenFile('goldens/layout_${entry.key}.png'),
        );
      });
    }
  });
}
```

## Running Golden Tests

### Generate Golden Files

```bash
# Generate/update all golden files
flutter test --update-goldens

# Update specific test file
flutter test test/golden_tests/button_golden_test.dart --update-goldens
```

### Run Golden Tests

```bash
# Run all golden tests
flutter test test/golden_tests/

# Run specific golden test
flutter test test/golden_tests/button_golden_test.dart
```

## Handling Platform Differences

### Font Rendering Issues

Golden tests may produce different results on different platforms due to font rendering. Solutions:

```dart
// Option 1: Use Ahem font (platform-independent)
testWidgets('text golden test', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: ThemeData(
        fontFamily: 'Ahem', // Platform-independent test font
      ),
      home: const MyWidget(),
    ),
  );
  // ...
});

// Option 2: Skip on CI
testWidgets(
  'golden test',
  (tester) async {
    // ...
  },
  skip: Platform.environment.containsKey('CI'),
);

// Option 3: Use tolerance
testWidgets('golden test with tolerance', (tester) async {
  await tester.pumpWidget(const MyWidget());

  await expectLater(
    find.byType(MyWidget),
    matchesGoldenFile(
      'goldens/my_widget.png',
      // Allow small differences
    ),
  );
});
```

### Custom Golden File Comparator

```dart
// test/flutter_test_config.dart
import 'dart:async';
import 'package:flutter_test/flutter_test.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  // Set tolerance for golden comparisons
  goldenFileComparator = LocalFileComparatorWithThreshold(0.5);
  await testMain();
}

class LocalFileComparatorWithThreshold extends LocalFileComparator {
  final double threshold;

  LocalFileComparatorWithThreshold(this.threshold)
      : super(Uri.parse('test/'));

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    final result = await GoldenFileComparator.compareLists(
      imageBytes,
      await getGoldenBytes(golden),
    );
    return result.passed || result.diffPercent <= threshold;
  }
}
```

## Best Practices

### DO ✅

- Use fixed screen sizes for consistency
- Disable debug banner (`debugShowCheckedModeBanner: false`)
- Group related golden tests
- Use descriptive file names
- Test all visual states (enabled, disabled, loading, error)
- Commit golden files to version control
- Review golden file changes in PRs

### DON'T ❌

- Don't test dynamic content (timestamps, random data)
- Don't rely on golden tests for logic verification
- Don't ignore golden test failures without investigation
- Don't use golden tests for every widget (focus on critical UI)

## Troubleshooting

### Golden Test Fails After Update

```bash
# Regenerate golden files
flutter test --update-goldens

# Review changes
git diff test/goldens/
```

### Inconsistent Results

```dart
// Ensure animations are complete
await tester.pumpAndSettle();

// Or pump specific duration
await tester.pump(const Duration(milliseconds: 500));
```

### Missing Fonts

```dart
// Load fonts before tests
void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    // Fonts load automatically in Flutter 3.x
  });

  // ... tests
}
```

### Image Assets Not Loading

```dart
// Mock image provider for tests
testWidgets('widget with image', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Image.asset(
        'assets/logo.png',
        // Use a placeholder for tests
        errorBuilder: (_, __, ___) => const Icon(Icons.image),
      ),
    ),
  );
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  golden-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.x"

      - name: Install dependencies
        run: flutter pub get

      - name: Run golden tests
        run: flutter test test/golden_tests/

      - name: Upload golden failures
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: golden-failures
          path: test/failures/
```

### Handling CI Failures

```dart
// Skip golden tests on CI if needed
void main() {
  final isCI = Platform.environment.containsKey('CI');

  testWidgets(
    'golden test',
    (tester) async {
      // ...
    },
    skip: isCI ? 'Golden tests disabled on CI' : null,
  );
}
```
