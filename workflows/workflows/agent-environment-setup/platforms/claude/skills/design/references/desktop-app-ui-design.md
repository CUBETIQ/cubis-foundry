# Desktop App UI Design

## Table of contents
1. Core stance
2. Structural patterns
3. Inputs and productivity
4. Data-heavy behavior
5. Window and session behavior
6. Desktop checklist

## Core stance

Desktop UI should reward expertise. Users often have larger displays, more time in the product, stronger intent, and better input precision. Give them visibility, speed, and control. Desktop is not a blown-up mobile app.

## Structural patterns

Common desktop structures:

- Sidebar + main content + inspector
- Table or tree + detail pane
- Workspace tabs with persistent utilities
- Command palette plus keyboard-driven navigation
- Dockable or collapsible side panels

Rules:

- Keep context visible during multi-step work.
- Use panes and split views to reduce needless navigation.
- Expose advanced controls progressively, but do not bury frequent expert tasks.
- Let users compare items, not only inspect one thing at a time.

## Inputs and productivity

Desktop should support:

- keyboard shortcuts
- multi-select and batch actions
- drag and drop when it improves speed
- context menus for precise secondary actions
- inline edit for fast correction
- copy and paste workflows

Do not force every action through modals.

## Data-heavy behavior

- Tables, trees, logs, timelines, and inspectors are natural on desktop.
- Keep headers, filters, or summary metrics persistent when they improve throughput.
- Use clear column priorities and resizable regions.
- Design dense views with strong alignment and rhythm, not clutter.
- Make empty and loading states informative, especially for long-running work.

## Window and session behavior

- Consider multiple windows only when the product truly benefits.
- Remember panel state, column widths, saved views, and workspace preferences.
- Reflect background activity clearly.
- Use notifications and toasts sparingly in long-running environments.

## Desktop checklist

- Does the design help expert users move faster?
- Are shortcuts and batch actions considered?
- Is there enough persistent context to support comparison and editing?
- Are dense views aligned and legible?
- Are destructive actions explicit but not overly disruptive?
- Is desktop using panes, tables, and inspectors where appropriate instead of stacked-card mobile patterns?
