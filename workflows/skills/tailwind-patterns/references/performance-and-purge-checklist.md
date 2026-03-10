# Performance And Purge Checklist

Load this when the task involves production build optimization, bundle size, or monorepo content configuration.

## Content configuration

- List every file extension that contains Tailwind classes: `.tsx`, `.jsx`, `.html`, `.vue`, `.svelte`, `.mdx`.
- In monorepos, scope content paths to avoid scanning `node_modules` or unrelated packages.
- Use negative patterns to exclude test fixtures or generated files that bloat the scan.

## Class name detection

- Tailwind scans for complete, unbroken class strings. These patterns break detection:
  - Template literals: `` `bg-${color}-500` `` — use a safelist or explicit mappings instead.
  - String concatenation: `'text-' + size` — always use full class names.
  - Dynamic objects: `{ 'bg-red-500': isError }` — this works because the full string is present.
- When dynamic classes are unavoidable, use the `safelist` option to preserve them.

## @apply discipline

- Long `@apply` chains defeat tree-shaking — if 20 utilities are applied, all 20 remain even if unused elsewhere.
- Keep `@apply` for true primitives used across 3+ locations.
- Prefer component abstraction (React/Vue/Svelte components) over CSS-layer `@apply`.

## Production build checks

- [ ] `NODE_ENV=production` is set during build (enables purge).
- [ ] Final CSS output is under 30KB gzipped for most projects.
- [ ] No unused `@import` of plugins or layers that don't apply.
- [ ] Source maps are excluded from production deployment.
- [ ] Content paths cover all files that use Tailwind classes.
- [ ] No safelist entries left from development debugging.

## Monorepo-specific

- Use workspace-relative content paths: `../../packages/ui/src/**/*.{tsx,jsx}`.
- Share a single Tailwind config at the root with package-specific overrides only when necessary.
- Consider `@import` chaining to share base tokens while allowing package-level extensions.

## Measuring impact

- Compare gzipped CSS size before and after changes.
- Use `npx tailwindcss --content ... --output /dev/null` to test class detection without a full build.
- Check for unused custom properties that add bytes without providing value.
