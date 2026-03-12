# Brand Presets Reference

Use this reference when building interfaces that must conform to an existing brand system — whether a client-supplied style guide, a design system handoff, or a well-documented brand like Anthropic's.

## Receiving Brand Guidelines

When a user hands over brand guidelines, extract these five things before writing any code:

| Extract            | Ask or infer                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| **Color palette**  | What are the primary, secondary, and accent hex values?                      |
| **Neutral system** | Are neutrals warm, cool, or truly achromatic?                                |
| **Typography**     | Specific font families for headings and body? Variable font available?       |
| **Spacing DNA**    | Base unit? Tight/airy preference?                                            |
| **Tone**           | Where on the spectrum between playful ↔ authoritative, minimal ↔ expressive? |

## Hex → OKLCH Conversion Workflow

Always convert brand hex colors to OKLCH for CSS. OKLCH gives you perceptual uniformity — colors with the same L value look equally bright, unlike hex or HSL.

```css
/* Conversion pattern:  hex → oklch via CSS Color 4 */
/* Most modern browsers accept oklch() natively */
/* Use https://oklch.com to find values, or compute: */

/* L = perceived lightness 0–100% */
/* C = chroma (colorfulness) 0–0.37ish */
/* H = hue angle 0–360 */

/* Example: #d97757 (warm orange) */
--brand-orange: oklch(65% 0.145 42);

/* Example: #faf9f5 (warm cream) */
--brand-surface: oklch(98.2% 0.008 85);

/* Example: #141413 (warm near-black) */
--brand-ink: oklch(10.5% 0.006 85);
```

