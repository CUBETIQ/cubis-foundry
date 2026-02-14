# Integration Testing Guide (E2E)

## Overview

Integration tests (E2E tests) run on real devices or emulators and automate full user flows like login, navigation, form submission, etc. They simulate real user interactions with your actual app.

## Two Approaches

| Package            | Best For                     | Native Access |
| ------------------ | ---------------------------- | ------------- |
| `integration_test` | Basic UI flows               | ❌ No         |
| `patrol`           | Full E2E with native dialogs | ✅ Yes        |

**Recommendation:** Use `patrol` for real-world testing - it can handle permission dialogs, notifications, and native UI that `integration_test` cannot.

---

## Setup

### Option 1: Official integration_test

```yaml
# pubspec.yaml
dev_dependencies:
  integration_test:
    sdk: flutter
  flutter_test:
    sdk: flutter
```

### Option 2: Patrol (Recommended)

```yaml
# pubspec.yaml
dev_dependencies:
  patrol: ^3.13.0
  patrol_finders: ^2.3.0

# Add patrol config
patrol:
  app_name: OneUp HR
  android:
    package_name: com.oneup.hr
  ios:
    bundle_id: com.oneup.hr
```

Install Patrol CLI:

```bash
dart pub global activate patrol_cli
```

---

## Project Structure

```
integration_test/
├── app_test.dart              # Main test entry
├── robots/                    # Page Object pattern
│   ├── login_robot.dart
│   ├── home_robot.dart
│   └── overtime_robot.dart
├── config/
│   └── test_config.dart       # Test credentials & config
└── flows/
    ├── login_flow_test.dart
    ├── overtime_flow_test.dart
    └── profile_flow_test.dart
```

---

## Test Configuration

### Secure Test Credentials

```dart
// integration_test/config/test_config.dart

/// Test configuration - DO NOT commit real credentials!
/// Use environment variables or a .env file
class TestConfig {
  // Load from environment or use test defaults
  static String get baseUrl =>
      const String.fromEnvironment('TEST_BASE_URL',
        defaultValue: 'https://staging-api.oneup.com');

  static String get testEmail =>
      const String.fromEnvironment('TEST_EMAIL',
        defaultValue: 'test@example.com');

  static String get testPassword =>
      const String.fromEnvironment('TEST_PASSWORD',
        defaultValue: 'testpassword123');

  static String get testOrgCode =>
      const String.fromEnvironment('TEST_ORG_CODE',
        defaultValue: 'TESTORG');

  // Test user data
  static const testUser = TestUser(
    email: 'test@example.com',
    password: 'testpassword123',
    orgCode: 'TESTORG',
    name: 'Test User',
  );
}

class TestUser {
  final String email;
  final String password;
  final String orgCode;
  final String name;

  const TestUser({
    required this.email,
    required this.password,
    required this.orgCode,
    required this.name,
  });
}
```

### Running with Credentials

```bash
# Pass credentials via environment
flutter test integration_test \
  --dart-define=TEST_EMAIL=real@email.com \
  --dart-define=TEST_PASSWORD=realpassword \
  --dart-define=TEST_ORG_CODE=REALORG

# Or with Patrol
patrol test \
  --dart-define=TEST_EMAIL=real@email.com \
  --dart-define=TEST_PASSWORD=realpassword
```

---

## Integration Test (Official Package)

### Basic Test Structure

```dart
// integration_test/app_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:oneup/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Login Flow', () {
    testWidgets('should login with valid credentials', (tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle();

      // Enter organization code
      await tester.enterText(
        find.byKey(const Key('org_code_field')),
        TestConfig.testOrgCode,
      );
      await tester.tap(find.byKey(const Key('continue_button')));
      await tester.pumpAndSettle();

      // Enter email
      await tester.enterText(
        find.byKey(const Key('email_field')),
        TestConfig.testEmail,
      );
      await tester.pumpAndSettle();

      // Enter password
      await tester.enterText(
        find.byKey(const Key('password_field')),
        TestConfig.testPassword,
      );
      await tester.pumpAndSettle();

      // Tap login button
      await tester.tap(find.byKey(const Key('login_button')));
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Verify we're on home screen
      expect(find.byKey(const Key('home_screen')), findsOneWidget);
    });
  });
}
```

### Running Integration Tests

```bash
# Run on connected device/emulator
flutter test integration_test/app_test.dart

# Run on specific device
flutter test integration_test/app_test.dart -d <device_id>

# Run with verbose output
flutter test integration_test/app_test.dart --verbose
```

---

## Patrol Testing (Recommended)

### Basic Patrol Test

```dart
// integration_test/app_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:oneup/main.dart' as app;

import 'config/test_config.dart';

void main() {
  patrolTest('Login and navigate to overtime', ($) async {
    // Launch app (don't use runApp, use $.pumpWidget)
    await $.pumpWidgetAndSettle(app.createApp());

    // Enter org code
    await $(#org_code_field).enterText(TestConfig.testOrgCode);
    await $(#continue_button).tap();

    // Enter credentials
    await $(#email_field).enterText(TestConfig.testEmail);
    await $(#password_field).enterText(TestConfig.testPassword);
    await $(#login_button).tap();

    // Wait for home screen
    await $.pumpAndSettle(timeout: const Duration(seconds: 10));
    expect($(#home_screen), findsOneWidget);

    // Navigate to overtime
    await $(#overtime_menu_item).tap();
    await $.pumpAndSettle();

    expect($(#overtime_list_screen), findsOneWidget);
  });
}
```

