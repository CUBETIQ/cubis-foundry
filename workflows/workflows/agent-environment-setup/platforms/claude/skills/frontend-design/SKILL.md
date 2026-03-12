---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use when building pages, dashboards, or applications. Generates polished code that avoids generic AI aesthetics.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Frontend Design

## Purpose

Guide creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Synthesize design thinking, visual direction, and implementation into working code with exceptional attention to aesthetic details, accessibility, and creative choices. Serve both technical and non-technical users with clear communication about design decisions.

## When to Use

- Building web components, pages, artifacts, posters, or applications
- Designing layouts, choosing visual direction, or selecting typography
- Creating dashboards, landing pages, marketing sites, or SaaS interfaces
- Reviewing interface clarity, visual hierarchy, or interaction patterns
- Styling or beautifying existing web UI that looks generic or templated
- Making color system decisions (palettes, dark mode, contrast)
- Adding motion, animation, or micro-interactions to an interface
- Designing component states (hover, active, disabled, loading, error, empty)

## Instructions

### Step 1 — Understand the Context

Before writing code, ask or infer:

1. **Purpose** — What problem does this interface solve? Who uses it?
2. **Brand** — Is there an existing brand system, style guide, or named brand (e.g. "Anthropic", client guidelines, hex palette) to follow? If yes, load `references/brand-presets.md` and use `/brand` to apply it before choosing aesthetic direction.
3. **Tone** — If no brand system exists, pick a bold aesthetic direction: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. There are many flavors. Pick one and commit.
4. **Constraints** — Technical requirements (framework, performance, a11y level, browser support).
5. **Differentiation** — What makes this UNFORGETTABLE? What's the one thing someone will remember?

Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

When communicating with non-technical users: explain design decisions in plain language. Say "this font pairing creates a sense of professionalism" rather than "I used a sans-serif display font with a serif body font." Show the reasoning, not the jargon.

### Step 2 — Commit to a Design Direction

Implement working code that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

### Step 3 — Apply Aesthetics Guidelines

For each domain, follow the DO/DON'T guidance below. Load the corresponding reference file when deeper expertise is needed.

**Typography** → see `references/typography.md`

- DO: Use a modular type scale with fluid sizing (clamp)
- DO: Vary font weights and sizes to create clear visual hierarchy
- DO: Choose fonts that are beautiful, unique, and interesting — pair a distinctive display font with a refined body font
- DON'T: Use overused fonts — Inter, Roboto, Arial, Open Sans, system defaults
- DON'T: Use monospace typography as lazy shorthand for "technical/developer" vibes
- DON'T: Put large icons with rounded corners above every heading

**Color & Theme** → see `references/color-and-contrast.md`

- DO: Use modern CSS color functions (oklch, color-mix, light-dark) for perceptually uniform, maintainable palettes
- DO: Tint neutrals toward the brand hue for subconscious cohesion
- DON'T: Use gray text on colored backgrounds — use a shade of the background color instead
- DON'T: Use pure black (#000) or pure white (#fff) — always tint; pure values never appear in nature
- DON'T: Use the AI color palette: cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds
- DON'T: Default to dark mode with glowing accents — it looks "cool" without requiring actual design decisions

**Layout & Space** → see `references/spatial-design.md`

- DO: Create visual rhythm through varied spacing — tight groupings, generous separations
- DO: Use fluid spacing with clamp() that breathes on larger screens
- DO: Use asymmetry and unexpected compositions; break the grid intentionally for emphasis
- DON'T: Wrap everything in cards — not everything needs a container
- DON'T: Nest cards inside cards — visual noise, flatten the hierarchy
- DON'T: Use identical card grids — same-sized cards with icon + heading + text, repeated endlessly
- DON'T: Center everything — left-aligned text with asymmetric layouts feels more designed
- DON'T: Use the same spacing everywhere — without rhythm, layouts feel monotonous

**Visual Details**

- DO: Use intentional, purposeful decorative elements that reinforce brand
- DON'T: Use glassmorphism everywhere — blur effects and glass cards used decoratively rather than purposefully
- DON'T: Use rounded rectangles with generic drop shadows — safe, forgettable
- DON'T: Use sparklines as decoration — tiny charts that convey nothing meaningful
- DON'T: Use modals unless there's truly no better alternative

**Motion** → see `references/motion-design.md`

- DO: Use motion to convey state changes — entrances, exits, feedback
- DO: Use exponential easing (ease-out-quart/quint/expo) for natural deceleration
- DO: For height animations, use grid-template-rows transitions instead of animating height directly
- DON'T: Animate layout properties (width, height, padding, margin) — use transform and opacity only
- DON'T: Use bounce or elastic easing — they feel dated and tacky

**Interaction** → see `references/interaction-design.md`

- DO: Use progressive disclosure — start simple, reveal sophistication through interaction
- DO: Design empty states that teach the interface, not just say "nothing here"
- DO: Make every interactive surface feel intentional and responsive
- DON'T: Repeat the same information — redundant headers, intros that restate the heading
- DON'T: Make every button primary — use ghost buttons, text links, secondary styles; hierarchy matters

**Responsive** → see `references/responsive-design.md`

- DO: Use container queries (@container) for component-level responsiveness
- DO: Adapt the interface for different contexts — don't just shrink it
- DON'T: Hide critical functionality on mobile — adapt the interface, don't amputate it

**UX Writing** → see `references/ux-writing.md`

