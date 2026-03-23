import 'package:flutter/material.dart';

import '../models/commerce_models.dart';

class CheckoutResult {
  const CheckoutResult({
    required this.shippingName,
    required this.shippingAddress,
    required this.shippingCity,
    required this.paymentLabel,
  });

  final String shippingName;
  final String shippingAddress;
  final String shippingCity;
  final String paymentLabel;
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    required this.subtotal,
    required this.shippingCost,
    required this.total,
  });

  final double subtotal;
  final double shippingCost;
  final double total;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Root Buyer');
  final _addressController = TextEditingController(text: '88 Editorial Row');
  final _cityController = TextEditingController(text: 'Phnom Penh');
  final _paymentController = TextEditingController(text: '4242');

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _paymentController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      CheckoutResult(
        shippingName: _nameController.text.trim(),
        shippingAddress: _addressController.text.trim(),
        shippingCity: _cityController.text.trim(),
        paymentLabel: 'Card ending in ${_paymentController.text.trim()}',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      key: const ValueKey('checkout-screen'),
      appBar: AppBar(title: const Text('Checkout')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              Text('Shipping details', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 14),
              TextFormField(
                key: const ValueKey('checkout-name'),
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter a name'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                key: const ValueKey('checkout-address'),
                controller: _addressController,
                decoration: const InputDecoration(labelText: 'Address'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter an address'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                key: const ValueKey('checkout-city'),
                controller: _cityController,
                decoration: const InputDecoration(labelText: 'City'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter a city'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                key: const ValueKey('checkout-payment'),
                controller: _paymentController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Payment suffix',
                  hintText: '4242',
                ),
                validator: (value) => (value == null || value.trim().length < 4)
                    ? 'Enter the final 4 digits'
                    : null,
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order summary', style: theme.textTheme.titleLarge),
                    const SizedBox(height: 16),
                    _PriceRow(
                      label: 'Subtotal',
                      value: formatUsd(widget.subtotal),
                    ),
                    const SizedBox(height: 10),
                    _PriceRow(
                      label: 'Shipping',
                      value: widget.shippingCost == 0
                          ? 'Free'
                          : formatUsd(widget.shippingCost),
                    ),
                    const Divider(height: 28),
                    _PriceRow(
                      label: 'Total',
                      value: formatUsd(widget.total),
                      emphasize: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                key: const ValueKey('checkout-place-order'),
                onPressed: _submit,
                child: const Text('Place order'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({
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