### Patrol with Native Automation

```dart
// integration_test/flows/permission_flow_test.dart
import 'package:patrol/patrol.dart';

void main() {
  patrolTest('Handle location permission', ($) async {
    await $.pumpWidgetAndSettle(app.createApp());

    // Login first
    await loginAsTestUser($);

    // Navigate to check-in (requires location)
    await $(#checkin_button).tap();

    // Handle native permission dialog
    if (await $.native.isPermissionDialogVisible()) {
      await $.native.grantPermissionWhenInUse();
    }

    // Continue with check-in flow
    await $.pumpAndSettle();
    expect($(#checkin_success), findsOneWidget);
  });

  patrolTest('Handle camera permission', ($) async {
    await $.pumpWidgetAndSettle(app.createApp());
    await loginAsTestUser($);

    // Navigate to QR scan
    await $(#scan_qr_button).tap();

    // Handle camera permission
    if (await $.native.isPermissionDialogVisible()) {
      await $.native.grantPermissionWhenInUse();
    }

    await $.pumpAndSettle();
    expect($(#camera_preview), findsOneWidget);
  });
}
```

### Running Patrol Tests

```bash
# Build and run tests
patrol test

# Run specific test file
patrol test integration_test/flows/login_flow_test.dart

# Run on specific device
patrol test -d <device_id>

# Run with verbose output
patrol test --verbose

# Build only (for CI)
patrol build android
patrol build ios
```

---

## Page Object Pattern (Robots)

### Login Robot

```dart
// integration_test/robots/login_robot.dart
import 'package:patrol/patrol.dart';
import '../config/test_config.dart';

class LoginRobot {
  final PatrolIntegrationTester $;

  LoginRobot(this.$);

  Future<void> enterOrgCode(String code) async {
    await $(#org_code_field).enterText(code);
    await $(#continue_button).tap();
    await $.pumpAndSettle();
  }

  Future<void> enterCredentials({
    required String email,
    required String password,
  }) async {
    await $(#email_field).enterText(email);
    await $(#password_field).enterText(password);
  }

  Future<void> tapLogin() async {
    await $(#login_button).tap();
    await $.pumpAndSettle(timeout: const Duration(seconds: 10));
  }

  Future<void> loginWithTestUser() async {
    await enterOrgCode(TestConfig.testOrgCode);
    await enterCredentials(
      email: TestConfig.testEmail,
      password: TestConfig.testPassword,
    );
    await tapLogin();
  }

  Future<void> loginWith({
    required String orgCode,
    required String email,
    required String password,
  }) async {
    await enterOrgCode(orgCode);
    await enterCredentials(email: email, password: password);
    await tapLogin();
  }

  Future<void> verifyLoginError(String message) async {
    expect($(message), findsOneWidget);
  }

  Future<void> verifyOnHomeScreen() async {
    expect($(#home_screen), findsOneWidget);
  }
}
```

### Overtime Robot

```dart
// integration_test/robots/overtime_robot.dart
import 'package:patrol/patrol.dart';

class OvertimeRobot {
  final PatrolIntegrationTester $;

  OvertimeRobot(this.$);

  Future<void> navigateToOvertime() async {
    await $(#drawer_menu).tap();
    await $.pumpAndSettle();
    await $(#overtime_menu_item).tap();
    await $.pumpAndSettle();
  }

  Future<void> tapCreateNew() async {
    await $(#create_overtime_fab).tap();
    await $.pumpAndSettle();
  }

  Future<void> fillOvertimeForm({
    required DateTime date,
    required int durationMinutes,
    String? description,
  }) async {
    // Select date
    await $(#date_picker_field).tap();
    await $.pumpAndSettle();
    // ... date picker interaction

    // Enter duration
    await $(#duration_field).enterText(durationMinutes.toString());

    // Enter description
    if (description != null) {
      await $(#description_field).enterText(description);
    }
  }

  Future<void> submitForm() async {
    await $(#submit_button).tap();
    await $.pumpAndSettle(timeout: const Duration(seconds: 5));
  }

  Future<void> verifyOvertimeCreated() async {
    expect($(#success_message), findsOneWidget);
  }

  Future<void> verifyOvertimeInList(String description) async {
    expect($(description), findsOneWidget);
  }
}
```

### Using Robots in Tests

