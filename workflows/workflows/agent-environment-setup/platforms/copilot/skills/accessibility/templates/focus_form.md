```
// templates/focus_form.tmpl
//
// Ensure predictable focus order in a form.

Widget a11yForm({required List<Widget> fields, required Widget actions}) {
  return FocusTraversalGroup(
    policy: OrderedTraversalPolicy(),
    child: Column(
      children: [
        ...fields,
        const SizedBox(height: 16),
        actions,
      ],
    ),
  );
}
```
