````markdown
---
inclusion: manual
name: i18n-localization
description: Implement internationalization and localization including RTL support, pluralization, date/number formatting, translation workflows, and locale-aware UI.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# I18N & Localization

## Purpose

Guide internationalization (i18n) and localization (l10n) implementation. Ensure applications can be adapted for different languages, regions, and cultural conventions without code changes.

## When to Use

- Adding multi-language support to an application
- Implementing RTL (right-to-left) layout support
- Handling dates, numbers, and currencies across locales
- Setting up translation workflows and string management
- Reviewing code for i18n readiness
- Building locale-aware UI components

## Instructions

### Step 1 — Externalize All User-Facing Strings

**Never hardcode user-visible text**:

```typescript
// DON'T
<button>Save Changes</button>

// DO
<button>{t('actions.save_changes')}</button>
```

**String keys**:

- Use namespaced dot notation: `page.section.element`
- Keys should be descriptive, not the English text
- Group by feature/page, not by component

**Message format** (ICU MessageFormat):

```json
{
  "items.count": "{count, plural, =0 {No items} one {# item} other {# items}}",
  "greeting": "Hello, {name}!",
  "order.total": "Total: {total, number, currency}"
}
```

### Step 2 — Handle Pluralization

Different languages have different plural rules (Arabic has 6 plural forms):

```json
{
  "en": { "items": "{count, plural, one {# item} other {# items}}" },
  "ar": {
    "items": "{count, plural, zero {لا عناصر} one {عنصر واحد} two {عنصران} few {# عناصر} many {# عنصراً} other {# عنصر}}"
  }
}
```

Never build pluralization with ternaries — always use the ICU plural syntax or equivalent library (Intl.PluralRules).

### Step 3 — Format Dates, Numbers, and Currencies

Use `Intl` APIs — never format manually:

```typescript
// Date
new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(date);
// → "15. Januar 2025"

// Number
new Intl.NumberFormat("ja-JP").format(1234567);
// → "1,234,567"

// Currency
new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
  42.5,
);
// → "$42.50"

// Relative time
new Intl.RelativeTimeFormat("fr", { numeric: "auto" }).format(-1, "day");
// → "hier"
```

### Step 4 — Support RTL Languages

**CSS logical properties** (replace physical with logical):

| Physical (DON'T)   | Logical (DO)          |
| ------------------ | --------------------- |
| `margin-left`      | `margin-inline-start` |
| `padding-right`    | `padding-inline-end`  |
| `text-align: left` | `text-align: start`   |
| `float: left`      | `float: inline-start` |
| `border-left`      | `border-inline-start` |

**Layout**:

- Use `dir="auto"` on user-generated content
- Set `<html dir="rtl" lang="ar">` at the document level
- Flexbox and Grid respect `direction` automatically
- Mirror icons that indicate direction (arrows, back buttons)
- Don't mirror: logos, numbers, media controls, checkmarks

### Step 5 — Translation Workflow

**File structure**:

```
locales/
├── en/
│   ├── common.json      (shared strings)
│   ├── auth.json         (login/signup)
│   └── dashboard.json    (dashboard page)
├── fr/
├── ja/
└── ar/
```

**Process**:

1. Developer adds key + English string
2. CI extracts new/changed keys automatically
3. Strings sent to translators (Crowdin, Lokalise, or equivalent)
4. Translations imported back as JSON/YAML
5. CI validates: no missing keys, no untranslated strings, valid ICU syntax

**Rules**:

- Never concatenate translated strings (`t('hello') + ' ' + name` breaks in many languages)
- Provide context for translators (comments in message files)
- Max string length varies by language (German ~30% longer than English)
- Test with pseudo-localization (e.g., "Ŝàvé Çhàñgéŝ") to catch hardcoded strings

## Output Format

```
## I18N Assessment
[current state and gaps]

## Implementation
[code changes for i18n support]

## Translation Setup
[file structure, workflow, tooling]

## RTL Support
[layout changes for bidirectional support]
```

## Examples

**User**: "Add multi-language support to our React app"

**Response approach**: Set up react-intl or next-intl. Externalize all strings with namespaced keys. Configure locale detection (URL, browser, user preference). Set up ICU MessageFormat for plurals and interpolation. Show translation file structure.

**User**: "Our app needs to support Arabic"

**Response approach**: Add RTL support with CSS logical properties. Set `dir="rtl"` on html element. Audit all physical CSS properties. Mirror directional icons. Test with Arabic translations for text expansion.
````
