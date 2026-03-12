# /brand

Apply or enforce a specific brand identity across a frontend. Works from uploaded brand guidelines, a style guide document, hex palettes, or a named brand system.

## Usage

```
/brand                           → Prompt for brand context, then apply
/brand anthropic                 → Apply Anthropic's brand system
/brand <hex-palette>             → Build tokens from provided hex values
/brand <element>                 → Apply brand to a specific component or section
```

## What It Does

Converts brand guidelines into a living CSS token system and applies it consistently across the interface. Outputs production-ready tokens plus updated component styles.

## Workflow

### 1. Gather Brand Inputs

Ask for (or detect from context):

- **Color values** — Primary, secondary, accent hex codes (or link to brand guide)
- **Typography** — Font families for headings and body. If not specified, choose a pairing that matches the brand's tone
- **Named brand** — If the user says "Anthropic", "Stripe", "Linear", "Vercel" etc., load known reference patterns from `references/brand-presets.md`

### 2. Convert to OKLCH Tokens

Translate all hex values to OKLCH for perceptual uniformity. See `references/brand-presets.md` for the full conversion workflow.

```css
/* Pattern: convert every color to oklch */
--brand-[name]: oklch(L% C H);
```

### 3. Build Semantic Token Layer

Map raw brand tokens to semantic roles. Never reference raw tokens directly in components:

```css
:root {
  /* Surfaces */
  --color-bg: var(--brand-surface);
  --color-bg-subtle: var(--brand-subtle);
  --color-bg-elevated: var(--brand-elevated);

  /* Text */
  --color-text: var(--brand-ink);
  --color-text-muted: var(--brand-mid);

  /* Interactive */
  --color-accent: var(--brand-primary-accent);
  --color-accent-hover: oklch(
    from var(--brand-primary-accent) calc(l - 0.05) c h
  );

  /* Borders */
  --color-border: var(--brand-subtle);
  --color-border-focus: var(--brand-primary-accent);
}
```

### 4. Apply Typography

Set font families from brand guidelines and load them via Google Fonts or system stack:

```css
@import url("https://fonts.googleapis.com/css2?family=DISPLAY_FONT&family=BODY_FONT&display=swap");

:root {
  --font-display: "Display Font", fallback, sans-serif;
  --font-body: "Body Font", fallback, serif;
}
```

Apply via element targeting:

- Headings, labels, buttons, nav → `var(--font-display)`
- Body copy, prose, descriptions → `var(--font-body)`

### 5. Output Deliverables

Deliver:

1. **Complete token file** — `tokens.css` or `:root {}` block with all brand tokens + semantic layer
2. **Typography setup** — Font import + application rules
3. **Component overrides** — Button, card, link, input, badge in brand style
4. **Dark mode** — Inverted/adapted token values for `prefers-color-scheme: dark`
5. **Usage notes** — How to swap the brand accent, where NOT to use accent color, contrast verification

---

## Anthropic Brand Quick-Apply

When the user requests Anthropic brand styling, use this preset directly:

```css
/* ========================================
   ANTHROPIC BRAND TOKENS
   Source: github.com/anthropics/skills
   ======================================== */
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap");

:root {
  /* Neutrals */
  --brand-ink: oklch(10.5% 0.006 85);
  --brand-cream: oklch(98.2% 0.008 85);
  --brand-mid: oklch(72% 0.009 85);
  --brand-subtle: oklch(92% 0.01 85);

  /* Accents */
  --brand-orange: oklch(65% 0.145 42);
  --brand-blue: oklch(65% 0.09 235);
  --brand-green: oklch(57% 0.09 130);

  /* Semantic layer */
  --color-bg: var(--brand-cream);
  --color-bg-subtle: var(--brand-subtle);
  --color-text: var(--brand-ink);
  --color-text-secondary: var(--brand-mid);
  --color-accent: var(--brand-orange);
  --color-accent-secondary: var(--brand-blue);
  --color-border: var(--brand-subtle);

  /* Typography */
  --font-display: "Poppins", Arial, sans-serif;
  --font-body: "Lora", Georgia, serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--brand-ink);
    --color-bg-subtle: oklch(16% 0.008 85);
    --color-text: var(--brand-cream);
    --color-text-secondary: var(--brand-mid);
    --color-border: oklch(22% 0.008 85);
  }
}
```

---

## Accessibility Check After Applying

After applying brand tokens, verify:

1. **Text contrast**: `--color-text` on `--color-bg` must pass WCAG AA (4.5:1 normal, 3:1 large)
2. **Accent on background**: `--color-accent` used as text or border must meet 3:1 minimum against its background
3. **Focus states**: `--color-border-focus` must be visually distinct (3:1 against surrounding colors)

For Anthropic's palette: cream `#faf9f5` on near-black `#141413` gives ~18:1 — passes AAA. Orange `#d97757` on cream gives ~3.2:1 — acceptable for large text and UI components, not for small body text.

---

## Tone Alignment

After applying brand colors, make sure the _design choices_ match the brand character:

| Brand character                      | Design implication                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Warm, editorial (Anthropic)          | Generous whitespace, serif body, soft borders, understated motion            |
| Precise, minimal (Linear, Vercel)    | Tight spacing, geometric sans only, sharp edges, instant transitions         |
| Bold, consumer (Spotify, Duolingo)   | Color-heavy, large type, playful shapes, expressive animation                |
| Trustworthy, enterprise (Salesforce) | Blue-dominant, structured grids, conservative type, high information density |

Color alone doesn't make a branded interface feel right — spacing, motion, and layout personality must match.
