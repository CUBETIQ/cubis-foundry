# /teach-impeccable

Explain design rationale: why a decision was made, what principle it follows.

## What It Does

Teaches the user about design principles by explaining the reasoning behind specific design decisions in the current codebase. Connects implementation choices to underlying principles from typography, color theory, spatial design, motion, accessibility, and UX psychology.

## Teaching Format

For each design decision explained:

1. **What** — the specific design choice in the code
2. **Why** — the principle or research behind it
3. **Reference** — link to the relevant reference file
4. **Alternative** — what would happen if a different choice were made

## Example Response

> **What**: The body font size is set to `clamp(1rem, 0.95rem + 0.25vi, 1.125rem)`
>
> **Why**: Fluid typography scales smoothly between screen sizes without breakpoints. The minimum of 16px ensures readability on mobile, while 18px on desktop improves reading comfort for longer content. This follows the fluid type scale principle from `references/typography.md`.
>
> **Alternative**: Using fixed `font-size: 16px` would require manual breakpoint adjustments and creates a jarring size jump at each threshold.

## Topics You Can Ask About

- Why a specific color was chosen
- Why spacing values follow a particular scale
- Why an animation uses a specific duration or easing
- Why a layout uses CSS Grid vs Flexbox
- Why a component is structured a certain way
- Why an accessibility pattern was implemented
- Any design decision in the current codebase

## Usage

- `/teach-impeccable` — explain key design decisions in the current file
- `/teach-impeccable color` — explain color choices
- `/teach-impeccable typography` — explain type scale decisions
- `/teach-impeccable spacing` — explain spatial design choices
