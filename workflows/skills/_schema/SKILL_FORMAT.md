# Cubis Foundry — Canonical Skill Format

All canonical skills under `workflows/skills/<id>/SKILL.md` follow the **[Agent Skills open standard](https://agentskills.io/specification)** — the portable format adopted by Claude Code, Codex, GitHub Copilot, Gemini CLI, Cursor, and 15+ other agent products.

This document extends the official spec with Cubis Foundry conventions (required markdown sections, writing principles, validation rules). One `SKILL.md` works natively on all supported platforms.

---

## Folder Structure

```
<skill-id>/
├── SKILL.md            ← Required. Only top-level markdown file allowed.
├── references/         ← Optional. Supporting docs loaded on demand.
│   └── *.md
├── scripts/            ← Optional. Reusable automation.
│   └── *.sh / *.py
├── assets/             ← Optional. Templates, configs.
│   └── *
└── evals/              ← Optional. Test cases.
    └── evals.json
```

Rules:

- `SKILL.md` is the only top-level `.md` file. No `POWER.md`, no extra markdown at root.
- Reference files live one level deep under `references/` or `steering/`.
- Do not bulk-load references. Load one at a time when the current step needs it.

---

## YAML Frontmatter

```yaml
---
name: skill-identifier # REQUIRED — max 64 chars, kebab-case
description: > # REQUIRED — max 1024 chars
  What it does. Use when [phrase 1], [phrase 2], [phrase 3].
  Include 3-5 trigger phrases for routing accuracy.
license: MIT # OPTIONAL
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI # OPTIONAL — max 500 chars
metadata: # OPTIONAL — arbitrary key-value map
  author: cubis-foundry
  version: "1.0"
allowed-tools: Bash(git:*) Read # OPTIONAL — space-delimited (experimental)
---
```

### Required fields (per Agent Skills spec)

| Field         | Rules                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `name`        | Max 64 chars. Lowercase letters, numbers, hyphens only. Must match the directory name.         |
| `description` | Max 1024 chars. Must describe what the skill does AND when to use it. Include trigger phrases. |

### Optional fields (per Agent Skills spec)

| Field           | Purpose                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| `license`       | License name or reference to bundled license file (e.g. MIT, Apache-2.0)               |
| `compatibility` | Max 500 chars. Environment requirements: platforms, system packages, network access.   |
| `metadata`      | Arbitrary key-value map for additional properties (author, version, etc.)              |
| `allowed-tools` | Space-delimited list of pre-approved tools (experimental, support varies by platform). |

### Progressive disclosure (per Agent Skills spec)

Skills are loaded in three tiers:

1. **Metadata** (~100 tokens): `name` and `description` loaded at startup for all skills
2. **Instructions** (< 5000 tokens recommended): Full `SKILL.md` body loaded when skill is activated
3. **Resources** (as needed): Files in `references/`, `scripts/`, `assets/` loaded only when required

### Rejected fields (must not appear in frontmatter)

`domain`, `role`, `stack`, `category`, `layer`, `canonical`, `maturity`, `baseline`, `provenance`, `transition`, `aliases`, `tags`, `deprecated`, `replaced_by`

These are derived by the build system (skill-catalog.mjs), not declared in frontmatter. Compatibility aliases are handled by separate alias skills.

---

## Body Sections

Sections appear in this exact order. Use imperative form ("Do X" not "You should X").

### 1. `# Skill Name`

Clear title. Matches the skill's purpose.

### 2. `## Purpose`

One paragraph explaining what task this skill handles and why it exists.

### 3. `## When to Use`

Bullet list of contexts, file types, user phrases, or task patterns that activate this skill.

### 4. `## Instructions`

Numbered steps with reasoning ("Do X because Y"). This is the core procedure.

Fold in guidance that was previously in separate sections:

- "Avoid" items become "Do not" steps with reasoning
- "Baseline standards" become instruction steps
- "Boundaries" become guard clauses within steps

### 5. `## Output Format`

Describe expected output structure, naming conventions, file formats. Every skill must state what its output looks like.

### 6. `## References` _(optional)_

Link to reference files under `references/`. Use the table format:

```markdown
| File                | Load when                                           |
| ------------------- | --------------------------------------------------- |
| `references/foo.md` | The task involves X and needs deeper guidance on Y. |
```

### 7. `## Scripts` _(optional)_

Link to automation scripts under `scripts/`.

### 8. `## Examples` _(optional)_

2-3 concrete prompt examples showing how a user would invoke this skill.

---

## Required vs Optional Sections

| Section            | Required? | Notes                                  |
| ------------------ | --------- | -------------------------------------- |
| `# Title`          | Yes       |                                        |
| `## Purpose`       | Yes       |                                        |
| `## When to Use`   | Yes       |                                        |
| `## Instructions`  | Yes       |                                        |
| `## Output Format` | Yes       |                                        |
| `## References`    | Optional  | Include if `references/` folder exists |
| `## Scripts`       | Optional  | Include if `scripts/` folder exists    |
| `## Examples`      | Optional  | Recommended for discoverability        |

---

## Retired Sections (must NOT appear)

These sections are from the old Foundry format and must be migrated:

| Old Section                                  | Migration                                                            |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `## When Not to Use`                         | Fold negatives into `description` or `## Instructions` guard clauses |
| `## Core workflow`                           | Replaced by `## Instructions`                                        |
| `## SOP` / `## STANDARD OPERATING PROCEDURE` | Replaced by `## Instructions`                                        |
| `## IDENTITY`                                | Replaced by `## Purpose`                                             |
| `## BOUNDARIES`                              | Fold into `## Instructions` as guard clauses                         |
| `## Baseline standards`                      | Fold into `## Instructions`                                          |
| `## Avoid`                                   | Fold into `## Instructions` as "Do not" steps                        |
| `## Implementation guidance`                 | Fold into `## Instructions` or move to `references/`                 |
| `## Reference files`                         | Renamed to `## References`                                           |
| `## Helper Scripts`                          | Renamed to `## Scripts`                                              |
| `## Rules`                                   | Fold into `## Instructions`                                          |

---

## Writing Principles

1. **Imperative form** — "Do X" not "You should X"
2. **Explain the why** — reasoned instructions beat arbitrary mandates
3. **Stay general** — write for a million invocations, not just your test cases
4. **Bundle repeated work** — if the model writes the same helper script every run, put it in `scripts/`
5. **Keep under 500 lines** — use reference files for detail
6. **No malware or deception** — skills must not exploit, mislead, or exfiltrate

---

## Validation

Run `npm run validate:skills` to check:

1. Frontmatter matches `skill-frontmatter.schema.json`
2. Required headings present: `# `, `## Purpose`, `## When to Use`, `## Instructions`, `## Output Format`
3. No retired section names
4. All markdown references resolve to existing files
5. No empty reference files
