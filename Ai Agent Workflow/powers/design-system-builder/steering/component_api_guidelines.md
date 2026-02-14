# One* component API guidelines

## Keep APIs predictable
- Named parameters
- Defaults match the most common use case
- Avoid optional booleans that conflict (use enums)

## Prefer slots over flags
Bad:
- `hasLeadingIcon`, `hasTrailingIcon`
Good:
- `leading`, `trailing`

## Theming
- Use OneTheme / tokens only
- Provide override hooks carefully (don’t allow raw colors everywhere)

## Accessibility
- Provide semantic labels for icon-only variants
- Ensure focus and keyboard nav works on desktop
