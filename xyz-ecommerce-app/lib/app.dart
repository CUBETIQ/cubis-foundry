import 'package:flutter/material.dart';

import 'repositories/shop_repository.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'state/shop_controller.dart';
import 'theme/app_theme.dart';

class XyzEcommerceApp extends StatelessWidget {
  const XyzEcommerceApp({super.key, this.repository});

  final ShopRepository? repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'XYZ Ecommerce',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: ShopBootstrap(repository: repository),
    );
  }
}

class ShopBootstrap extends StatefulWidget {
  const ShopBootstrap({super.key, this.repository});

  final ShopRepository? repository;

  @override
  State<ShopBootstrap> createState() => _ShopBootstrapState();
}

class _ShopBootstrapState extends State<ShopBootstrap> {
  ShopController? _controller;
  Object? _loadError;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final repository = widget.repository ?? await ShopRepository.bootstrap();
      final controller = ShopController(repository);
      await controller.load();
      if (!mounted) {
        controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = error;
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    if (_loadError != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Failed to load XYZ Ecommerce: $_loadError'),
          ),
        ),
      );
    }
    if (controller == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        if (!controller.hasCompletedOnboarding) {
          return OnboardingScreen(onContinue: controller.completeOnboarding);
        }
        if (!controller.isAuthenticated) {
          return LoginScreen(controller: controller);
        }
        return ShopHomeShell(controller: controller);
      },
    );
  }
}
