# Widget Testing Guide

## Overview

Widget tests verify that UI components render correctly and respond appropriately to user interactions. They run faster than integration tests while providing more confidence than unit tests for UI code.

## When to Write Widget Tests

- Custom widgets and components
- Screen layouts and navigation
- Form validation and submission
- User interactions (taps, swipes, text input)
- State changes reflected in UI
- Error states and loading indicators

## Test Structure

### Basic Widget Test

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('should display title', (WidgetTester tester) async {
    // Arrange & Act
    await tester.pumpWidget(
      const MaterialApp(
        home: MyWidget(title: 'Hello'),
      ),
    );

    // Assert
    expect(find.text('Hello'), findsOneWidget);
  });
}
```

### Pump App Helper

```dart
// test/helpers/pump_app.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

extension PumpApp on WidgetTester {
  Future<void> pumpApp(
    Widget widget, {
    List<Override> overrides = const [],
  }) async {
    await pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          home: widget,
        ),
      ),
    );
  }

  Future<void> pumpAppWithScaffold(
    Widget widget, {
    List<Override> overrides = const [],
  }) async {
    await pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          home: Scaffold(body: widget),
        ),
      ),
    );
  }
}

// Usage
testWidgets('example', (tester) async {
  await tester.pumpApp(const MyWidget());
  // ...
});
```

## Finders

### By Type

```dart
// Find by widget type
find.byType(ElevatedButton)
find.byType(TextField)
find.byType(CircularProgressIndicator)
find.byType(ListTile)
```

### By Text

```dart
// Exact text match
find.text('Submit')

// Text containing substring
find.textContaining('Hello')

// Rich text
find.byWidgetPredicate(
  (widget) => widget is RichText &&
      widget.text.toPlainText().contains('Hello'),
)
```

### By Key

```dart
// In widget
ElevatedButton(
  key: const Key('login_button'),
  onPressed: () {},
  child: const Text('Login'),
)

// In test
find.byKey(const Key('login_button'))
```

### By Icon

```dart
find.byIcon(Icons.add)
find.byIcon(Icons.delete)
```

### By Semantic Label

```dart
find.bySemanticsLabel('Submit button')
find.bySemanticsLabel(RegExp('Submit.*'))
```

### Descendant Finder

```dart
// Find text within a specific widget
find.descendant(
  of: find.byType(Card),
  matching: find.text('Title'),
)

// Find button within a form
find.descendant(
  of: find.byType(Form),
  matching: find.byType(ElevatedButton),
)
```

### Ancestor Finder

```dart
// Find the Card containing specific text
find.ancestor(
  of: find.text('Title'),
  matching: find.byType(Card),
)
```

### Widget Predicate

```dart
// Custom finder logic
find.byWidgetPredicate(
  (widget) => widget is Text &&
      widget.style?.color == Colors.red,
)

find.byWidgetPredicate(
  (widget) => widget is Container &&
      widget.constraints?.maxWidth == 200,
)
```

## Matchers

### Widget Count

```dart
expect(find.byType(ListTile), findsNWidgets(3));
expect(find.text('Error'), findsNothing);
expect(find.byType(ElevatedButton), findsOneWidget);
expect(find.byType(Text), findsAtLeastNWidgets(2));
expect(find.byType(Icon), findsWidgets); // At least one
```

### Widget Properties

```dart
// Get widget and check properties
final textWidget = tester.widget<Text>(find.text('Hello'));
expect(textWidget.style?.fontSize, equals(16));
expect(textWidget.style?.color, equals(Colors.black));

