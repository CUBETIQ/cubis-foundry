import 'package:flutter/material.dart';

import '../models/commerce_models.dart';

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key, required this.order});

  final OrderRecord order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      key: const ValueKey('order-success-screen'),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.check_rounded,
                    size: 42,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 24),
                Text('Order confirmed', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 12),
                Text(
                  'Your order ${order.id} is packed into the local test history and ready for QA validation.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: 24),
                Text(
                  '${order.items.length} items • ${formatUsd(order.total)}',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  key: const ValueKey('order-success-continue'),
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Continue shopping'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
