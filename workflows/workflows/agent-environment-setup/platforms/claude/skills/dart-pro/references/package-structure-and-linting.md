# Package Structure and Linting

## Recommended Package Layout

```
my_package/
├── lib/
│   ├── my_package.dart          # Barrel file — public API exports
│   └── src/
│       ├── models/
│       │   ├── user.dart
│       │   └── order.dart
│       ├── services/
│       │   └── auth_service.dart
│       └── utils/
│           └── validators.dart
├── test/
│   ├── models/
│   │   └── user_test.dart
│   └── services/
│       └── auth_service_test.dart
├── example/                      # Usage examples (libraries)
├── analysis_options.yaml
├── pubspec.yaml
└── pubspec.lock                  # Commit for apps, .gitignore for libraries
```

## Barrel File Pattern

```dart
// lib/my_package.dart — only export public API
library my_package;

export 'src/models/user.dart';
export 'src/models/order.dart';
export 'src/services/auth_service.dart';
// DO NOT export implementation-only files

// Use show/hide for selective exports
export 'src/models/user.dart' show User, UserRole;
export 'src/models/user.dart' hide InternalUserState;
```

## pubspec.yaml Best Practices

```yaml
name: my_package
description: A concise description of what this package does.
version: 1.2.3
publish_to: none # Remove for pub.dev publishing

environment:
  sdk: ^3.9.0 # Pin to minimum required version

dependencies:
  http: ^1.2.0
  riverpod: ^2.6.0

dev_dependencies:
  test: ^1.25.0
  mocktail: ^1.0.0
  very_good_analysis: ^7.0.0 # Or flutter_lints
  build_runner: ^2.4.0
  json_serializable: ^6.8.0

# For monorepo workspaces (Dart 3.5+)
workspace:
  - packages/core
  - packages/api
  - packages/app
```

## analysis_options.yaml

```yaml
# Use a lint package as base
include: package:very_good_analysis/analysis_options.yaml

analyzer:
  language:
    strict-casts: true # No implicit casts from dynamic
    strict-inference: true # No implicit dynamic types
    strict-raw-types: true # No raw generic types

  errors:
    # Treat these as errors in CI
    unused_import: error
    unused_local_variable: warning
    dead_code: warning
    todo: ignore

  exclude:
    - "**/*.g.dart" # Generated code
    - "**/*.freezed.dart"
    - "build/**"

linter:
  rules:
    # Additional rules beyond the base package
    - prefer_single_quotes
    - require_trailing_commas
    - sort_constructors_first
    - unawaited_futures # Catch missing awaits
    - close_sinks # Catch unclosed StreamControllers
    - cancel_subscriptions # Catch uncancelled subscriptions
    - avoid_dynamic_calls # Prevent calls on dynamic
    - prefer_const_constructors
    - prefer_const_declarations
```

## Dependency Audit Workflow

```bash
# Check for outdated dependencies
dart pub outdated

# Upgrade to latest compatible versions
dart pub upgrade

# Upgrade to latest major versions (breaking changes)
dart pub upgrade --major-versions

# Audit dependency tree
dart pub deps

# Check for known vulnerabilities (if publishing)
dart pub publish --dry-run

# Run full analysis
dart analyze
dart format --set-exit-if-changed .
dart test --coverage
```

## Part and Part-of Directives

```dart
// Use part files for code generation (json_serializable, freezed)
// user.dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart'; // generated code

@JsonSerializable()
class User {
  final String name;
  final int age;

  User({required this.name, required this.age});

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

// DO NOT use part/part-of for manual code organization — use imports instead
```

## Library-Level Visibility

```dart
// src/ files are private to the package — not importable from outside
// Only files exported via barrel file are public API

// For package-internal but cross-file visibility, use @visibleForTesting
import 'package:meta/meta.dart';

class Cache {
  @visibleForTesting
  final Map<String, dynamic> store = {};

  // ... public API
}
```

## Monorepo with Pub Workspaces

```yaml
# Root pubspec.yaml
name: my_workspace
publish_to: none
environment:
  sdk: ^3.9.0
workspace:
  - packages/core
  - packages/api_client
  - packages/app

# packages/app/pubspec.yaml
dependencies:
  core: # Resolved from workspace
  api_client: # Resolved from workspace
resolution: workspace # Use workspace resolution
```
