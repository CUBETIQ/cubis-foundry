import 'dart:convert';

String formatUsd(double value) {
  final decimals = value.truncateToDouble() == value ? 0 : 2;
  return '\$${value.toStringAsFixed(decimals)}';
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.category,
    required this.price,
    required this.imageUrl,
    required this.galleryUrls,
    required this.description,
    required this.materials,
    required this.fitNotes,
    required this.sizes,
    required this.colors,
    required this.rating,
    required this.reviewCount,
    this.originalPrice,
    this.badges = const [],
  });

  final String id;
  final String name;
  final String brand;
  final String category;
  final double price;
  final double? originalPrice;
  final String imageUrl;
  final List<String> galleryUrls;
  final String description;
  final String materials;
  final String fitNotes;
  final List<String> sizes;
  final List<String> colors;
  final double rating;
  final int reviewCount;
  final List<String> badges;
}

class CartLine {
  const CartLine({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.size,
    required this.color,
  });

  final String id;
  final String productId;
  final int quantity;
  final String size;
  final String color;

  CartLine copyWith({
    String? id,
    String? productId,
    int? quantity,
    String? size,
    String? color,
  }) {
    return CartLine(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      quantity: quantity ?? this.quantity,
      size: size ?? this.size,
      color: color ?? this.color,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'productId': productId,
      'quantity': quantity,
      'size': size,
      'color': color,
    };
  }

  factory CartLine.fromMap(Map<String, dynamic> map) {
    return CartLine(
      id: map['id'] as String,
      productId: map['productId'] as String,
      quantity: (map['quantity'] as num).toInt(),
      size: map['size'] as String,
      color: map['color'] as String,
    );
  }
}

class OrderItemSnapshot {
  const OrderItemSnapshot({
    required this.productId,
    required this.productName,
    required this.imageUrl,
    required this.size,
    required this.color,
    required this.quantity,
    required this.unitPrice,
  });

  final String productId;
  final String productName;
  final String imageUrl;
  final String size;
  final String color;
  final int quantity;
  final double unitPrice;

  double get lineTotal => unitPrice * quantity;

  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'productName': productName,
      'imageUrl': imageUrl,
      'size': size,
      'color': color,
      'quantity': quantity,
      'unitPrice': unitPrice,
    };
  }

  factory OrderItemSnapshot.fromMap(Map<String, dynamic> map) {
    return OrderItemSnapshot(
      productId: map['productId'] as String,
      productName: map['productName'] as String,
      imageUrl: map['imageUrl'] as String,
      size: map['size'] as String,
      color: map['color'] as String,
      quantity: (map['quantity'] as num).toInt(),
      unitPrice: (map['unitPrice'] as num).toDouble(),
    );
  }
}

class OrderRecord {
  const OrderRecord({
    required this.id,
    required this.createdAtIso,
    required this.status,
    required this.shippingName,
    required this.shippingAddress,
    required this.shippingCity,
    required this.paymentLabel,
    required this.items,
    required this.total,
  });

  final String id;
  final String createdAtIso;
  final String status;
  final String shippingName;
  final String shippingAddress;
  final String shippingCity;
  final String paymentLabel;
  final List<OrderItemSnapshot> items;
  final double total;

  DateTime get createdAt => DateTime.parse(createdAtIso);

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'createdAtIso': createdAtIso,
      'status': status,
      'shippingName': shippingName,
      'shippingAddress': shippingAddress,
      'shippingCity': shippingCity,
      'paymentLabel': paymentLabel,
      'items': items.map((item) => item.toMap()).toList(),
      'total': total,
    };
  }

  factory OrderRecord.fromMap(Map<String, dynamic> map) {
    final items = (map['items'] as List<dynamic>? ?? const [])
        .map((item) => OrderItemSnapshot.fromMap(item as Map<String, dynamic>))
        .toList();
    return OrderRecord(
      id: map['id'] as String,
      createdAtIso: map['createdAtIso'] as String,
      status: map['status'] as String,
      shippingName: map['shippingName'] as String,
      shippingAddress: map['shippingAddress'] as String,
      shippingCity: map['shippingCity'] as String,
      paymentLabel: map['paymentLabel'] as String,
      items: items,
      total: (map['total'] as num).toDouble(),
    );
  }
}

class PersistedShopState {
  const PersistedShopState({
    required this.hasCompletedOnboarding,
    required this.isAuthenticated,
    required this.wishlistIds,
    required this.recentlyViewedIds,
    required this.cartLines,
    required this.orders,
    required this.editorialAlertsEnabled,
    required this.priceDropAlertsEnabled,
  });

  factory PersistedShopState.empty() {
    return const PersistedShopState(
      hasCompletedOnboarding: false,
      isAuthenticated: false,
      wishlistIds: [],
      recentlyViewedIds: [],
      cartLines: [],
      orders: [],
      editorialAlertsEnabled: true,
      priceDropAlertsEnabled: true,
    );
  }

  final bool hasCompletedOnboarding;
  final bool isAuthenticated;
  final List<String> wishlistIds;
  final List<String> recentlyViewedIds;
  final List<CartLine> cartLines;
  final List<OrderRecord> orders;
  final bool editorialAlertsEnabled;
  final bool priceDropAlertsEnabled;

  Map<String, dynamic> toMap() {
    return {
      'hasCompletedOnboarding': hasCompletedOnboarding,
      'isAuthenticated': isAuthenticated,
      'wishlistIds': wishlistIds,
      'recentlyViewedIds': recentlyViewedIds,
      'cartLines': cartLines.map((line) => line.toMap()).toList(),
      'orders': orders.map((order) => order.toMap()).toList(),
      'editorialAlertsEnabled': editorialAlertsEnabled,
      'priceDropAlertsEnabled': priceDropAlertsEnabled,
    };
  }

  String toJson() => jsonEncode(toMap());

  factory PersistedShopState.fromJson(String raw) {
    final map = jsonDecode(raw) as Map<String, dynamic>;
    return PersistedShopState(
      hasCompletedOnboarding: map['hasCompletedOnboarding'] as bool? ?? false,
      isAuthenticated: map['isAuthenticated'] as bool? ?? false,
      wishlistIds: (map['wishlistIds'] as List<dynamic>? ?? const [])
          .map((value) => value as String)
          .toList(),
      recentlyViewedIds:
          (map['recentlyViewedIds'] as List<dynamic>? ?? const [])
              .map((value) => value as String)
              .toList(),
      cartLines: (map['cartLines'] as List<dynamic>? ?? const [])
          .map((line) => CartLine.fromMap(line as Map<String, dynamic>))
          .toList(),
      orders: (map['orders'] as List<dynamic>? ?? const [])
          .map((order) => OrderRecord.fromMap(order as Map<String, dynamic>))
          .toList(),
      editorialAlertsEnabled: map['editorialAlertsEnabled'] as bool? ?? true,
      priceDropAlertsEnabled: map['priceDropAlertsEnabled'] as bool? ?? true,
    );
  }
}
