import 'package:flutter/material.dart';

import '../state/shop_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.controller});

  final ShopController controller;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController(text: 'root');
  final _passwordController = TextEditingController(text: '123');
  bool _obscure = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    widget.controller.login(_usernameController.text, _passwordController.text);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      key: const ValueKey('login-screen'),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome back', style: theme.textTheme.headlineLarge),
                    const SizedBox(height: 12),
                    Text(
                      'Use the default buyer account to test the full marketplace flow.',
                      style: theme.textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 24),
                    TextFormField(
                      key: const ValueKey('login-username'),
                      controller: _usernameController,
                      decoration: const InputDecoration(
                        labelText: 'Username',
                        hintText: 'root',
                      ),
                      onChanged: (_) => widget.controller.clearAuthError(),
                      validator: (value) =>
                          (value == null || value.trim().isEmpty)
                          ? 'Enter a username'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      key: const ValueKey('login-password'),
                      controller: _passwordController,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: '123',
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                          ),
                        ),
                      ),
                      onChanged: (_) => widget.controller.clearAuthError(),
                      validator: (value) => (value == null || value.isEmpty)
                          ? 'Enter a password'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    AnimatedBuilder(
                      animation: widget.controller,
                      builder: (context, _) {
                        final error = widget.controller.authError;
                        if (error == null) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            error,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.error,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        );
                      },
                    ),
                    FilledButton(
                      key: const ValueKey('login-submit'),
                      onPressed: _submit,
                      child: const Text('Log in to shop'),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Default credentials: root / 123',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