- DO: Make every word earn its place
- DON'T: Repeat information users can already see

### Step 4 — Run the AI Slop Test

Before delivering, review: if you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, that's the problem.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

Review the DON'T guidelines above — they are the fingerprints of AI-generated work. Also check for these anti-patterns:

- Bento grids (modern cliché)
- Hero splits with image/text 50-50 (predictable)
- Mesh/Aurora gradients (lazy atmosphere)
- Deep cyan / fintech blue (safe harbor color)
- Gradient text for "impact" — especially on metrics or headings

### Step 5 — Verify Accessibility

Do not treat visual polish as a substitute for accessibility:

1. Confirm color contrast ratios meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
2. Verify all interactive elements are keyboard-navigable
3. Add appropriate ARIA attributes where semantic HTML is insufficient
4. Ensure motion respects `prefers-reduced-motion`
5. Test focus states are visible and intentional

### Step 6 — Explain Decisions to the User

When delivering, explain:

- What aesthetic direction was chosen and why
- Key design decisions the user should understand
- What trade-offs were made (performance, browser support, complexity)
- What to change if the user wants to adjust the direction

Use plain language. Avoid unexplained jargon. If the user is non-technical, lead with the visual impact and emotional tone, not the implementation details.

## Output Format

Deliver:

1. **Working code** — Production-grade HTML/CSS/JS, React, Vue, Svelte, or framework-specific code
2. **Design rationale** — Brief explanation of aesthetic direction, key choices, and trade-offs
3. **Accessibility notes** — Contrast ratios checked, keyboard navigation verified, ARIA attributes applied
4. **Next steps** — What to iterate on, what commands to run for refinement (see Commands section)

## References

Load only what the current step needs.

| File                               | Load when                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `references/typography.md`         | Task involves font selection, type scale, font loading, or text hierarchy decisions.                                                  |
| `references/color-and-contrast.md` | Task involves palette selection, dark mode, OKLCH color, contrast ratios, or tinted neutrals.                                         |
| `references/spatial-design.md`     | Task involves grid systems, spacing rhythm, container queries, or layout composition.                                                 |
| `references/motion-design.md`      | Task involves animation timing, easing curves, staggered reveals, or reduced motion support.                                          |
| `references/interaction-design.md` | Task involves form design, focus management, loading states, or progressive disclosure patterns.                                      |
| `references/responsive-design.md`  | Task involves mobile-first design, fluid layouts, container queries, or adaptive interfaces.                                          |
| `references/ux-writing.md`         | Task involves button labels, error messages, empty states, or microcopy decisions.                                                    |
| `references/ux-psychology.md`      | Task involves cognitive load, decision architecture, trust building, or emotional design principles.                                  |
| `references/brand-presets.md`      | Task involves applying existing brand guidelines, a named brand system (e.g. Anthropic), or converting a hex palette into CSS tokens. |

## Commands

17 specialized commands for targeted design operations. Each command focuses on a specific design concern and can be applied to a whole page or a specific element.

| Command             | Purpose                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/audit`            | Run technical quality checks: accessibility, performance, responsive behavior                                       |
| `/critique`         | UX design review: hierarchy, clarity, emotional resonance, user flow                                                |
| `/normalize`        | Align with design system standards: tokens, spacing, typography consistency                                         |
| `/polish`           | Final pass before shipping: micro-details, alignment, visual refinement                                             |
| `/distill`          | Strip to essence: remove unnecessary complexity, simplify without losing character                                  |
| `/clarify`          | Improve unclear UX copy: labels, instructions, error messages, empty states                                         |
| `/optimize`         | Performance improvements: image sizes, render-blocking, bundle impact                                               |
| `/harden`           | Error handling, i18n readiness, edge cases, defensive UI patterns                                                   |
| `/animate`          | Add purposeful motion: transitions, micro-interactions, state changes                                               |
| `/colorize`         | Introduce strategic color: palette refinement, accent placement, contrast fixes                                     |
| `/bolder`           | Amplify timid designs: stronger hierarchy, more contrast, bigger gestures                                           |
| `/quieter`          | Tone down overwhelming designs: reduce noise, increase whitespace, simplify                                         |
| `/delight`          | Add moments of joy: easter eggs, satisfying interactions, personality                                               |
| `/extract`          | Pull into reusable components: identify patterns, create component API                                              |
| `/adapt`            | Adapt for different devices: responsive breakpoints, touch targets, viewport optimization                           |
| `/onboard`          | Design onboarding flows: first-run experience, empty states, progressive disclosure                                 |
| `/teach-impeccable` | One-time setup: gather project design context, save preferences for future sessions                                 |
| `/brand`            | Apply or enforce a specific brand identity: convert guideline colors to CSS tokens, set typography, verify contrast |

Usage: Most commands accept an optional argument to focus on a specific area (e.g., `/audit header`, `/polish checkout-form`).

## Examples

- "Build a landing page for a developer tool — make it feel premium and editorial, not like every other SaaS template."
- "Redesign this dashboard. It looks like AI made it. Make it distinctive."
- "/audit this page — check accessibility, responsive behavior, and performance."
- "/critique the checkout flow — is the hierarchy clear? Does it build trust?"
- "/polish the hero section before we ship."
- "I need a color system for a health tech app. No fintech blue, no AI purple."
- "/brand anthropic — apply Anthropic's brand colors and typography to this interface."
- "Here's our brand guide with hex values. Apply it to this dashboard — /brand"
