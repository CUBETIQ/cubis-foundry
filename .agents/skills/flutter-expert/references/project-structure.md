# Project Structure

## Feature-Based Structure (Pragmatic Architecture)

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── config/             # Environment config
│   ├── design_system/      # OneUp Design System (One* components)
│   ├── network/            # Dio client, interceptors, Result type
│   ├── providers/          # Session, auth, environment
│   ├── router/             # GoRouter config, guards
│   ├── cache/              # Cache service
│   └── utils/              # Extensions, validators, logger
├── features/
│   └── <feature>/
│       ├── data/
│       │   ├── <feature>_api.dart          # Retrofit client
│       │   ├── <feature>_cache.dart        # Local cache (optional)
│       │   └── <feature>_repository.dart   # Conductor + inline DI provider
│       ├── models/
│       │   └── <feature>.dart              # ONE Freezed class (entity + fromJson)
│       ├── <feature>_controller.dart       # ONE AsyncNotifier — reads + writes
│       ├── <feature>_state.dart            # Freezed state (optional)
│       ├── views/                          # Screens
│       └── widgets/                        # Feature-specific widgets
├── shared/
│   ├── widgets/            # Shared UI components
│   ├── models/             # Shared models
│   └── utils/              # Shared utilities
└── routes/
    └── app_router.dart
```

## Feature Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **data/** | API client, cache, repository (conductor) |
| **models/** | Freezed models with fromJson (one class, not entity+model) |
| **controller** | AsyncNotifier — reads + writes, owns feature state |
| **views/** | UI screens |
| **widgets/** | Feature-specific UI components |

## Key Rules

- No `domain/` folder unless feature has complex business rules
- No `usecases/` folder — controller calls repo directly
- No separate `providers/` folder — DI lives inline in repository file
- No entity/model split — one Freezed class serves both
- Each feature is self-contained (earn_point is its own feature, not nested in profile)

## Main Entry Point

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      routerConfig: router,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
    );
  }
}
```
