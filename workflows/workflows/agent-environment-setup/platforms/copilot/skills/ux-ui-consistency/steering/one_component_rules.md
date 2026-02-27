# One* component rules

## Allowed in feature UI
- OneText, OneButton, OneCard, OneInput, OneDialog, OneSnackbar
- OneEmptyState, OneErrorState, OneProgress, OneRefresh
- Token usage: OneSpacing, OneRadius, OneTypography, OneColor, OneShadow

## Not allowed in feature UI (unless inside One*)
- Raw Container/Text/ElevatedButton/Card with custom styles
- Magic numbers for spacing/radius/typography

## Standard patterns
- Screen scaffold: OneLayout(title, actions, body)
- List rows: OneListTile(leading, title, subtitle, trailing)
- Section cards: OneCard + token padding
