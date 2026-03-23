import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:xyz_ecommerce_app/app.dart';
import 'package:xyz_ecommerce_app/models/commerce_models.dart';

const _stateKey = 'xyz.shop.state.v1';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Finder textContaining(String value) {
    return find.byWidgetPredicate(
      (widget) =>
          widget is Text && widget.data != null && widget.data!.contains(value),
    );
  }

  Future<void> settle(
    WidgetTester tester, [
    Duration pause = const Duration(milliseconds: 900),
  ]) async {
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(pause);
  }

  Future<void> waitFor(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 25),
  }) async {
    final deadline = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(deadline)) {
      await settle(tester);
      if (finder.evaluate().isNotEmpty) return;
    }
    expect(finder, findsWidgets);
  }

  Future<void> tapAndWait(
    WidgetTester tester,
    Finder target,
    Finder next,
  ) async {
    await waitFor(tester, target);
    await tester.ensureVisible(target);
    await tester.tap(target, warnIfMissed: false);
    await settle(tester, const Duration(milliseconds: 1200));
    await waitFor(tester, next);
  }

  Future<void> slowScrollUntilVisible(
    WidgetTester tester,
    Finder target,
    Finder scrollable, {
    double step = 220,
    Duration timeout = const Duration(seconds: 20),
  }) async {
    final deadline = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(deadline)) {
      if (target.evaluate().isNotEmpty) {
        await tester.ensureVisible(target);
        return;
      }
      await tester.drag(scrollable, Offset(0, -step));
      await settle(tester, const Duration(milliseconds: 1200));
    }
    expect(target, findsWidgets);
  }

  Future<void> launchWithState(
    WidgetTester tester,
    PersistedShopState state,
    Finder initialScreen,
  ) async {
    SharedPreferences.setMockInitialValues({_stateKey: state.toJson()});
    await tester.pumpWidget(const XyzEcommerceApp());
    await waitFor(tester, initialScreen);
  }

  PersistedShopState authenticatedState({
    List<String> wishlistIds = const [],
    List<String> recentlyViewedIds = const [],
    List<CartLine> cartLines = const [],
    List<OrderRecord> orders = const [],
    bool editorialAlertsEnabled = true,
    bool priceDropAlertsEnabled = true,
  }) {
    return PersistedShopState(
      hasCompletedOnboarding: true,
      isAuthenticated: true,
      wishlistIds: wishlistIds,
      recentlyViewedIds: recentlyViewedIds,
      cartLines: cartLines,
      orders: orders,
      editorialAlertsEnabled: editorialAlertsEnabled,
      priceDropAlertsEnabled: priceDropAlertsEnabled,
    );
  }

  testWidgets(
    'onboarding, auth, home, detail, wishlist, and recent views work',
    (tester) async {
      await launchWithState(
        tester,
        PersistedShopState.empty(),
        find.byKey(const Key('onboarding-screen')),
      );

      await tapAndWait(
        tester,
        find.byKey(const Key('onboarding-continue')),
        find.byKey(const Key('login-screen')),
      );

      await tester.enterText(find.byKey(const Key('login-password')), 'wrong');
      await tapAndWait(
        tester,
        find.byKey(const Key('login-submit')),
        find.text('Use root / 123 for the default buyer account.'),
      );

      await tester.enterText(find.byKey(const Key('login-password')), '123');
      await tapAndWait(
        tester,
        find.byKey(const Key('login-submit')),
        find.byKey(const Key('home-tab')),
      );

      await waitFor(
        tester,
        find.byKey(const Key('product-card-atelier-trench')),
      );
      await tester.tap(
        find.byKey(const Key('product-card-atelier-trench')),
        warnIfMissed: false,
      );
      await settle(tester, const Duration(milliseconds: 1200));
      await waitFor(tester, find.byKey(const Key('product-detail-screen')));
      await tester.tap(find.byKey(const Key('product-detail-wishlist')));
      await settle(tester, const Duration(milliseconds: 1200));
      await tester.pageBack();
      await waitFor(tester, find.byKey(const Key('home-tab')));

      final homeScrollable = find.descendant(
        of: find.byKey(const Key('home-tab')),
        matching: find.byWidgetPredicate(
          (widget) =>
              widget is Scrollable &&
              widget.axisDirection == AxisDirection.down,
        ),
      );
      await slowScrollUntilVisible(
        tester,
        find.byKey(const Key('recent-product-atelier-trench')),
        homeScrollable,
      );

      await tapAndWait(
        tester,
        find.text('Wishlist'),
        find.byKey(const Key('wishlist-tab')),
      );
      await waitFor(
        tester,
        find.byKey(const Key('wishlist-product-atelier-trench')),
      );
    },
  );

  testWidgets(
    'browse, search, category filter, cart, checkout, and orders work',
    (tester) async {
      await launchWithState(
        tester,
        authenticatedState(),
        find.byKey(const Key('home-tab')),
      );

      await tapAndWait(
        tester,
        find.byKey(const Key('shop-all-button')),
        find.byKey(const Key('catalog-screen')),
      );
      await tapAndWait(
        tester,
        find.byKey(const Key('catalog-category-outerwear')),
        find.byKey(const Key('catalog-product-atelier-trench')),
      );

      await tester.enterText(
        find.byKey(const Key('catalog-search-field')),
        'Belted Trench',
      );
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await settle(tester, const Duration(milliseconds: 1200));
      await waitFor(
        tester,
        find.byKey(const Key('catalog-product-atelier-trench')),
      );

      await tester.tap(
        find.byKey(const Key('catalog-product-atelier-trench')),
        warnIfMissed: false,
      );
      await settle(tester, const Duration(milliseconds: 1200));
      await waitFor(tester, find.byKey(const Key('product-detail-screen')));

      final detailScrollable = find.descendant(
        of: find.byKey(const Key('product-detail-scroll')),
        matching: find.byType(Scrollable),
      );
      await slowScrollUntilVisible(
        tester,
        find.byKey(const Key('product-add-to-cart')),
        detailScrollable,
      );
      await tester.tap(find.byKey(const Key('product-add-to-cart')));
      await settle(tester, const Duration(milliseconds: 1200));
      await tester.pageBack();
      await waitFor(tester, find.byKey(const Key('catalog-screen')));
      await tester.pageBack();
      await waitFor(tester, find.byKey(const Key('home-tab')));

      await tapAndWait(
        tester,
        find.text('Cart'),
        find.byKey(const Key('cart-tab')),
      );
      await waitFor(tester, textContaining('Atelier Belted Trench'));
      await tapAndWait(
        tester,
        find.byKey(const Key('cart-checkout-button')),
        find.byKey(const Key('checkout-screen')),
      );
      await waitFor(tester, find.byKey(const Key('checkout-place-order')));
      await tester.tap(find.byKey(const Key('checkout-place-order')));
      await settle(tester, const Duration(milliseconds: 1200));
      await waitFor(tester, find.byKey(const Key('order-success-screen')));
      await waitFor(tester, find.text('Order confirmed'));
      await tapAndWait(
        tester,
        find.byKey(const Key('order-success-continue')),
        find.byKey(const Key('orders-tab')),
      );

      await waitFor(tester, textContaining('Confirmed'));
      await waitFor(tester, textContaining('Atelier Belted Trench'));
    },
  );

  testWidgets('profile settings and logout work from persisted state', (
    tester,
  ) async {
    final seededOrder = OrderRecord(
      id: 'XYZ-SEEDED-1',
      createdAtIso: DateTime(2026, 3, 21, 12, 0).toIso8601String(),
      status: 'Confirmed',
      shippingName: 'Root Buyer',
      shippingAddress: '88 Editorial Row',
      shippingCity: 'Phnom Penh',
      paymentLabel: 'Card ending in 4242',
      items: const [
        OrderItemSnapshot(
          productId: 'atelier-trench',
          productName: 'Atelier Belted Trench',
          imageUrl:
              'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
          size: 'S',
          color: 'Sand',
          quantity: 1,
          unitPrice: 248,
        ),
      ],
      total: 266,
    );

    await launchWithState(
      tester,
      authenticatedState(
        wishlistIds: const ['atelier-trench'],
        recentlyViewedIds: const ['atelier-trench'],
        orders: [seededOrder],
      ),
      find.byKey(const Key('home-tab')),
    );

    await tapAndWait(
      tester,
      find.text('Orders'),
      find.byKey(const Key('orders-tab')),
    );
    await waitFor(tester, find.byKey(const Key('order-card-XYZ-SEEDED-1')));

    await tapAndWait(
      tester,
      find.text('Profile'),
      find.byKey(const Key('profile-tab')),
    );
    await waitFor(tester, find.text('Profile & Settings'));
    await tester.tap(find.byKey(const Key('profile-editorial-alerts')));
    await settle(tester, const Duration(milliseconds: 1200));
    await tester.tap(find.byKey(const Key('profile-price-drop-alerts')));
    await settle(tester, const Duration(milliseconds: 1200));
    await tapAndWait(
      tester,
      find.byKey(const Key('profile-logout')),
      find.byKey(const Key('login-screen')),
    );
  });
}
