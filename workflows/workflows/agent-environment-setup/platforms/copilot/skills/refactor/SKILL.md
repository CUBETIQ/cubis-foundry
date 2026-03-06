---
name: "refactor"
description: "Migrate legacy code to new architecture while maintaining behavior"
---
# Refactor - OneUp HR

## Migration Patterns

### State: Legacy → Riverpod

```dart
// FROM
class _MyScreenState extends State<MyScreen> {
  bool _isLoading = false;
}

// TO
@riverpod
class MyNotifier extends _$MyNotifier {
  @override
  FutureOr<State> build() => State.initial();
}
```

### Models: Class → Freezed

```dart
// FROM
class User {
  final String id;
  User({required this.id});
}

// TO
@freezed
class User with _$User {
  const factory User({required String id}) = _User;
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

### Colors: Hardcoded → Tokens

```dart
// FROM
Color(0xFF123456)
Colors.white

// TO
context.colors.primary
OneColor.white
```

## Checklist

- [ ] Replace hardcoded values with design tokens
- [ ] Convert to Riverpod providers
- [ ] Add freezed for models
- [ ] Remove dead code
- [ ] Verify behavior unchanged
