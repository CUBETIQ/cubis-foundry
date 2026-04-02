# Responsive and Adaptive Systems

## Definitions

- Responsive: the same surface family reflows and resizes across width changes.
- Adaptive: the product intentionally changes composition or interaction model between surface families or major size classes.
- Native-feeling: the interface respects the dominant conventions of the target surface even when brand and logic remain shared.

## What should stay shared

Keep these aligned when possible:

- product language and labels
- information architecture nouns
- semantic color roles
- type scale logic
- spacing scale logic
- icon language
- component intent
- state naming

## What should adapt

Change these freely when the surface demands it:

- primary navigation pattern
- number of panes
- table vs card vs list presentation
- density and information exposure
- touch vs pointer affordances
- hover behavior
- keyboard shortcuts
- panel persistence
- modal, drawer, or side-sheet choice

## Decision rules

- Preserve when the same component intent and information order still works.
- Adapt when the task is the same but the surface benefits from different navigation, density, or framing.
- Diverge when the surface unlocks a fundamentally better model, such as split-pane desktop workspaces, tablet inspectors, or phone-first capture flows.
