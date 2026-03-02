```
// templates/component_widget_test.tmpl
//
// Copy into test/widget/design_system/<component>_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('renders primary variant', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: OneActionButton(label: 'Save', onPressed: null),
        ),
      ),
    );
    expect(find.text('Save'), findsOneWidget);
  });
}
```
