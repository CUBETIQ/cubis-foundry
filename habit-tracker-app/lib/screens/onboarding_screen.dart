import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key, required this.onStartJourney});

  final VoidCallback onStartJourney;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: const LinearGradient(
                    colors: [AppTheme.clay, AppTheme.sand, AppTheme.accent],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: const Icon(
                  Icons.spa_rounded,
                  color: Colors.white,
                  size: 42,
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Transform your life,\none habit at a time',
                style: theme.textTheme.headlineLarge,
              ),
              const SizedBox(height: 16),
              Text(
                'Sanctuary blends gentle accountability with a premium, reflective rhythm. Build routines that feel grounded instead of gamified.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Column(
                  children: const [
                    _OnboardingBullet(
                      icon: Icons.auto_graph_rounded,
                      title: 'See momentum, not just streaks',
                      body:
                          'Your dashboard balances progress signals with today’s next step.',
                    ),
                    SizedBox(height: 18),
                    _OnboardingBullet(
                      icon: Icons.favorite_rounded,
                      title: 'Warm, low-noise design',
                      body:
                          'Editorial typography and calm tokens keep the app feeling intentional.',
                    ),
                    SizedBox(height: 18),
                    _OnboardingBullet(
                      icon: Icons.bedtime_rounded,
                      title: 'Respect your actual energy',
                      body:
                          'Quiet hours, soft reminders, and reflection cues prevent burnout loops.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: onStartJourney,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.accent,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(58),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: const Text('Start Journey'),
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'Already have an account? Sign in',
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingBullet extends StatelessWidget {
  const _OnboardingBullet({
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
            color: AppTheme.accent.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: AppTheme.accent, size: 20),
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
