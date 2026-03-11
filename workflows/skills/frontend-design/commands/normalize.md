# /normalize

Align with design system standards: tokens, spacing, typography consistency.

## What It Does

Reviews code for inconsistencies with the project's design system. Replaces hardcoded values with tokens, normalizes spacing to the grid, and enforces typographic consistency.

## Checks

- Replace hardcoded colors with design tokens / CSS custom properties
- Replace hardcoded spacing with spacing scale values
- Normalize font sizes to the type scale
- Ensure consistent border-radius, shadow, and transition values
- Verify component naming follows project conventions

## Usage

- `/normalize` — normalize the entire file
- `/normalize colors` — fix only color inconsistencies
- `/normalize spacing` — fix only spacing values
