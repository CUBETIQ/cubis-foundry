# UX Psychology Reference

## Core Laws

### Hick's Law — Reduce choices to reduce decision time

Decision time increases logarithmically with the number of options. Implication: reduce the number of choices presented at once.

- **Progressive disclosure** — show 3-5 primary options, hide the rest behind "More" or "Advanced"
- **Smart defaults** — pre-select the most common choice
- **Categorization** — group 20 options into 4 categories of 5 rather than a flat list
- **Search over browse** — when options exceed ~15, provide search/filter

### Fitts's Law — Make targets big and close

Time to reach a target depends on its size and distance. Implication: important actions should be large and close to the user's likely cursor/finger position.

- **Primary CTAs** — large, high-contrast, positioned where the eye naturally lands
- **Touch targets** — minimum 44×44px, generously spaced
- **Contextual actions** — position near the item they affect (edit button next to the thing being edited)
- **Corner/edge targets** — edges of the screen are effectively infinite-size targets (good for persistent nav)

### Miller's Law — Working memory holds 7±2 items

People can hold approximately 7 chunks of information in short-term memory. Implication: group content into digestible chunks.

- **Chunking** — phone numbers: 555-123-4567 not 5551234567
- **Step indicators** — "Step 2 of 4" not a long unmarked form
- **Section headers** — break long content into scannable sections
- **Visible progress** — multi-step flows need a progress indicator

### Jakob's Law — Users spend most of their time on other sites

Users prefer interfaces that work like ones they already know. Implication: follow conventions unless you have a strong reason to deviate.

- **Navigation patterns** — logo top-left linking to home, search top-right, account top-right
- **E-commerce patterns** — cart icon, product grid, filter sidebar on desktop
- **Form patterns** — submit button bottom-right, cancel button bottom-left or as text link
- **Principle of Least Surprise** — every action should produce the result the user expects

## Trust & Credibility

1. **Social proof** — real testimonials, specific numbers ("12,847 teams use this"), recognizable logos
2. **Transparency** — show pricing clearly, explain what data you collect, no dark patterns
3. **Professional polish** — typos, broken images, and inconsistent spacing erode trust faster than anything else
4. **Progressive trust building** — ask for email before asking for credit card. Build trust incrementally.
5. **Error recovery** — how you handle mistakes defines trust more than perfect happy paths

## Emotional Design

Don Norman's three levels of design:

1. **Visceral** — first impression, visual appeal, emotional response before thinking. Handled by: typography, color, spacing, imagery.
2. **Behavioral** — usability, function, how it feels to use. Handled by: interaction patterns, feedback, performance.
3. **Reflective** — meaning, self-image, what it says about the user. Handled by: brand, status, personal value.

All three matter. A beautiful interface that's hard to use fails at level 2. A useful interface that looks generic fails at levels 1 and 3.

## Cognitive Load Management

1. **External memory** — show current state (breadcrumbs, active filters, sort indicator) so users don't have to remember
2. **Recognition over recall** — dropdown menus, icon + label, autocomplete. Don't make users type from memory.
3. **Consistent patterns** — same action should look the same everywhere. If "Delete" is a red button in one place, it should be red everywhere.
4. **Reduce distractions** — remove UI that isn't relevant to the current task. Every element competes for attention.
5. **Chunking complex tasks** — break multi-step processes into clear phases with progress indicators

## Decision Architecture

How you frame choices affects what users choose:

- **Default effect** — users overwhelmingly keep defaults. Choose defaults carefully.
- **Anchoring** — the first number/option sets expectations. Show the premium plan first to anchor high.
- **Loss aversion** — "Don't lose your progress" is more motivating than "Save your progress."
- **Scarcity** — "3 spots left" creates urgency (but only use when true — dark patterns destroy trust).
- **Framing** — "95% uptime" vs "down 18 days per year" — same fact, different perception.

Use these ethically. The goal is to help users make good decisions, not to manipulate them.