// Check enabled state
final button = tester.widget<ElevatedButton>(
  find.byType(ElevatedButton),
);
expect(button.onPressed, isNotNull); // Button is enabled
expect(button.onPressed, isNull); // Button is disabled
```

## User Interactions

### Tap

```dart
testWidgets('should handle tap', (tester) async {
  await tester.pumpApp(const CounterWidget());

  // Tap button
  await tester.tap(find.byType(ElevatedButton));
  await tester.pump(); // Rebuild after state change

  expect(find.text('1'), findsOneWidget);
});
```

### Long Press

```dart
await tester.longPress(find.byType(ListTile));
await tester.pump();
```

### Double Tap

```dart
await tester.tap(find.byType(GestureDetector));
await tester.pump(const Duration(milliseconds: 50));
await tester.tap(find.byType(GestureDetector));
await tester.pump();
```

### Drag and Swipe

```dart
// Drag by offset
await tester.drag(
  find.byType(Dismissible),
  const Offset(500, 0), // Swipe right
);
await tester.pumpAndSettle();

// Fling (fast swipe)
await tester.fling(
  find.byType(ListView),
  const Offset(0, -200), // Scroll down
  1000, // velocity
);
await tester.pumpAndSettle();
```

### Text Input

```dart
testWidgets('should handle text input', (tester) async {
  await tester.pumpApp(const LoginForm());

  // Enter text
  await tester.enterText(
    find.byKey(const Key('email_field')),
    'test@example.com',
  );
  await tester.pump();

  // Verify text was entered
  expect(find.text('test@example.com'), findsOneWidget);
});
```

### Keyboard Actions

```dart
// Submit form with keyboard
await tester.testTextInput.receiveAction(TextInputAction.done);
await tester.pump();

// Or use enterText followed by testTextInput
await tester.enterText(find.byType(TextField), 'text');
await tester.testTextInput.receiveAction(TextInputAction.search);
```

## Pump Methods

### pump()

```dart
// Rebuild widget tree once
await tester.pump();

// Rebuild after specific duration
await tester.pump(const Duration(milliseconds: 100));
```

### pumpAndSettle()

```dart
// Wait for all animations to complete
await tester.pumpAndSettle();

