import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key, required this.onContinue});

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      key: const ValueKey('onboarding-screen'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 86,
                height: 86,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: const LinearGradient(
                    colors: [AppTheme.berry, AppTheme.gold, AppTheme.blush],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: const Icon(
                  Icons.shopping_bag_rounded,
                  color: Colors.white,
                  size: 38,
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Curate a wardrobe\nwith editorial clarity',
                style: theme.textTheme.headlineLarge,
              ),
              const SizedBox(height: 16),
              Text(
                'XYZ Ecommerce blends premium merchandising, calm fashion discovery, and effortless checkout so the shopping flow feels intentional instead of noisy.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: const Column(
                  children: [
                    _OnboardingPoint(
                      icon: Icons.auto_awesome_rounded,
                      title: 'Fashion-editorial discovery',
                      body:
                          'Sharp imagery, elevated typography, and focused merchandising keep the product story front and center.',
                    ),
                    SizedBox(height: 18),
                    _OnboardingPoint(
                      icon: Icons.favorite_rounded,
                      title: 'Save the pieces worth revisiting',
                      body:
                          'Wishlist, recent views, and considered product detail help shoppers compare without losing context.',
                    ),
                    SizedBox(height: 18),
                    _OnboardingPoint(
                      icon: Icons.local_shipping_rounded,
                      title: 'Checkout without friction',
                      body:
                          'Cart, shipping, and order history stay lightweight and persistent for repeatable QA flows.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                key: const ValueKey('onboarding-continue'),
                onPressed: onContinue,
                child: const Text('Enter XYZ Ecommerce'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPoint extends StatelessWidget {
  const _OnboardingPoint({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppTheme.berry.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: AppTheme.berry, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(body, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}
