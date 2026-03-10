# Composite Provider Pattern

## The Rule
When a screen needs data from multiple features (e.g. product + category +
inventory), NEVER import one repository from another repository. Compose at
the Riverpod provider layer only.

## Pattern
```dart
// Result type — freezed sealed class
@freezed
class ProductDetailState with _$ProductDetailState {
  const factory ProductDetailState({
    required Product product,
    required Category category,
    required InventoryStock inventory,
  }) = _ProductDetailState;
}

// Composite provider — each repo stays independent
@riverpod
Future<ProductDetailState> productDetail(Ref ref, String productId) async {
  final product = await ref.watch(productRepositoryProvider).getById(productId);
  if (product == null) throw AppError.client(
    requestId: const Uuid().v4(),
    statusCode: 404,
    userMessage: 'Product not found',
  );
  final category  = await ref.watch(categoryRepositoryProvider).getById(product.categoryId);
  final inventory = await ref.watch(inventoryRepositoryProvider).getByProduct(productId);

  return ProductDetailState(
    product:   product,
    category:  category!,
    inventory: inventory,
  );
}
```

## Test
```dart
test('composes all three repos', () async {
  final container = ProviderContainer(overrides: [
    productRepositoryProvider.overrideWith((_) => FakeProductRepository()),
    categoryRepositoryProvider.overrideWith((_) => FakeCategoryRepository()),
    inventoryRepositoryProvider.overrideWith((_) => FakeInventoryRepository()),
  ]);
  final state = await container.read(productDetailProvider('p1').future);
  expect(state.category.name, isNotEmpty);
  expect(state.inventory, isNotNull);
});
```

## When to use
- Screen needs data from 2+ features
- Provider function (not a Notifier) — it's read-only composition
- State type is a dedicated `<Feature>DetailState` freezed class
- File goes in: `features/<main-feature>/presentation/providers/<n>_detail_provider.dart`
