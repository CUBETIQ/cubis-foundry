import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/commerce_models.dart';
import '../repositories/shop_repository.dart';

class ShopController extends ChangeNotifier {
  ShopController(this._repository);

  final ShopRepository _repository;

  late final List<Product> _products = _repository.products;

  bool _hasCompletedOnboarding = false;
  bool _isAuthenticated = false;
  bool _editorialAlertsEnabled = true;
  bool _priceDropAlertsEnabled = true;
  final Set<String> _wishlistIds = <String>{};
  final List<String> _recentlyViewedIds = <String>[];
  final List<CartLine> _cartLines = <CartLine>[];
  final List<OrderRecord> _orders = <OrderRecord>[];
  String? _authError;

  bool get hasCompletedOnboarding => _hasCompletedOnboarding;
  bool get isAuthenticated => _isAuthenticated;
  bool get editorialAlertsEnabled => _editorialAlertsEnabled;
  bool get priceDropAlertsEnabled => _priceDropAlertsEnabled;
  String? get authError => _authError;
  List<Product> get products => List.unmodifiable(_products);
  Set<String> get wishlistIds => Set.unmodifiable(_wishlistIds);
  List<String> get recentlyViewedIds => List.unmodifiable(_recentlyViewedIds);
  List<CartLine> get cartLines => List.unmodifiable(_cartLines);
  List<OrderRecord> get orders => List.unmodifiable(_orders.reversed);

  List<Product> get featuredProducts =>
      _products.take(4).toList(growable: false);

  List<Product> get newArrivalProducts => _products
      .where((product) => product.badges.contains('New Season'))
      .toList(growable: false);

  List<Product> get wishlistedProducts => _products
      .where((product) => _wishlistIds.contains(product.id))
      .toList(growable: false);

  List<Product> get recentlyViewedProducts => _recentlyViewedIds
      .map(getProductById)
      .whereType<Product>()
      .toList(growable: false);

  double get cartSubtotal => _cartLines.fold<double>(
    0,
    (sum, line) =>
        sum + (getProductById(line.productId)?.price ?? 0) * line.quantity,
  );

  double get shippingCost =>
      _cartLines.isEmpty ? 0 : (cartSubtotal >= 250 ? 0 : 18);

  double get orderTotal => cartSubtotal + shippingCost;

  int get cartItemCount =>
      _cartLines.fold<int>(0, (sum, line) => sum + line.quantity);

  Future<void> load() async {
    final state = await _repository.loadState();
    _hasCompletedOnboarding = state.hasCompletedOnboarding;
    _isAuthenticated = state.isAuthenticated;
    _wishlistIds
      ..clear()
      ..addAll(state.wishlistIds);
    _recentlyViewedIds
      ..clear()
      ..addAll(state.recentlyViewedIds);
    _cartLines
      ..clear()
      ..addAll(state.cartLines);
    _orders
      ..clear()
      ..addAll(state.orders);
    _editorialAlertsEnabled = state.editorialAlertsEnabled;
    _priceDropAlertsEnabled = state.priceDropAlertsEnabled;
    notifyListeners();
  }

  Product? getProductById(String id) {
    for (final product in _products) {
      if (product.id == id) return product;
    }
    return null;
  }

  List<Product> productsForCategory(String category) {
    if (category == 'All') return products;
    return _products
        .where((product) => product.category == category)
        .toList(growable: false);
  }

  List<Product> filteredProducts({String query = '', String category = 'All'}) {
    final normalizedQuery = query.trim().toLowerCase();
    return _products
        .where((product) {
          final categoryMatch =
              category == 'All' || product.category == category;
          final queryMatch =
              normalizedQuery.isEmpty ||
              product.name.toLowerCase().contains(normalizedQuery) ||
              product.brand.toLowerCase().contains(normalizedQuery) ||
              product.category.toLowerCase().contains(normalizedQuery);
          return categoryMatch && queryMatch;
        })
        .toList(growable: false);
  }

