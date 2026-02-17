# Stoplight Elements UI

## Standard Setup (Web Component)

- Include:
  - `https://unpkg.com/@stoplight/elements/styles.min.css`
  - `https://unpkg.com/@stoplight/elements/web-components.min.js`
- Embed:
  - `<elements-api apiDescriptionUrl="/openapi.json" router="hash" layout="sidebar" />`

## Recommended Options

- `router="hash"` for static hosting
- `layout="sidebar"` for readable nav
- `tryItCredentialsPolicy="include"` when auth cookies or credentials are needed

## Verification

- UI loads and shows all tags
- Try-it panel works for secured endpoints
- Schemas and examples render correctly
