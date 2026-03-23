import 'package:flutter_test/flutter_test.dart';

import 'package:habit_tracker_app/app.dart';

void main() {
  testWidgets('onboarding transitions into the dashboard shell', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const HabitTrackerApp());

    expect(find.text('Start Journey'), findsOneWidget);
    expect(find.text('Home Dashboard'), findsNothing);

    await tester.ensureVisible(find.text('Start Journey'));
    await tester.tap(find.text('Start Journey'));
    await tester.pumpAndSettle();

    expect(find.text('Home Dashboard'), findsOneWidget);
    expect(find.text('Today\'s Habits'), findsOneWidget);
  });
}