**Shorthand**: enter any hex at [oklch.com](https://oklch.com) to get the L/C/H values.

## Semantic Token Mapping

Once you have OKLCH values, map them to semantic tokens — never use raw hex or oklch values directly in components:

```css
:root {
  /* --- RAW BRAND TOKENS (source of truth) --- */
  --brand-ink: oklch(10.5% 0.006 85); /* near-black, warm */
  --brand-surface: oklch(98.2% 0.008 85); /* cream white */
  --brand-mid: oklch(72% 0.009 85); /* mid-range gray */
  --brand-subtle: oklch(92% 0.01 85); /* light gray */
  --brand-orange: oklch(65% 0.145 42); /* primary accent */
  --brand-blue: oklch(65% 0.09 235); /* secondary accent */
  --brand-green: oklch(57% 0.09 130); /* tertiary accent */

  /* --- SEMANTIC TOKENS (what components use) --- */
  --color-bg: var(--brand-surface);
  --color-bg-subtle: var(--brand-subtle);
  --color-text: var(--brand-ink);
  --color-text-secondary: var(--brand-mid);
  --color-accent: var(--brand-orange);
  --color-accent-secondary: var(--brand-blue);
  --color-accent-tertiary: var(--brand-green);
  --color-border: var(--brand-subtle);
}
```

## Anthropic Brand System

Anthropic's brand (from [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/brand-guidelines)) is a useful reference implementation. It's a warm, editorial system — earthy neutrals with bold accent contrast.

### Color Palette

```css
:root {
  /* Neutrals — warm hue angle ~85 (yellow-brown direction) */
  --anthropic-ink: oklch(10.5% 0.006 85); /* #141413 — body text, dark bg */
  --anthropic-cream: oklch(
    98.2% 0.008 85
  ); /* #faf9f5 — light bg, text on dark */
  --anthropic-mid: oklch(72% 0.009 85); /* #b0aea5 — secondary text */
  --anthropic-subtle: oklch(92% 0.01 85); /* #e8e6dc — dividers, subtle bg */

  /* Accents — arranged in visual temperature order */
  --anthropic-orange: oklch(
    65% 0.145 42
  ); /* #d97757 — primary CTA, highlights */
  --anthropic-blue: oklch(65% 0.09 235); /* #6a9bcc — secondary actions */
  --anthropic-green: oklch(
    57% 0.09 130
  ); /* #788c5d — tertiary, success states */
}
```

### Typography

```css
/* Load from Google Fonts */
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap");

:root {
  --font-display: "Poppins", Arial, sans-serif; /* headings, nav, labels */
  --font-body: "Lora", Georgia, serif; /* body text, long-form */
}

/* Application rules */
h1,
h2,
h3,
h4,
h5,
h6,
.label,
.nav-item,
.button,
.badge {
  font-family: var(--font-display);
}

p,
blockquote,
.prose,
article {
  font-family: var(--font-body);
}
```

**Why this pairing works**: Poppins is geometric and structured — clear, modern authority. Lora is elegant serif — warm, readable, literary. Together they balance clarity with warmth, matching Anthropic's positioning between scientific rigor and approachability.

### Spacing DNA

The brand leans into generous negative space. Use a `8px` base unit with larger gaps between major sections:

```css
:root {
  --space-1: 0.5rem; /* 8px  — tight groupings */
  --space-2: 1rem; /* 16px — component padding */
  --space-3: 1.5rem; /* 24px — between related elements */
  --space-4: 2rem; /* 32px — section mini-gap */
  --space-6: 3rem; /* 48px — between sections */
  --space-8: 4rem; /* 64px — major section spacing */
}
```

### Component Patterns

```css
/* Card — warm border, generous padding, no shadow */
.card {
  background: var(--anthropic-subtle);
  border: 1px solid var(--anthropic-mid);
  border-radius: 4px; /* subtle — not pill-shaped */
  padding: var(--space-4);
}

/* Button — orange CTA */
.button-primary {
  background: var(--anthropic-orange);
  color: var(--anthropic-cream);
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: 0.01em;
  border-radius: 4px;
  padding: 0.625rem 1.5rem;
  border: none;
}
.button-primary:hover {
  background: oklch(60% 0.145 42); /* slightly darker orange */
}

/* Text link — uses orange, not blue */
a {
  color: var(--anthropic-orange);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

/* Code / monospace — uses ink on subtle bg */
code {
  background: var(--anthropic-subtle);
  color: var(--anthropic-ink);
  font-size: 0.875em;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
```

### Dark Mode

Anthropic's palette inverts gracefully — the cream and ink swap, mid-tones pull slightly warmer:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--anthropic-ink);
    --color-bg-subtle: oklch(16% 0.008 85); /* slightly elevated */
    --color-text: var(--anthropic-cream);
    --color-text-secondary: var(--anthropic-mid);
    --color-border: oklch(22% 0.008 85);
    /* Accents stay the same — they hold on both backgrounds */
  }
}
```

## Applying Other Brand Systems

When adapting a different brand, follow this checklist:

1. **Extract and convert** — Get all hex values, convert to oklch
2. **Identify neutrals** — Are they warm, cool, or pure gray? Find the hue angle
3. **Map the hierarchy** — Which color is dominant (60%), which secondary (30%), which accent (10%)?
4. **Check contrast** — Use the WCAG APCa algorithm for text contrast. oklch makes this predictable
5. **Find the typography voice** — Geometric sans = structured/modern; humanist sans = friendly; slab = authoritative; oldstyle serif = editorial; transitional serif = professional
6. **Test the mood** — Show a prototype section in brand colors. Does it _feel_ like the brand in motion, not just color?

## Common Brand Color Archetypes

| Archetype                      | Neutrals                | Primary accent       | Feeling                           |
| ------------------------------ | ----------------------- | -------------------- | --------------------------------- |
| **Warm editorial** (Anthropic) | Cream / warm near-black | Orange / terracotta  | Thoughtful, approachable, premium |
| **Cool tech**                  | True gray / white       | Electric blue / teal | Precise, efficient, modern        |
| **Finance/enterprise**         | Navy / white            | Deep blue / gold     | Stable, trustworthy, conservative |
| **Health/wellness**            | Off-white / dark green  | Sage green / amber   | Natural, calm, nurturing          |
| **Startup/consumer**           | White / black           | Bold purple or coral | Energetic, fun, accessible        |
| **Luxury**                     | White / true black      | Gold / burgundy      | Exclusive, refined, timeless      |

When working with a brand that fits these archetypes, pull from the pattern — then make one unexpected choice to give it character.
