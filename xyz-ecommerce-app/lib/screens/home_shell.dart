import 'package:flutter/material.dart';

import '../data/seed_catalog.dart';
import '../models/commerce_models.dart';
import '../state/shop_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/product_card.dart';
import 'catalog_browse_screen.dart';
import 'checkout_screen.dart';
import 'order_success_screen.dart';
import 'product_detail_screen.dart';

class ShopHomeShell extends StatefulWidget {
  const ShopHomeShell({super.key, required this.controller});

  final ShopController controller;

  @override
  State<ShopHomeShell> createState() => _ShopHomeShellState();
}

class _ShopHomeShellState extends State<ShopHomeShell> {
  int _index = 0;

  Future<void> _openProduct(Product product) async {
    widget.controller.markViewed(product.id);
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ProductDetailScreen(
          product: product,
          isWishlisted: widget.controller.wishlistIds.contains(product.id),
          onToggleWishlist: () =>
              setState(() => widget.controller.toggleWishlist(product.id)),
          onAddToCart: (size, color) {
            widget.controller.addToCart(
              product: product,
              size: size,
              color: color,
            );
            setState(() {});
          },
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  Future<void> _openBrowse([String initialCategory = 'All']) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CatalogBrowseScreen(
          products: widget.controller.products,
          wishlistIds: widget.controller.wishlistIds,
          initialCategory: initialCategory,
          onProductTap: _openProduct,
          onToggleWishlist: (productId) {
            setState(() => widget.controller.toggleWishlist(productId));
          },
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  Future<void> _startCheckout() async {
    final result = await Navigator.of(context).push<CheckoutResult>(
      MaterialPageRoute<CheckoutResult>(
        builder: (_) => CheckoutScreen(
          subtotal: widget.controller.cartSubtotal,
          shippingCost: widget.controller.shippingCost,
          total: widget.controller.orderTotal,
        ),
      ),
    );
    if (!mounted || result == null) return;
    final order = widget.controller.placeOrder(
      shippingName: result.shippingName,
      shippingAddress: result.shippingAddress,
      shippingCity: result.shippingCity,
      paymentLabel: result.paymentLabel,
    );
    setState(() => _index = 3);
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => OrderSuccessScreen(order: order)),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _HomeTab(
        controller: widget.controller,
        onOpenProduct: _openProduct,
        onOpenBrowse: _openBrowse,
      ),
      _WishlistTab(controller: widget.controller, onOpenProduct: _openProduct),
      _CartTab(controller: widget.controller, onCheckout: _startCheckout),
      _OrdersTab(controller: widget.controller),
      _ProfileTab(controller: widget.controller),
    ];

    return Scaffold(
      body: SafeArea(
        child: AnimatedBuilder(
          animation: widget.controller,
          builder: (context, _) => pages[_index],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.storefront_outlined),
            selectedIcon: const Icon(Icons.storefront_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: const Icon(Icons.favorite_border_rounded),
            selectedIcon: const Icon(Icons.favorite_rounded),
            label: 'Wishlist',
          ),
          NavigationDestination(
            icon: Badge.count(
              count: widget.controller.cartItemCount,
              isLabelVisible: widget.controller.cartItemCount > 0,
              child: const Icon(Icons.shopping_bag_outlined),
            ),
            selectedIcon: Badge.count(
              count: widget.controller.cartItemCount,
              isLabelVisible: widget.controller.cartItemCount > 0,
              child: const Icon(Icons.shopping_bag_rounded),
            ),
            label: 'Cart',
          ),
          NavigationDestination(
            icon: const Icon(Icons.receipt_long_outlined),
            selectedIcon: const Icon(Icons.receipt_long_rounded),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.controller,
    required this.onOpenProduct,
    required this.onOpenBrowse,
  });

  final ShopController controller;
  final ValueChanged<Product> onOpenProduct;
  final ValueChanged<String> onOpenBrowse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      key: const ValueKey('home-tab'),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
      children: [
        Text('XYZ ecommerce', style: theme.textTheme.bodyMedium),
        const SizedBox(height: 4),
        Text(
          'Editorial shopping, minus the noise',
          style: theme.textTheme.headlineMedium,
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            gradient: const LinearGradient(
              colors: [AppTheme.plum, AppTheme.berry],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'THE SPRING EDIT',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Build a sharper wardrobe with pieces that travel from workday to late dinner.',
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 18),
              FilledButton(
                key: const ValueKey('shop-all-button'),
                onPressed: () => onOpenBrowse('All'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.plum,
                ),
                child: const Text('Shop the collection'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        _SectionHeader(
          title: 'Categories',
          actionLabel: 'Browse all',
          onAction: () => onOpenBrowse('All'),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: storefrontCategories.length - 1,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final category = storefrontCategories[index + 1];
              return ActionChip(
                label: Text(category),
                onPressed: () => onOpenBrowse(category),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
        _SectionHeader(
          title: 'Featured now',
          actionLabel: 'Explore',
          onAction: () => onOpenBrowse('All'),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 370,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: controller.featuredProducts.length,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final product = controller.featuredProducts[index];
              return SizedBox(
                width: 224,
                child: ProductCard(
                  product: product,
                  isWishlisted: controller.wishlistIds.contains(product.id),
                  onTap: () => onOpenProduct(product),
                  onToggleWishlist: () => controller.toggleWishlist(product.id),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
        _SectionHeader(
          title: 'Recently viewed',
          actionLabel: 'See all',
          onAction: () => onOpenBrowse('All'),
        ),
        const SizedBox(height: 12),
        if (controller.recentlyViewedProducts.isEmpty)
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(28),
            ),
            child: Text(
              'Open any product to start a recent-viewed trail for QA.',
              style: theme.textTheme.bodyLarge,
            ),
          )
        else
          SizedBox(
            height: 140,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemBuilder: (context, index) {
                final product = controller.recentlyViewedProducts[index];
                return SizedBox(
                  width: 260,
                  child: InkWell(
                    key: ValueKey('recent-product-${product.id}'),
                    onTap: () => onOpenProduct(product),
                    borderRadius: BorderRadius.circular(26),
                    child: Ink(
                      decoration: BoxDecoration(
                        color: AppTheme.card,
                        borderRadius: BorderRadius.circular(26),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.horizontal(
                              left: Radius.circular(26),
                            ),
                            child: SizedBox(
                              width: 98,
                              child: Image.network(
                                product.imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    Container(color: AppTheme.blush),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    product.brand,
                                    style: theme.textTheme.bodyMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    product.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: theme.textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    formatUsd(product.price),
                                    style: theme.textTheme.titleMedium
                                        ?.copyWith(color: AppTheme.berry),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemCount: controller.recentlyViewedProducts.length,
            ),
          ),
      ],
    );
  }
}

class _WishlistTab extends StatelessWidget {
  const _WishlistTab({required this.controller, required this.onOpenProduct});

  final ShopController controller;
  final ValueChanged<Product> onOpenProduct;

  @override
  Widget build(BuildContext context) {
    final products = controller.wishlistedProducts;
    final theme = Theme.of(context);
    if (products.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Wishlist a piece from the home or browse flow to keep it here.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyLarge,
          ),
        ),
      );
    }

    return GridView.builder(
      key: const ValueKey('wishlist-tab'),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 96),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 0.58,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        return ProductCard(
          surfaceKey: ValueKey('wishlist-product-${product.id}'),
          product: product,
          isWishlisted: true,
          onTap: () => onOpenProduct(product),
          onToggleWishlist: () => controller.toggleWishlist(product.id),
        );
      },
    );
  }
}

class _CartTab extends StatelessWidget {
  const _CartTab({required this.controller, required this.onCheckout});

  final ShopController controller;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (controller.cartLines.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Your bag is empty. Add a product to test the checkout flow.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyLarge,
          ),
        ),
      );
    }

    return ListView(
      key: const ValueKey('cart-tab'),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 96),
      children: [
        Text('Your cart', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 14),
        ...controller.cartLines.map((line) {
          final product = controller.getProductById(line.productId)!;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(26),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: SizedBox(
                      width: 84,
                      height: 110,
                      child: Image.network(
                        product.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            Container(color: AppTheme.blush),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(product.brand, style: theme.textTheme.bodyMedium),
                        const SizedBox(height: 4),
                        Text(product.name, style: theme.textTheme.titleMedium),
                        const SizedBox(height: 6),
                        Text(
                          '${line.size} • ${line.color}',
                          style: theme.textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _QtyButton(
                              icon: Icons.remove_rounded,
                              onPressed: () => controller.updateCartQuantity(
                                line.id,
                                line.quantity - 1,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              child: Text(
                                '${line.quantity}',
                                style: theme.textTheme.titleMedium,
                              ),
                            ),
                            _QtyButton(
                              icon: Icons.add_rounded,
                              onPressed: () => controller.updateCartQuantity(
                                line.id,
                                line.quantity + 1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    height: 110,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        IconButton(
                          onPressed: () => controller.removeCartLine(line.id),
                          icon: const Icon(Icons.close_rounded),
                        ),
                        Text(
                          formatUsd(product.price * line.quantity),
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: AppTheme.berry,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            children: [
              _SummaryRow(
                label: 'Subtotal',
                value: formatUsd(controller.cartSubtotal),
              ),
              const SizedBox(height: 10),
              _SummaryRow(
                label: 'Shipping',
                value: controller.shippingCost == 0
                    ? 'Free'
                    : formatUsd(controller.shippingCost),
              ),
              const Divider(height: 28),
              _SummaryRow(
                label: 'Total',
                value: formatUsd(controller.orderTotal),
                emphasize: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        FilledButton(
          key: const ValueKey('cart-checkout-button'),
          onPressed: onCheckout,
          child: const Text('Checkout'),
        ),
      ],
    );
  }
}

class _OrdersTab extends StatelessWidget {
  const _OrdersTab({required this.controller});

  final ShopController controller;

  @override
  Widget build(BuildContext context) {
    final orders = controller.orders;
    final theme = Theme.of(context);
    if (orders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Place a checkout order to populate the local order history.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyLarge,
          ),
        ),
      );
    }

    return ListView.separated(
      key: const ValueKey('orders-tab'),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 96),
      itemBuilder: (context, index) {
        final order = orders[index];
        return Container(
          key: ValueKey('order-card-${order.id}'),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(order.id, style: theme.textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(
                '${order.status} • ${order.items.length} items',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 6),
              Text(
                '${order.createdAt.year}-${order.createdAt.month.toString().padLeft(2, '0')}-${order.createdAt.day.toString().padLeft(2, '0')}',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 14),
              ...order.items
                  .take(2)
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        '${item.productName} • ${item.quantity} x ${formatUsd(item.unitPrice)}',
                        style: theme.textTheme.bodyLarge,
                      ),
                    ),
                  ),
              const Divider(height: 26),
              Text(
                formatUsd(order.total),
                style: theme.textTheme.titleMedium?.copyWith(
                  color: AppTheme.berry,
                ),
              ),
            ],
          ),
        );
      },
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemCount: orders.length,
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({required this.controller});

  final ShopController controller;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      key: const ValueKey('profile-tab'),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 96),
      children: [
        Text('Profile & Settings', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Root buyer', style: theme.textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(
                'Default QA account for the local commerce flow.',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            children: [
              SwitchListTile.adaptive(
                key: const ValueKey('profile-editorial-alerts'),
                contentPadding: EdgeInsets.zero,
                title: const Text('Editorial alerts'),
                subtitle: const Text(
                  'Get drops, restocks, and campaign launches.',
                ),
                value: controller.editorialAlertsEnabled,
                onChanged: controller.setEditorialAlertsEnabled,
              ),
              const Divider(),
              SwitchListTile.adaptive(
                key: const ValueKey('profile-price-drop-alerts'),
                contentPadding: EdgeInsets.zero,
                title: const Text('Price drop alerts'),
                subtitle: const Text(
                  'Track wishlist pieces when they go on markdown.',
                ),
                value: controller.priceDropAlertsEnabled,
                onChanged: controller.setPriceDropAlertsEnabled,
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        FilledButton.tonal(
          key: const ValueKey('profile-logout'),
          onPressed: controller.logout,
          child: const Text('Log out'),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: theme.textTheme.titleLarge),
        TextButton(onPressed: onAction, child: Text(actionLabel)),
      ],
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: AppTheme.blush,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, size: 18),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.emphasize = false,
  });

  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final style = emphasize
        ? Theme.of(context).textTheme.titleMedium
        : Theme.of(context).textTheme.bodyLarge;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: style),
        Text(value, style: style),
      ],
    );
  }
}
