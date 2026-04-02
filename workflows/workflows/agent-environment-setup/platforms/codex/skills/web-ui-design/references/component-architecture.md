# Component Architecture

## Component Taxonomy

Classify every component into one of three layers to enforce separation of concerns:

### Primitives (Atoms)

The smallest reusable UI elements. They have no business logic, no data fetching, and no awareness of the application domain.

- Examples: Button, Input, Text, Icon, Badge, Avatar, Tooltip
- Props: visual variants, sizes, event handlers
- Rules:
  - Never import from composite or layout layers
  - Never fetch data or hold application state
  - Always accept `className` or `style` for consumer overrides
  - Always forward refs to the underlying DOM element

### Composites (Molecules)

Combinations of primitives that form a meaningful UI unit. They may hold local UI state but never fetch data directly.

- Examples: SearchBar (Input + Button + Dropdown), Card (Image + Text + Badge), FormField (Label + Input + ErrorMessage)
- Props: domain-typed data, composed callbacks
- Rules:
  - Composed of primitives only, never other composites
  - May hold local UI state (open/closed, focused, hovered)
  - Never fetch data; receive it via props
  - Expose a clear prop contract that documents every configuration option

### Layouts (Organisms / Templates)

Full-page or full-section components that arrange composites and primitives into a layout. They may connect to data sources.

- Examples: PageShell, Sidebar, DashboardGrid, FormSection
- Props: data from hooks or context, routing information
- Rules:
  - May fetch data or subscribe to global state
  - Arrange composites and primitives; do not contain raw HTML styling logic
  - Own the grid, spacing, and responsive behavior for their section

## Composition Patterns

### Compound Components

Use compound components for multi-part widgets where consumers need compositional flexibility:

```tsx
// Consumer usage
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
  <Tabs.Content value="settings">...</Tabs.Content>
</Tabs>
```

Implementation: use React Context to share state between sub-components without prop drilling.

Benefits:
- Consumers control the DOM structure
- Sub-components can be styled independently
- New tab panels can be added without modifying the Tabs component

### Render Props and Slots

Use render props or slot patterns when consumers need to control what is rendered inside a component:

```tsx
<DataTable
  data={users}
  columns={columns}
  renderRow={(user) => <CustomRow user={user} />}
  renderEmpty={() => <EmptyState message="No users found" />}
/>
```

### Headless Components

For maximum flexibility, provide headless (behavior-only) components that expose state and handlers without any DOM:

```tsx
const { isOpen, toggle, close } = useDisclosure();
const { selectedItems, select, deselect, isSelected } = useSelection(items);
```

## State Management Boundaries

| State type | Where it lives | Examples |
|-----------|---------------|----------|
| Server state | React Query, SWR, Apollo | API responses, cached data |
| Global UI state | Context or Zustand | Theme, locale, sidebar open/closed |
| Local UI state | useState/useReducer | Form values, dropdown open, hover |
| URL state | Router params/search params | Active tab, filter selections, pagination |
| Derived state | Computed in render | Filtered lists, formatted dates, totals |

Rules:
- Never duplicate server state in global stores. Use a cache layer (React Query) as the single source.
- Never store derived state. Compute it from source state on every render.
- Lift state only as high as needed. If two siblings share state, lift to their parent — not to a global store.

## File Organization

```
components/
  primitives/
    Button/
      Button.tsx
      Button.module.css
      Button.test.tsx
      index.ts
    Input/
    Text/
  composites/
    SearchBar/
    FormField/
    Card/
  layouts/
    PageShell/
    Sidebar/
    DashboardGrid/
hooks/
  useDisclosure.ts
  useSelection.ts
  useMediaQuery.ts
```

Each component directory contains the component, its styles, its tests, and a barrel export. No cross-layer imports upward (primitives never import composites).

## Testing Strategy

| Layer | Test type | What to verify |
|-------|-----------|----------------|
| Primitives | Unit tests | Renders correctly, handles props, fires events, meets a11y |
| Composites | Integration tests | Primitive composition works, local state behaves correctly |
| Layouts | Integration + visual regression | Data flows correctly, responsive layout renders, visual appearance stable |
| Hooks | Unit tests | Return values, state transitions, edge cases |

Use `@testing-library/react` for all component tests. Avoid testing implementation details (internal state, private methods). Test the public API: props in, rendered output, and fired events.