```dart
// integration_test/flows/overtime_flow_test.dart
import 'package:patrol/patrol.dart';
import '../robots/login_robot.dart';
import '../robots/overtime_robot.dart';

void main() {
  patrolTest('Create overtime request', ($) async {
    await $.pumpWidgetAndSettle(app.createApp());

    final login = LoginRobot($);
    final overtime = OvertimeRobot($);

    // Login
    await login.loginWithTestUser();
    await login.verifyOnHomeScreen();

    // Navigate to overtime
    await overtime.navigateToOvertime();

    // Create new overtime
    await overtime.tapCreateNew();
    await overtime.fillOvertimeForm(
      date: DateTime.now(),
      durationMinutes: 120,
      description: 'Test overtime request',
    );
    await overtime.submitForm();

    // Verify
    await overtime.verifyOvertimeCreated();
  });
}
```

---

## Common Test Flows

### Full Login Flow Test

```dart
// integration_test/flows/login_flow_test.dart
import 'package:patrol/patrol.dart';
import '../config/test_config.dart';
import '../robots/login_robot.dart';

void main() {
  group('Login Flow', () {
    patrolTest('successful login with valid credentials', ($) async {
      await $.pumpWidgetAndSettle(app.createApp());
      final login = LoginRobot($);

      await login.loginWithTestUser();
      await login.verifyOnHomeScreen();
    });

    patrolTest('shows error with invalid credentials', ($) async {
      await $.pumpWidgetAndSettle(app.createApp());
      final login = LoginRobot($);

      await login.loginWith(
        orgCode: TestConfig.testOrgCode,
        email: 'wrong@email.com',
        password: 'wrongpassword',
      );

      await login.verifyLoginError('Invalid credentials');
    });

    patrolTest('shows error with invalid org code', ($) async {
      await $.pumpWidgetAndSettle(app.createApp());
      final login = LoginRobot($);

      await login.enterOrgCode('INVALID');
      await login.verifyLoginError('Organization not found');
    });
  });
}
```

### App Initialization for Tests

```dart
// lib/app_initializer.dart
import 'package:flutter/material.dart';

/// Create app for both main.dart and integration tests
Widget createApp({bool isTest = false}) {
  // Don't call WidgetsFlutterBinding.ensureInitialized() in tests
  // Don't modify FlutterError.onError in tests

  return ProviderScope(
    child: MaterialApp.router(
      routerConfig: router,
      // ... other config
    ),
  );
}

// main.dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Setup crashlytics, etc.
  runApp(createApp());
}

// integration_test/app_test.dart
patrolTest('example', ($) async {
  await $.pumpWidgetAndSettle(createApp(isTest: true));
  // ...
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/integration_test.yml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  integration-test-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          script: |
            flutter test integration_test \
              --dart-define=TEST_EMAIL=${{ secrets.TEST_EMAIL }} \
              --dart-define=TEST_PASSWORD=${{ secrets.TEST_PASSWORD }}

  integration-test-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - name: Start iOS Simulator
        run: |
          xcrun simctl boot "iPhone 14"
      - name: Run tests
        run: |
          flutter test integration_test \
            --dart-define=TEST_EMAIL=${{ secrets.TEST_EMAIL }} \
            --dart-define=TEST_PASSWORD=${{ secrets.TEST_PASSWORD }}
```

### Firebase Test Lab

```bash
# Build for Firebase Test Lab
patrol build android --target integration_test/app_test.dart

# Upload to Firebase Test Lab
gcloud firebase test android run \
  --type instrumentation \
  --app build/app/outputs/apk/debug/app-debug.apk \
  --test build/app/outputs/apk/androidTest/debug/app-debug-androidTest.apk
```

---

## Best Practices

### DO ✅

- Use Page Object pattern (Robots) for maintainability
- Store credentials in environment variables, not code
- Add meaningful Keys to widgets for reliable finding
- Use `pumpAndSettle` with timeout for async operations
- Test critical user flows (login, main features)
- Run on real devices for final verification

### DON'T ❌

- Don't hardcode real credentials in test files
- Don't test every screen (focus on critical paths)
- Don't rely on text finders (use Keys)
- Don't skip waiting for async operations
- Don't run integration tests on every commit (too slow)

---

## Troubleshooting

### Test hangs on login

```dart
// Add explicit timeout
await $.pumpAndSettle(timeout: const Duration(seconds: 15));

// Or pump frames manually
for (var i = 0; i < 100; i++) {
  await $.pump(const Duration(milliseconds: 100));
  if ($(#home_screen).evaluate().isNotEmpty) break;
}
```

### Widget not found

```dart
// Ensure widget has a Key
ElevatedButton(
  key: const Key('login_button'),  // Add this!
  onPressed: () {},
  child: const Text('Login'),
)

// Use scrollUntilVisible for items in lists
await $.scrollUntilVisible(finder: $(#item_50));
```

### Permission dialog not handled

```dart
// Use Patrol's native automation
if (await $.native.isPermissionDialogVisible()) {
  await $.native.grantPermissionWhenInUse();
}
```

---

## Commands Reference

```bash
# Official integration_test
flutter test integration_test/app_test.dart
flutter test integration_test -d <device_id>

# Patrol
patrol test
patrol test -d <device_id>
patrol test --verbose
patrol build android
patrol build ios

# With credentials
flutter test integration_test \
  --dart-define=TEST_EMAIL=user@test.com \
  --dart-define=TEST_PASSWORD=password123
```
