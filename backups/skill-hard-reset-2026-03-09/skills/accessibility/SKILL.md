---
name: "accessibility"
displayName: "Accessibility Expert"
description: "Ensure Flutter apps meet WCAG 2.1 AA standards with proper semantics, focus management, and screen reader support"
keywords:
  [
    "accessibility",
    "a11y",
    "wcag",
    "semantics",
    "screen reader",
    "focus",
    "contrast",
    "flutter accessibility",
  ]
---

# Accessibility Expert

## Overview

This power helps you build accessible Flutter widgets that work well with screen readers (TalkBack/VoiceOver), keyboard navigation, and meet WCAG 2.1 AA standards.

## When to Use

- Building new UI screens or widgets
- Reviewing code for accessibility compliance
- Fixing accessibility issues reported by users
- Adding semantic labels to icons and buttons
- Implementing proper focus management in forms

## Quick Reference

### Semantic Labels for Icon Buttons

```dart
// ❌ Bad - no semantic label
IconButton(
  icon: Icon(Icons.delete),
  onPressed: () => deleteItem(),
)

// ✅ Good - has semantic label
Semantics(
  label: 'Delete item',
  button: true,
  child: IconButton(
    icon: Icon(Icons.delete),
    onPressed: () => deleteItem(),
  ),
)
```

### Form Focus Management

```dart
// Create focus nodes
final _emailFocus = FocusNode();
final _passwordFocus = FocusNode();

// Link them in text fields
TextField(
  focusNode: _emailFocus,
  textInputAction: TextInputAction.next,
  onSubmitted: (_) => _passwordFocus.requestFocus(),
)

TextField(
  focusNode: _passwordFocus,
  textInputAction: TextInputAction.done,
  onSubmitted: (_) => _submitForm(),
)
```

### Minimum Touch Target Size

```dart
// Ensure 48x48 minimum for interactive elements
SizedBox(
  width: 48,
  height: 48,
  child: IconButton(...),
)
```

## Key Principles

1. **Semantic Labels**: All icon buttons, images, and non-text elements need labels
2. **Focus Order**: Tab order should follow visual/logical flow
3. **Touch Targets**: Minimum 48x48 dp for all interactive elements
4. **Color Contrast**: Text must have 4.5:1 contrast ratio (3:1 for large text)
5. **Screen Reader**: Test with TalkBack (Android) and VoiceOver (iOS)

## References

Load detailed guidance only when needed.

| File | Load when |
| --- | --- |
| `references/a11y_checklist.md` | Running an accessibility review or validating a widget/screen against the full checklist |

## Templates

- `focus_form` - Form with proper focus management
- `semantics_icon_button` - Icon button with semantic labels
