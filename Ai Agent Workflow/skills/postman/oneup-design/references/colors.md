# Color Tokens

## Theme-Aware Colors

Use `context.colors.X` - these adapt to light/dark theme:

| Token | Access | Usage |
|-------|--------|-------|
| primary | `context.colors.primary` | Primary actions, buttons, links |
| onPrimary | `context.colors.onPrimary` | Text/icons on primary |
| secondary | `context.colors.secondary` | Secondary actions |
| surface | `context.colors.surface` | Card backgrounds, sheets |
| onSurface | `context.colors.onSurface` | Primary text |
| onSurfaceVariant | `context.colors.onSurfaceVariant` | Secondary text, hints |
| outline | `context.colors.outline` | Borders, dividers |
| error | `context.colors.error` | Error states |

## Static Colors

Use `OneColor.X` - fixed colors for status:

| Token | Hex | Usage |
|-------|-----|-------|
| success | #2DC656 | Success indicators |
| warning | #FFBF00 | Warning indicators |
| error | #FF3C35 | Error badges |
| info | #48AFFA | Info indicators |
| white | #FFFFFF | White overlays |
| black | #000000 | Black overlays |
| disableColor | #70808F | Disabled states |

## Forbidden

```dart
// ❌ NEVER use these
Color(0xFF123456);
Colors.white;
Colors.black;
Theme.of(context).colorScheme.primary;
OneColor.primary;  // Use context.colors.primary instead
```
