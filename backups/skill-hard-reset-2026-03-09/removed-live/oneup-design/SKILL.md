---
name: "oneup-design"
displayName: "OneUp Design System"
description: "OneUp HR design system with One* components, colors, spacing, and typography tokens"
keywords: ["design", "ui", "component", "color", "spacing", "padding", "typography", "OneText", "OneButton", "OneCard", "widget", "theme"]
---

# OneUp Design System

## Onboarding

Import the design system:
```dart
import '../../../../core/design_system/one_design_system.dart';
```

## When to Load Steering Files

| File | Load when |
| --- | --- |
| `references/colors.md` | Choosing semantic colors, surface roles, and token-safe palette usage. |
| `references/spacing.md` | Replacing hard-coded spacing/padding and aligning with token spacing rules. |
| `references/components.md` | Selecting or reviewing One* components and their expected usage patterns. |

## MCP Tools (Use Before Writing UI)

1. `listComponents` → Find One* component
2. `getComponentSpec` → Get props/examples
3. `getDesignTokens` → Get tokens
4. `validateWidget` → Validate compliance

## Quick Reference

### Colors

```dart
// Theme-aware
context.colors.primary
context.colors.surface
context.colors.onSurface

// Static
OneColor.success   // #2DC656
OneColor.error     // #FF3C35
OneColor.white
```

### Spacing

```dart
OneSpacing.sm   // 8
OneSpacing.md   // 12
OneSpacing.lg   // 16
OneSpacing.xl   // 20
```

### Padding

```dart
OnePadding.screenHorizontal  // h: 20
OnePadding.cardAll           // all: 16
OnePadding.custom(left: OneSpacing.sm)
```

### Forbidden Patterns

```dart
// ❌ Never use
SizedBox(height: 16)         // Use OneSpacing.lg
Color(0xFF...)               // Use context.colors.X
Colors.white                 // Use OneColor.white
Text(...)                    // Use OneText.X()
ElevatedButton(...)          // Use OneButton.primary()
```
