# Common Frontend Antipatterns

## Accessibility

### div-as-button
**Problem**: `<div onClick={...}>Click me</div>`
**Fix**: Use `<button>` — gets keyboard events, focus, and ARIA role for free.

### Missing form labels
**Problem**: `<input placeholder="Email" />` with no label
**Fix**: `<label htmlFor="email">Email</label><input id="email" />` — placeholder is not a label.

### Color-only state indication
**Problem**: Error field only turns red, no text or icon
**Fix**: Add error message text + icon alongside the color change.

## Performance

### Inline object/array props
**Problem**: `<Component style={{ color: 'red' }} items={[1,2,3]} />`
**Fix**: Move to module-level constants or useMemo — inline objects create new references every render.

### Missing keys or index-as-key
**Problem**: `list.map((item, i) => <Item key={i} />)`
**Fix**: Use stable unique IDs as keys — index breaks when list is reordered/filtered.

### Unoptimized images
**Problem**: 2MB PNG for a 200px thumbnail
**Fix**: Use WebP/AVIF, responsive `srcset`, and `loading="lazy"` for below-fold images.

### useEffect for derived state
**Problem**: `useEffect(() => setFullName(first + ' ' + last), [first, last])`
**Fix**: `const fullName = first + ' ' + last` — compute during render, no effect needed.

## State Management

### Prop drilling through 4+ levels
**Problem**: Passing props through intermediate components that don't use them
**Fix**: Use context, composition (children), or state management library.

### Storing server state in local state
**Problem**: `const [users, setUsers] = useState([]); useEffect(() => fetch...)`
**Fix**: Use a data-fetching library (SWR, TanStack Query) — handles caching, revalidation, race conditions.

### Missing cleanup in effects
**Problem**: `useEffect(() => { const id = setInterval(...) }, [])` with no return
**Fix**: Return cleanup function: `return () => clearInterval(id)`

## Design System

### Hardcoded magic numbers
**Problem**: `padding: 13px; margin-top: 7px; color: #3b82f6;`
**Fix**: Use design tokens: `padding: var(--spacing-3); color: var(--color-interactive-primary)`

### Boolean prop explosion
**Problem**: `<Button primary large outlined rounded disabled />`
**Fix**: `<Button variant="primary" size="lg" disabled />` — use constrained variant props.

### CSS specificity wars
**Problem**: `.container .card .header .title { ... }` or `!important` everywhere
**Fix**: Use flat selectors, utility classes, or CSS Modules for scoping.

## Component Design

### God component
**Problem**: Single component file > 500 lines handling multiple concerns
**Fix**: Extract subcomponents, custom hooks, and utility functions.

### Premature abstraction
**Problem**: Creating a reusable component from a single use case
**Fix**: Wait for 2+ real use cases before extracting — inline is fine for now.
