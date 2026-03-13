````markdown
---
inclusion: manual
name: mobile-design
description: Design mobile interfaces with touch psychology, platform-native patterns, iOS and Android guidelines, gesture handling, and responsive mobile layouts.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Mobile Design

## Purpose

Guide mobile interface design with platform-native patterns, touch ergonomics, and mobile-specific UX principles. Covers both native (iOS/Android) and responsive web mobile experiences.

## When to Use

- Designing or reviewing mobile app interfaces
- Building responsive web experiences for mobile devices
- Implementing touch interactions and gestures
- Adapting desktop designs for mobile
- Choosing between native patterns and cross-platform consistency
- Optimizing mobile performance and perceived speed

## Instructions

### Step 1 — Design for Touch

**Touch target sizes**:
| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS (HIG) | 44×44 pt | 48×48 pt |
| Android (Material) | 48×48 dp | 56×56 dp |
| Web (WCAG) | 44×44 CSS px | 48×48 CSS px |

**Thumb zones** (for one-handed use on phones):

- Easy reach: bottom center of screen
- Hard reach: top corners
- Primary actions go in the easy zone (bottom navigation, FABs)
- Destructive actions go in the hard zone (require deliberate reach)

**Touch feedback**:

- Every tap should produce immediate visual feedback (< 100ms)
- Use ripple (Android), highlight (iOS), or scale transform (web)
- Long-press actions need a visual indication of the hold

### Step 2 — Follow Platform Conventions

**iOS (Human Interface Guidelines)**:

- Navigation: tab bar at bottom, navigation bar at top with back button
- Modals: sheet presentations, slide up from bottom
- Actions: swipe-to-delete, pull-to-refresh
- Typography: SF Pro, Dynamic Type (accessibility scaling)
- Safe areas: respect notch, home indicator, status bar

**Android (Material Design)**:

- Navigation: bottom navigation or navigation drawer
- Modals: bottom sheets, dialogs
- Actions: FAB for primary action, swipe gestures
- Typography: Roboto, system font scaling
- Edge-to-edge: draw behind system bars

**Cross-platform (React Native, Flutter)**:

- Use platform-adaptive components when possible
- Match navigation patterns to the platform (not one pattern for both)
- Test on both platforms — don't assume iOS behavior works on Android

### Step 3 — Optimize Mobile Layouts

**Mobile-first hierarchy**:

1. One primary action per screen
2. Vertical scrolling only (avoid horizontal scroll for content)
3. Full-width elements (no tiny desktop-sized cards)
4. Progressive disclosure (show summary, expand for details)

**Common mobile patterns**:
| Pattern | When to Use |
|---------|-------------|
| Bottom sheet | Secondary actions, filters, options |
| Pull-to-refresh | List/feed content updates |
| Infinite scroll | Feeds, search results |
| Swipe actions | Quick operations on list items |
| Bottom navigation | 3-5 top-level destinations |
| FAB | Single primary action per screen |
| Skeleton screens | Content loading states |

**Text on mobile**:

- Body text ≥ 16px (prevents iOS zoom on input focus)
- Line length: 35-50 characters per line
- Generous line-height (1.5+) for readability
- Left-aligned (or start-aligned for RTL) — never justified

### Step 4 — Handle Mobile-Specific Challenges

**Keyboards**:

- Use correct `inputmode` for each field (`numeric`, `email`, `tel`, `url`)
- Scroll input into view when keyboard appears
- Dismiss keyboard on background tap
- Show "Next" button to move between fields, "Done" on the last field

**Offline & connectivity**:

- Show clear offline indicator
- Queue actions for retry when connection returns
- Cache critical content for offline access
- Never silently fail — tell the user what's happening

**Performance**:

- Target < 3s first meaningful paint on 3G
- Lazy-load images below the fold
- Minimize JS bundle — mobile CPUs are 3-5x slower than desktop
- Use native scrolling (`-webkit-overflow-scrolling: touch` or `overscroll-behavior`)
- Avoid heavy animations on low-end devices

### Step 5 — Test on Real Devices

- Test on both iOS and Android
- Test on at least one low-end device (performance)
- Test with large text / accessibility settings
- Test in landscape orientation
- Test with slow network (3G simulation)
- Test keyboard interactions on every form
- Test gesture conflicts (system gestures vs. app gestures)

## Output Format

```
## Mobile Design Review
[platform, device considerations, and approach]

## Layout
[responsive structure and component choices]

## Touch & Interaction
[gesture handling, feedback, and accessibility]

## Platform-Specific Notes
[iOS / Android / web differences]
```

## Examples

**User**: "Design a mobile checkout flow"

**Response approach**: Single-column layout, large touch targets (48px+), numeric keyboard for card input, auto-advance between fields, Apple Pay / Google Pay as primary CTA (bottom of screen), inline validation, minimal form fields.

**User**: "Adapt our desktop dashboard for mobile"

**Response approach**: Prioritize key metrics (don't show everything). Replace side navigation with bottom tabs. Stack cards vertically. Make charts scrollable or simplified. Replace hover interactions with tap-to-reveal. Consider pull-to-refresh for data updates.
````
