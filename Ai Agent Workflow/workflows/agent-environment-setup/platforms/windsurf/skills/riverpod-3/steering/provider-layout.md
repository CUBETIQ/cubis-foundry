# Provider layout (Riverpod 3 codegen, general)

## Naming conventions

- Repository DI provider: `{feature}RepositoryProvider`
- Controller provider (AsyncNotifier): `{feature}ControllerProvider`
- Query/filter families: `{feature}QueryProvider`
- App-wide state providers: `{name}Provider` with `@Riverpod(keepAlive: true)` only when justified

## Suggested structure

```
features/{feature}/
├── data/
│   ├── datasources/
│   ├── repositories/
│   └── models/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
└── presentation/
    ├── providers/
    ├── views/
    └── widgets/
```

## Dependency boundaries

- UI widgets watch presentation providers only.
- Presentation providers call domain use cases (preferred in clean architecture).
- Data layer implementations are injected behind domain interfaces.
- Do not import concrete database/network clients into UI providers.

## Provider roles

- Read providers: load and expose queryable state.
- Mutation providers/notifiers: execute commands (create/update/delete).
- Session/auth/router providers: global lifecycle, typically keepAlive.

## Parameter rules for families

Use parameters with stable equality:
- primitives/enums,
- immutable value objects (Freezed/equatable).

Avoid:
- mutable `List/Map` params,
- anonymous objects without stable `==/hashCode`.

## Minimal skeleton

```dart
part 'orders_controller.g.dart';

@riverpod
class OrdersController extends _$OrdersController {
  @override
  FutureOr<OrdersState> build({required OrdersQuery query}) async {
    final useCase = ref.watch(getOrdersUseCaseProvider);
    final items = await useCase(query);
    return OrdersState(items: items);
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}
```

## When to split providers further

Split when:
- one provider manages unrelated concerns,
- write paths exceed simple command handlers,
- separate lifecycles are needed (long-lived global + short-lived page state).
