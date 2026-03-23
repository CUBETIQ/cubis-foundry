import 'package:flutter/material.dart';

import '../models/commerce_models.dart';
import '../theme/app_theme.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({
    super.key,
    required this.product,
    required this.isWishlisted,
    required this.onToggleWishlist,
    required this.onAddToCart,
  });

  final Product product;
  final bool isWishlisted;
  final VoidCallback onToggleWishlist;
  final void Function(String size, String color) onAddToCart;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late String _selectedSize;
  late String _selectedColor;

  @override
  void initState() {
    super.initState();
    _selectedSize = widget.product.sizes.first;
    _selectedColor = widget.product.colors.first;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final product = widget.product;
    return Scaffold(
      key: const ValueKey('product-detail-screen'),
      appBar: AppBar(
        title: Text(product.brand),
        actions: [
          IconButton(
            key: const ValueKey('product-detail-wishlist'),
            onPressed: widget.onToggleWishlist,
            icon: Icon(
              widget.isWishlisted
                  ? Icons.favorite_rounded
                  : Icons.favorite_border_rounded,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          key: const ValueKey('product-detail-scroll'),
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(32),
              child: AspectRatio(
                aspectRatio: 0.9,
                child: Image.network(
                  product.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: AppTheme.blush,
                    alignment: Alignment.center,
                    child: const Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(product.category, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text(
              product.name,
              key: const ValueKey('product-detail-title'),
              style: theme.textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  formatUsd(product.price),
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: AppTheme.berry,
                  ),
                ),
                if (product.originalPrice != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    formatUsd(product.originalPrice!),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${product.rating.toStringAsFixed(1)} • ${product.reviewCount} reviews',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 18),
            Text(product.description, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 22),
            Text('Select size', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: product.sizes.map((size) {
                return ChoiceChip(
                  label: Text(size),
                  selected: _selectedSize == size,
                  onSelected: (_) => setState(() => _selectedSize = size),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            Text('Select color', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: product.colors.map((color) {
                return ChoiceChip(
                  label: Text(color),
                  selected: _selectedColor == color,
                  onSelected: (_) => setState(() => _selectedColor = color),
                );
              }).toList(),
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Materials', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(product.materials, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 16),
                  Text('Fit notes', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(product.fitNotes, style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
            const SizedBox(height: 22),
            FilledButton(
              key: const ValueKey('product-add-to-cart'),
              onPressed: () {
                widget.onAddToCart(_selectedSize, _selectedColor);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      '${product.name} added to bag',
                      style: const TextStyle(color: Colors.white),
                    ),
                    backgroundColor: AppTheme.berry,
                  ),
                );
              },
              child: const Text('Add to bag'),
            ),
          ],
        ),
      ),
    );
  }
}
