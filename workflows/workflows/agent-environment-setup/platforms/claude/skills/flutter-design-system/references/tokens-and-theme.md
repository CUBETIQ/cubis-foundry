# Tokens and Theme

## Shared Theme Contract

Keep app-wide visual tokens under `shared/theme/`:

- `app_colors.dart`
- `app_spacing.dart`
- `app_radius.dart`
- `app_typography.dart`
- `app_theme.dart`

## Token Rules

- Add a token only when it represents a reusable design concept.
- Do not add screen-specific names such as `salesCardBlue`.
- Prefer semantic names (`success`, `warning`, `surfaceMuted`) over raw hue names when the token has product meaning.
- Keep spacing on a small fixed scale unless the design system already supports a larger one.

## ThemeData Checklist

- `useMaterial3: true`
- `colorScheme` derived from the shared token palette
- text theme mapped from `AppTypography`
- input, card, dialog, app bar, and button themes aligned to the same token set
- dark theme derived intentionally instead of default inversion

## Audit Checklist

- No `Color(...)` literals in feature widgets unless bridging external APIs
- No raw `EdgeInsets` numbers when a spacing token exists
- No raw `BorderRadius.circular(...)` when a radius token exists
- No raw `TextStyle(...)` when a typography token exists
- Loading, error, empty, and sync-status visuals use shared widgets
