---
name: "ux-ui-consistency"
displayName: "UX/UI Consistency"
description: "Ensure consistent UX patterns: design system component usage, screen states, error handling, and loading patterns"
keywords:
  [
    "ux",
    "ui consistency",
    "design system",
    "components",
    "screen states",
    "error handling",
    "loading states",
  ]
---

# UX/UI Consistency

## Overview

This power ensures consistent user experience across all screens by enforcing design system component usage, proper screen state handling, and standardized error/loading patterns.

## When to Use

- Building new screens or features
- Reviewing UI code for consistency
- Implementing loading/error/empty states
- Refactoring legacy UI to use design system components
- Fixing UX inconsistencies reported by users

## Quick Reference

### Screen States Pattern

```dart
// ✅ Always handle all states
ref.watch(dataProvider).when(
  data: (data) {
    if (data.isEmpty) {
      return EmptyStateWidget(
        message: 'No items found',
        action: TextButton(
          child: Text('Refresh'),
          onPressed: () => ref.refresh(dataProvider),
        ),
      );
    }
    return ContentView(data);
  },
  loading: () => LoadingWidget(),
  error: (error, stack) => ErrorWidget(
    error: error,
    onRetry: () => ref.refresh(dataProvider),
  ),
);
```

### Design System Component Rules

```dart
// ❌ Don't use raw Flutter widgets for common patterns
Text('Hello')
ElevatedButton(...)
Container(...)

// ✅ Use your project's design system components
// Example: OneText.bodyMedium('Hello')
// Example: OneButton.primary(...)
// Example: OneContainer(...)
```

### Consistent Error Handling

```dart
// ✅ Show user-friendly errors
try {
  await submitForm();
} catch (e) {
  if (e is NetworkException) {
    // Show network error via your design system's snackbar
    showErrorSnackbar(context, 'No internet connection');
  } else if (e is ValidationException) {
    showWarningSnackbar(context, e.message);
  } else {
    showErrorSnackbar(context, 'Something went wrong');
  }
}
```

## UX Checklist

### Screen States
- [ ] Loading state (spinner or skeleton)
- [ ] Error state (error view with retry)
- [ ] Empty state (empty view with action)
- [ ] Success state (actual content)

### Interactive Feedback
- [ ] Button shows loading during async operations
- [ ] Form validation shows inline errors
- [ ] Success feedback after mutations (snackbar/dialog)
- [ ] Confirmation dialogs for destructive actions

### Navigation
- [ ] Back button behavior is consistent
- [ ] Deep links work correctly
- [ ] Navigation guards prevent unauthorized access
- [ ] Loading states during navigation

### Accessibility
- [ ] Touch targets are 48x48 minimum
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader labels present
- [ ] Focus order is logical

## References

Load detailed guidance only when needed.

| File | Load when |
| --- | --- |
| `steering/one_component_rules.md` | Enforcing design-system component usage and avoiding raw widget drift |
| `steering/ux_checklist.md` | Running a full UX consistency review across a screen or feature |

## Templates

- `screen_states_widget` - Complete screen state handling template
