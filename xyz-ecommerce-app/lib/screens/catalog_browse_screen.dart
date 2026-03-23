import 'package:flutter/material.dart';

import '../data/seed_catalog.dart';
import '../models/commerce_models.dart';
import '../widgets/product_card.dart';

class CatalogBrowseScreen extends StatefulWidget {
  const CatalogBrowseScreen({
    super.key,
    required this.products,
    required this.wishlistIds,
    required this.onProductTap,
    required this.onToggleWishlist,
    this.initialCategory = 'All',
  });

  final List<Product> products;
  final Set<String> wishlistIds;
  final ValueChanged<Product> onProductTap;
  final ValueChanged<String> onToggleWishlist;
  final String initialCategory;

  @override
  State<CatalogBrowseScreen> createState() => _CatalogBrowseScreenState();
}

class _CatalogBrowseScreenState extends State<CatalogBrowseScreen> {
  late final TextEditingController _searchController;
  late String _selectedCategory;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _selectedCategory = widget.initialCategory;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final query = _searchController.text.trim().toLowerCase();
    final filtered = widget.products.where((product) {
      final categoryMatch =
          _selectedCategory == 'All' || product.category == _selectedCategory;
      final queryMatch =
          query.isEmpty ||
          product.name.toLowerCase().contains(query) ||
          product.brand.toLowerCase().contains(query) ||
          product.category.toLowerCase().contains(query);
      return categoryMatch && queryMatch;
    }).toList();

    return Scaffold(
      key: const ValueKey('catalog-screen'),
      appBar: AppBar(title: const Text('Browse Collection')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
              child: TextField(
                key: const ValueKey('catalog-search-field'),
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search_rounded),
                  hintText: 'Search jackets, bags, dresses...',
                ),
              ),
            ),
            SizedBox(
              height: 48,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemBuilder: (context, index) {
                  final category = storefrontCategories[index];
                  return ChoiceChip(
                    key: ValueKey(
                      'catalog-category-${category.toLowerCase().replaceAll(' ', '-')}',
                    ),
                    label: Text(category),
                    selected: _selectedCategory == category,
                    onSelected: (_) =>
                        setState(() => _selectedCategory = category),
                  );
                },
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemCount: storefrontCategories.length,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Text(
                        'No products match that filter yet.',
                        style: theme.textTheme.bodyLarge,
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 14,
                            mainAxisSpacing: 14,
                            childAspectRatio: 0.58,
                          ),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final product = filtered[index];
                        return ProductCard(
                          surfaceKey: ValueKey('catalog-product-${product.id}'),
                          product: product,
                          isWishlisted: widget.wishlistIds.contains(product.id),
                          onTap: () => widget.onProductTap(product),
                          onToggleWishlist: () =>
                              widget.onToggleWishlist(product.id),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
