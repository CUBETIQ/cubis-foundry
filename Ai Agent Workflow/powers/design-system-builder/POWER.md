````markdown
---
inclusion: manual
name: "design-system-builder"
displayName: "Design System Builder"
description: "Create and review design system components: API design, token usage, theming, variants, and documentation"
keywords:
  [
    "design system",
    "components",
    "component design",
    "tokens",
    "theming",
    "variants",
    "widget api",
  ]
---

# Design System Builder

## Overview

This power helps you create new design system components or update existing ones, ensuring consistent API design, proper token usage, theming support, and comprehensive documentation.

## When to Use

- Creating new One\* components
- Updating existing One\* components
- Reviewing component API design
- Adding new variants to components
- Ensuring token compliance in components

## Component Design Principles

### 1. Token-Based Styling

```dart
// ❌ Don't hardcode values
Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Color(0xFF123456),
    borderRadius: BorderRadius.circular(8),
  ),
)

// ✅ Use design tokens
Container(
  padding: EdgeInsets.all(AppSpacing.lg), // Use your spacing tokens
  decoration: BoxDecoration(
    color: Theme.of(context).colorScheme.surface, // Use theme colors
    borderRadius: BorderRadius.circular(AppRadius.md), // Use radius tokens
  ),
)
```

### 2. Semantic API

```dart
// ✅ Semantic, clear API
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isDisabled;
  final Widget? leading;
  final Widget? trailing;

  // Named constructors for variants
  AppButton.primary({...});
  AppButton.secondary({...});
  AppButton.ghost({...});
}
```

### 3. Composition Over Configuration

```dart
// ✅ Compose smaller components
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? backgroundColor;

  AppCard.elevated({...}) : this(
    padding: EdgeInsets.all(AppSpacing.lg),
    backgroundColor: Theme.of(context).colorScheme.surface,
    elevation: 2,
  );
}
```

## Component Checklist

### API Design

- [ ] Semantic property names (label, errorText, leading, trailing)
- [ ] Sensible defaults (minimal required params)
- [ ] Named constructors for variants
- [ ] Consistent with other design system components

### Token Usage

- [ ] No hardcoded colors (use theme colors or color tokens)
- [ ] No hardcoded spacing (use spacing tokens)
- [ ] No hardcoded typography (use text styles)
- [ ] No hardcoded radius (use radius tokens)

### Theming

- [ ] Respects light/dark theme
- [ ] Uses theme-aware colors (context.colors)
- [ ] Adapts to platform (iOS/Android)

### Variants

- [ ] Variants defined as enums or named constructors
- [ ] Each variant has clear use case
- [ ] Variants share common base implementation

### Documentation

- [ ] Doc comment explaining purpose
- [ ] At least 2 usage examples
- [ ] Migration notes from raw Flutter widgets

### Testing

- [ ] Widget test for each variant
- [ ] Test disabled/loading states
- [ ] Test accessibility (semantic labels)
- [ ] Consider golden tests for visual regression

## Output Format

When creating/reviewing a component:

1. **Component Spec** (purpose, variants, API)
2. **Token Usage** (which tokens are used)
3. **Implementation Notes** (composition, theming)
4. **Examples** (2+ usage snippets)
5. **Tests** (widget tests + golden ideas)
6. **Migration Notes** (how to replace old widgets)

## Steering Files

- `component_api_guidelines.md` - API design best practices

## Templates

- `one_component_skeleton` - Component template
- `component_widget_test` - Widget test template
````