  void completeOnboarding() {
    _hasCompletedOnboarding = true;
    _persistAndNotify();
  }

  bool login(String username, String password) {
    if (username.trim() == 'root' && password == '123') {
      _authError = null;
      _isAuthenticated = true;
      _persistAndNotify();
      return true;
    }
    _authError = 'Use root / 123 for the default buyer account.';
    notifyListeners();
    return false;
  }

  void clearAuthError() {
    if (_authError == null) return;
    _authError = null;
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    _authError = null;
    _persistAndNotify();
  }

  void toggleWishlist(String productId) {
    if (_wishlistIds.contains(productId)) {
      _wishlistIds.remove(productId);
    } else {
      _wishlistIds.add(productId);
    }
    _persistAndNotify();
  }

  void markViewed(String productId) {
    _recentlyViewedIds.remove(productId);
    _recentlyViewedIds.insert(0, productId);
    if (_recentlyViewedIds.length > 8) {
      _recentlyViewedIds.removeRange(8, _recentlyViewedIds.length);
    }
    _persistAndNotify();
  }

  void addToCart({
    required Product product,
    required String size,
    required String color,
  }) {
    final id = '${product.id}|$size|$color';
    final index = _cartLines.indexWhere((line) => line.id == id);
    if (index >= 0) {
      _cartLines[index] = _cartLines[index].copyWith(
        quantity: _cartLines[index].quantity + 1,
      );
    } else {
      _cartLines.add(
        CartLine(
          id: id,
          productId: product.id,
          quantity: 1,
          size: size,
          color: color,
        ),
      );
    }
    markViewed(product.id);
  }

  void updateCartQuantity(String lineId, int quantity) {
    final index = _cartLines.indexWhere((line) => line.id == lineId);
    if (index < 0) return;
    if (quantity <= 0) {
      _cartLines.removeAt(index);
    } else {
      _cartLines[index] = _cartLines[index].copyWith(quantity: quantity);
    }
    _persistAndNotify();
  }

  void removeCartLine(String lineId) {
    _cartLines.removeWhere((line) => line.id == lineId);
    _persistAndNotify();
  }

  void setEditorialAlertsEnabled(bool value) {
    _editorialAlertsEnabled = value;
    _persistAndNotify();
  }

  void setPriceDropAlertsEnabled(bool value) {
    _priceDropAlertsEnabled = value;
    _persistAndNotify();
  }

  OrderRecord placeOrder({
    required String shippingName,
    required String shippingAddress,
    required String shippingCity,
    required String paymentLabel,
  }) {
    final now = DateTime.now();
    final items = _cartLines
        .map((line) {
          final product = getProductById(line.productId)!;
          return OrderItemSnapshot(
            productId: product.id,
            productName: product.name,
            imageUrl: product.imageUrl,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
            unitPrice: product.price,
          );
        })
        .toList(growable: false);

    final order = OrderRecord(
      id: 'XYZ-${now.millisecondsSinceEpoch}',
      createdAtIso: now.toIso8601String(),
      status: 'Confirmed',
      shippingName: shippingName,
      shippingAddress: shippingAddress,
      shippingCity: shippingCity,
      paymentLabel: paymentLabel,
      items: items,
      total: orderTotal,
    );
    _orders.add(order);
    _cartLines.clear();
    _persistAndNotify();
    return order;
  }

  void _persistAndNotify() {
    unawaited(
      _repository.saveState(
        PersistedShopState(
          hasCompletedOnboarding: _hasCompletedOnboarding,
          isAuthenticated: _isAuthenticated,
          wishlistIds: _wishlistIds.toList(growable: false),
          recentlyViewedIds: _recentlyViewedIds.toList(growable: false),
          cartLines: _cartLines.toList(growable: false),
          orders: _orders.toList(growable: false),
          editorialAlertsEnabled: _editorialAlertsEnabled,
          priceDropAlertsEnabled: _priceDropAlertsEnabled,
        ),
      ),
    );
    notifyListeners();
  }
}
