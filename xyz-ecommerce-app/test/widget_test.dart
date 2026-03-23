import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:xyz_ecommerce_app/app.dart';

void main() {
  testWidgets('onboarding and login reach the buyer shell', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const XyzEcommerceApp());
    await tester.pumpAndSettle();

    expect(find.text('Enter XYZ Ecommerce'), findsOneWidget);

    final onboardingCta = find.byKey(const Key('onboarding-continue'));
    await tester.ensureVisible(onboardingCta);
    await tester.tap(onboardingCta);
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);

    final loginCta = find.byKey(const Key('login-submit'));
    await tester.ensureVisible(loginCta);
    await tester.tap(loginCta);
    await tester.pumpAndSettle();

    expect(find.text('Editorial shopping, minus the noise'), findsOneWidget);
    expect(find.text('Featured now'), findsOneWidget);
  });
}
