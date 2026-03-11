# /clarify

Improve information architecture: labels, grouping, wayfinding.

## What It Does

Reviews the UI for clarity issues. Ensures users can quickly understand where they are, what they can do, and what will happen when they act. Focuses on labels, grouping, navigation cues, and information scent.

## Clarity Checks

### Labels & Copy

- Button labels describe the outcome, not the action (`Save Changes` not `Submit`)
- Form labels are unambiguous — no jargon without context
- Placeholder text supplements labels, never replaces them
- Error messages explain what happened AND how to fix it

### Grouping & Structure

- Related items are visually grouped (proximity, borders, backgrounds)
- Sections have clear headings that orient the user
- Lists and grids follow a logical order (alphabetical, chronological, by importance)

### Wayfinding

- Current location is always visible (breadcrumbs, active nav state)
- Navigation labels match destination page headings
- Users can always get back (back button, breadcrumbs, escape hatch)

## Usage

- `/clarify` — review entire page for clarity
- `/clarify labels` — fix button/form label issues
- `/clarify navigation` — improve wayfinding
