# Frontend Design Commands

17 specialized commands for targeted design operations. Each command focuses on a specific concern and can be applied to a whole page or a specific element.

## Usage

Most commands accept an optional argument to focus on a specific area:

- `/audit header` — audit only the header section
- `/polish checkout-form` — polish only the checkout form

On Codex CLI, use prompts syntax: `/prompts:audit`, `/prompts:polish`, etc.

## Command Index

| Command             | Category     | Purpose                                                            |
| ------------------- | ------------ | ------------------------------------------------------------------ |
| `/audit`            | Quality      | Technical quality checks: a11y, performance, responsive            |
| `/critique`         | Quality      | UX design review: hierarchy, clarity, emotional resonance          |
| `/normalize`        | Consistency  | Align with design system tokens and standards                      |
| `/polish`           | Refinement   | Final pass: micro-details, alignment, visual refinement            |
| `/distill`          | Refinement   | Strip to essence: remove complexity without losing character       |
| `/clarify`          | Content      | Improve UX copy: labels, instructions, error messages              |
| `/optimize`         | Performance  | Performance: image sizes, render-blocking, bundle impact           |
| `/harden`           | Robustness   | Error handling, i18n, edge cases, defensive UI                     |
| `/animate`          | Motion       | Add purposeful transitions and micro-interactions                  |
| `/colorize`         | Visual       | Palette refinement, accent placement, contrast fixes               |
| `/bolder`           | Visual       | Amplify timid designs: stronger hierarchy, bigger gestures         |
| `/quieter`          | Visual       | Reduce noise: more whitespace, simplify, calm down                 |
| `/delight`          | Experience   | Add moments of joy: easter eggs, satisfying interactions           |
| `/extract`          | Architecture | Pull into reusable components: identify patterns, create API       |
| `/adapt`            | Responsive   | Adapt for different devices: breakpoints, touch, viewport          |
| `/onboard`          | Experience   | Design onboarding: first-run, empty states, progressive disclosure |
| `/teach-impeccable` | Setup        | One-time: gather project design context, save preferences          |
