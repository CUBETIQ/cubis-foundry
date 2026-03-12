# /polish

Refine visual details: shadows, borders, transitions, micro-interactions.

## What It Does

Elevates the design from "functional" to "finished". Focuses on the details that make interfaces feel premium: consistent shadows, refined borders, smooth transitions, and subtle micro-interactions.

## Refinement Areas

### Shadows & Depth

- Layer shadows for realism (combine ambient + direct)
- Scale shadow intensity with elevation
- Use `box-shadow` with multiple values, not single flat shadows

### Borders & Dividers

- Prefer subtle tinted borders over hard gray lines
- Use border-color that adapts to light/dark mode
- Consider removing borders in favor of spacing or background contrast

### Transitions

- Add `transition` to interactive elements (buttons, links, cards)
- Use appropriate duration (150–250ms for micro, 300–500ms for layout)
- Match easing to the interaction type

### Micro-Interactions

- Hover states that provide feedback without distraction
- Focus indicators that are visible but not overwhelming
- Active/pressed states for tactile feedback

## Usage

- `/polish` — polish the entire component
- `/polish shadows` — refine shadows only
- `/polish transitions` — add or improve transitions
