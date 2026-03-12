# /extract

Pull reusable patterns into components, tokens, or utilities.

## What It Does

Identifies repeated patterns in the codebase and extracts them into reusable abstractions: design tokens, utility classes, shared components, or composable hooks.

## Extraction Targets

### Design Tokens

- Repeated color values → CSS custom properties
- Repeated spacing values → spacing scale tokens
- Repeated font sizes → type scale tokens
- Repeated shadows, radii, transitions → effect tokens

### Components

- Repeated markup patterns → shared components
- Similar-but-different components → unified component with variants
- Complex inline styles → styled component or utility composition

### Utilities

- Repeated layout patterns → utility classes or layout components
- Repeated responsive patterns → shared breakpoint utilities
- Repeated animation patterns → shared keyframes or transition utilities

## Extraction Process

1. **Scan** — identify repeated patterns across the codebase
2. **Group** — cluster similar patterns and find the canonical version
3. **Name** — choose clear, intention-revealing names
4. **Extract** — create the abstraction with appropriate API
5. **Replace** — update all usage sites to reference the shared abstraction
6. **Verify** — visual regression check that nothing changed

## Usage

- `/extract` — scan and extract all reusable patterns
- `/extract tokens` — extract design tokens only
- `/extract components` — extract repeated markup into components
