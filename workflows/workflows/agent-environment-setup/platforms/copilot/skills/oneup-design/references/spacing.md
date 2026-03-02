# OneSpacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| xs4 | 1 | `SizedBox(height: OneSpacing.xs4)` |
| xs3 | 2 | `SizedBox(height: OneSpacing.xs3)` |
| xs2 | 4 | `SizedBox(height: OneSpacing.xs2)` |
| n5 | 5 | `SizedBox(height: OneSpacing.n5)` |
| xs | 6 | `SizedBox(height: OneSpacing.xs)` |
| sm | 8 | `SizedBox(height: OneSpacing.sm)` |
| n10 | 10 | `SizedBox(height: OneSpacing.n10)` |
| md | 12 | `SizedBox(height: OneSpacing.md)` |
| lg | 16 | `SizedBox(height: OneSpacing.lg)` |
| xl | 20 | `SizedBox(height: OneSpacing.xl)` |
| xl2 | 24 | `SizedBox(height: OneSpacing.xl2)` |
| n28 | 28 | `SizedBox(height: OneSpacing.n28)` |
| xl3 | 32 | `SizedBox(height: OneSpacing.xl3)` |
| xl4 | 40 | `SizedBox(height: OneSpacing.xl4)` |
| xl5 | 48 | `SizedBox(height: OneSpacing.xl5)` |
| xl6 | 64 | `SizedBox(height: OneSpacing.xl6)` |

# OnePadding Presets

| Preset | Value | Use Case |
|--------|-------|----------|
| screenHorizontal | h: 20 | Screen body padding |
| screenVertical | v: 20 | Screen vertical |
| screenAll | all: 20 | Full screen padding |
| cardAll | all: 16 | Card internal padding |
| cardHorizontal | h: 16 | Card horizontal |
| cardVertical | v: 12 | Card vertical |
| listItem | h: 16, v: 12 | List item padding |
| button | h: 24, v: 12 | Button internal |
| formField | bottom: 16 | Form field gap |
| section | bottom: 24 | Section gap |
| xs | all: 4 | Extra small |
| sm | all: 8 | Small |
| md | all: 12 | Medium |
| lg | all: 16 | Large |
| xl | all: 20 | Extra large |
| xl2 | all: 24 | 2X large |
| horizontalXs-Xl | h: 4-20 | Horizontal only |
| verticalXs-Xl | v: 4-20 | Vertical only |

## Custom Padding
```dart
OnePadding.custom(left: OneSpacing.sm, bottom: OneSpacing.lg)
OnePadding.symmetric(horizontal: OneSpacing.lg, vertical: OneSpacing.md)
OnePadding.only(top: OneSpacing.xl)
```

# OneRadius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| xs4 | 1 | `BorderRadius.circular(OneRadius.xs4)` |
| xs | 4 | `BorderRadius.circular(OneRadius.xs)` |
| sm | 6 | `BorderRadius.circular(OneRadius.sm)` |
| md | 8 | `BorderRadius.circular(OneRadius.md)` |
| lg | 12 | `BorderRadius.circular(OneRadius.lg)` |
| xl | 16 | `BorderRadius.circular(OneRadius.xl)` |
| xl2 | 20 | `BorderRadius.circular(OneRadius.xl2)` |
| xl3 | 24 | `BorderRadius.circular(OneRadius.xl3)` |
| full | 9999 | Pill shape |

## Pre-built BorderRadius
```dart
OneRadius.radiusXs   // BorderRadius.circular(4)
OneRadius.radiusSm   // BorderRadius.circular(6)
OneRadius.radiusMd   // BorderRadius.circular(8)
OneRadius.radiusLg   // BorderRadius.circular(12)
OneRadius.radiusXl   // BorderRadius.circular(16)
OneRadius.radiusFull // BorderRadius.circular(9999)
```

# Forbidden Patterns

```dart
// ❌ NEVER USE RAW VALUES
SizedBox(height: 16)                    // Use OneSpacing.lg
EdgeInsets.all(12)                      // Use OnePadding.md
EdgeInsets.symmetric(horizontal: 20)    // Use OnePadding.screenHorizontal
BorderRadius.circular(8)                // Use OneRadius.md
```
