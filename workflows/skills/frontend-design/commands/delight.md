# /delight

Add moments of surprise: easter eggs, playful copy, unexpected polish.

## What It Does

Adds small moments of joy and personality to the interface. These are intentional touches that make users smile without getting in the way of tasks. Delight is the layer you add after everything works flawlessly.

## Delight Patterns

### Micro-Interactions

- Confetti or sparkle on successful completion of a milestone
- Subtle bounce on button click
- Progress bar with personality (color changes, celebratory state at 100%)
- Checkbox with a satisfying check animation

### Copy & Personality

- Playful empty states ("Nothing here yet — let's change that")
- Varied success messages instead of generic "Done!"
- Personality-appropriate loading messages
- Friendly 404 pages with helpful navigation

### Visual Surprises

- Hover effects that reveal hidden details
- Smooth page transitions that feel intentional
- Seasonal or contextual theme touches (subtle, toggleable)
- Cursor effects on special pages (use very sparingly)

### Feedback & Celebration

- Achievement unlocked patterns for onboarding milestones
- Progress visualization that feels rewarding
- Sound design cues (optional, off by default, never auto-play)

## Rules

1. Never delay the user — delight happens alongside or after the task
2. Never repeat the same delight — vary or suppress after first encounter
3. Respect `prefers-reduced-motion` — skip or simplify animations
4. Keep it subtle — if the user notices it consciously every time, it's too much

## Usage

- `/delight` — add moments of delight to the current component
- `/delight empty-states` — make empty states friendlier
- `/delight completion` — add celebration on task completion
