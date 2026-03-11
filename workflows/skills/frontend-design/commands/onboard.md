# /onboard

Design first-run experience: empty states, progressive disclosure, guided tours.

## What It Does

Reviews and improves the first-time user experience. Focuses on what users see before they have any data, how they learn the interface, and how they reach their first moment of value.

## First-Run Patterns

### Empty States

Every empty state should include:

1. **Illustration or icon** — visual context (not a blank void)
2. **Headline** — what this area is for
3. **Description** — why it's empty and what to do next
4. **Primary action** — one clear CTA to get started

```
┌──────────────────────────────┐
│         [illustration]       │
│                              │
│     No projects yet          │
│                              │
│  Create your first project   │
│  to start tracking work.     │
│                              │
│     [ Create Project ]       │
└──────────────────────────────┘
```

### Progressive Disclosure

- Show only essential features on first use
- Reveal advanced features as users demonstrate readiness
- Use contextual tooltips (not modal tours) to explain features in context
- Let users dismiss guidance permanently

### Onboarding Checklist

- Show progress toward setup completion (3/5 steps done)
- Make steps completable in any order when possible
- Celebrate completion with a moment of delight
- Auto-dismiss the checklist once all steps are done

### Guided Walkthrough

- Maximum 3–5 steps — fewer is better
- Each step highlights one feature with one sentence
- Allow skipping at any point
- Never block the user from using the app

## Usage

- `/onboard` — review and improve first-run experience
- `/onboard empty-states` — design empty states for all views
- `/onboard checklist` — create setup completion checklist