// With timeout
await tester.pumpAndSettle(const Duration(seconds: 5));
```

### pumpFrames()

```dart
// Pump specific number of frames
for (int i = 0; i < 10; i++) {
  await tester.pump(const Duration(milliseconds: 16));
}
```

## Testing Async Operations

### Loading States

```dart
testWidgets('should show loading then data', (tester) async {
  await tester.pumpApp(
    const DataScreen(),
    overrides: [
      dataProvider.overrideWith((ref) async {
        await Future.delayed(const Duration(milliseconds: 100));
        return ['Item 1', 'Item 2'];
      }),
    ],
  );

  // Initially shows loading
  expect(find.byType(CircularProgressIndicator), findsOneWidget);

  // Wait for data to load
  await tester.pumpAndSettle();

  // Shows data
  expect(find.byType(CircularProgressIndicator), findsNothing);
  expect(find.text('Item 1'), findsOneWidget);
});
```

### Error States

```dart
testWidgets('should show error message', (tester) async {
  await tester.pumpApp(
    const DataScreen(),
    overrides: [
      dataProvider.overrideWith((ref) => throw Exception('Network error')),
    ],
  );

  await tester.pumpAndSettle();

  expect(find.text('Network error'), findsOneWidget);
  expect(find.byType(ElevatedButton), findsOneWidget); // Retry button
});
```

## Testing Navigation

### Basic Navigation

```dart
testWidgets('should navigate to detail screen', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: const ListScreen(),
      routes: {
        '/detail': (_) => const DetailScreen(),
      },
    ),
  );

  await tester.tap(find.byType(ListTile).first);
  await tester.pumpAndSettle();

  expect(find.byType(DetailScreen), findsOneWidget);
});
```

### GoRouter Navigation

```dart
testWidgets('should navigate with GoRouter', (tester) async {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp.router(routerConfig: router),
    ),
  );

  await tester.tap(find.byKey(const Key('profile_button')));
  await tester.pumpAndSettle();

  expect(find.byType(ProfileScreen), findsOneWidget);
});
```

## Testing Forms

```dart
testWidgets('should validate and submit form', (tester) async {
  var submitted = false;

  await tester.pumpApp(
    LoginForm(
      onSubmit: (email, password) {
        submitted = true;
      },
    ),
  );

  // Enter invalid email
  await tester.enterText(
    find.byKey(const Key('email_field')),
    'invalid',
  );
  await tester.tap(find.byType(ElevatedButton));
  await tester.pump();

  // Should show validation error
  expect(find.text('Invalid email'), findsOneWidget);
  expect(submitted, isFalse);

  // Enter valid data
  await tester.enterText(
    find.byKey(const Key('email_field')),
    'test@example.com',
  );
  await tester.enterText(
    find.byKey(const Key('password_field')),
    'password123',
  );
  await tester.tap(find.byType(ElevatedButton));
  await tester.pump();

  // Should submit
  expect(submitted, isTrue);
});
```

## Testing Dialogs and Bottom Sheets

### Dialogs

```dart
testWidgets('should show confirmation dialog', (tester) async {
  await tester.pumpApp(const DeleteButton());

  await tester.tap(find.byType(ElevatedButton));
  await tester.pumpAndSettle();

  // Dialog should appear
  expect(find.byType(AlertDialog), findsOneWidget);
  expect(find.text('Are you sure?'), findsOneWidget);

  // Tap confirm
  await tester.tap(find.text('Confirm'));
  await tester.pumpAndSettle();

  // Dialog should close
  expect(find.byType(AlertDialog), findsNothing);
});
```

### Bottom Sheets

```dart
testWidgets('should show bottom sheet', (tester) async {
  await tester.pumpApp(const OptionsButton());

  await tester.tap(find.byType(ElevatedButton));
  await tester.pumpAndSettle();

  expect(find.byType(BottomSheet), findsOneWidget);
  expect(find.text('Option 1'), findsOneWidget);
});
```

## Testing Scrollable Widgets

```dart
testWidgets('should scroll to item', (tester) async {
  await tester.pumpApp(
    ListView.builder(
      itemCount: 100,
      itemBuilder: (_, i) => ListTile(title: Text('Item $i')),
    ),
  );

  // Item 50 is not visible initially
  expect(find.text('Item 50'), findsNothing);

  // Scroll until visible
  await tester.scrollUntilVisible(
    find.text('Item 50'),
    500, // scroll delta
    scrollable: find.byType(Scrollable),
  );

  expect(find.text('Item 50'), findsOneWidget);
});
```

## Debugging Widget Tests

### Print Widget Tree

```dart
testWidgets('debug example', (tester) async {
  await tester.pumpApp(const MyWidget());

  // Print entire widget tree
  debugDumpApp();

  // Print render tree
  debugDumpRenderTree();

  // Print layer tree
  debugDumpLayerTree();
});
```

### Check Widget Existence

```dart
// Evaluate finder to see what it finds
final finder = find.byType(Text);
print('Found ${finder.evaluate().length} Text widgets');

for (final element in finder.evaluate()) {
  final widget = element.widget as Text;
  print('Text: ${widget.data}');
}
```

## Common Patterns

### Testing Conditional Rendering

```dart
testWidgets('should show different content based on state', (tester) async {
  await tester.pumpApp(
    const ConditionalWidget(),
    overrides: [
      isLoggedInProvider.overrideWith((ref) => false),
    ],
  );

  expect(find.text('Please login'), findsOneWidget);
  expect(find.text('Welcome'), findsNothing);
});
```

### Testing Callbacks

```dart
testWidgets('should call onPressed callback', (tester) async {
  var callCount = 0;

  await tester.pumpApp(
    MyButton(onPressed: () => callCount++),
  );

  await tester.tap(find.byType(ElevatedButton));
  await tester.pump();

  expect(callCount, equals(1));
});
```

### Testing with MediaQuery

```dart
testWidgets('should adapt to screen size', (tester) async {
  // Set custom screen size
  tester.view.physicalSize = const Size(320, 480);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);

  await tester.pumpApp(const ResponsiveWidget());

  // Should show mobile layout
  expect(find.byKey(const Key('mobile_layout')), findsOneWidget);
});
```
