# Pro Skill Standard

## Overview

The Pro Skill Standard defines the minimum quality bar for production skills in the Cubis Foundry library. Every skill must pass this checklist before being merged.

## File Manifest

Every skill package must contain:

```
workflows/skills/<name>/
  SKILL.md                    # Required — primary skill definition
  evals/
    evals.json               # Required — evaluation prompts and assertions
    assertions.md            # Required — human-readable assertion explanations
  examples/
    01-<scenario>.md         # Required — basic usage example
    02-<scenario>.md         # Required — advanced usage example
  references/
    <topic-1>.md             # Required — 3-6 reference files
    <topic-2>.md
    <topic-3>.md
  scripts/                   # Optional — automation scripts
    <action>.sh|py
  agents/                    # Optional — specialized agent definitions
    <role>.md
```

## SKILL.md Requirements

### Frontmatter

```yaml
---
name: kebab-case-name         # Must match directory name
description: "Use when..."    # Must start with "Use when"
license: MIT                  # MIT for open source
metadata:
  author: cubis-foundry       # Author identifier
  version: "3.0"              # Semantic version string
compatibility: Claude Code, Codex, GitHub Copilot
---
```

### Required Sections

1. **# Title** — skill name in title case
2. **## Purpose** — exactly one paragraph explaining what the skill provides
3. **## When to Use** — 4-8 bullet points of trigger conditions
4. **## Instructions** — 12-18 numbered items (see instruction format below)
5. **## Output Format** — describe what the skill produces
6. **## References** — table with File and "Load when" columns

### Instruction Format

Every instruction must follow the WHAT + WHY pattern:

```
N. **Bold action statement** — elaboration with specific guidance, because [reasoning that explains why this matters].
```

Bad example:
> 1. Use TypeScript strict mode.

Good example:
> 1. **Enable strict mode in tsconfig.json** — set `strict: true` as the first compiler option, because weak defaults hide implicit `any` types that propagate type uncertainty to consumers.

### Instruction Count

- Minimum: 12 instructions
- Maximum: 18 instructions
- Sweet spot: 14-16 instructions

Fewer than 12 leaves critical guidance gaps. More than 18 causes instruction fatigue — the LLM starts selectively following instructions rather than following all of them.

## Reference File Requirements

### Count
3-6 reference files per skill. Fewer than 3 means the skill is either too narrow or missing depth. More than 6 means the skill scope is too broad and should be split.

### Length
80-150 lines per reference file. Shorter references don't provide enough depth. Longer references should be split into focused subtopics.

### Content
Each reference should cover a coherent subtopic that is:
- Too detailed for the main SKILL.md
- Needed only in specific scenarios (progressive disclosure)
- Deep enough to be genuinely useful as a standalone reference

### Naming
Use kebab-case descriptive names: `async-patterns.md`, `error-handling.md`, `testing.md`.

## Eval Requirements

### evals.json Format

```json
{
  "evals": [
    {
      "prompt": "The scenario to test — should be specific enough to trigger the skill",
      "assertions": [
        "behavioral assertion 1 — what the output should contain/do",
        "behavioral assertion 2",
        "behavioral assertion 3",
        "behavioral assertion 4",
        "behavioral assertion 5"
      ]
    }
  ]
}
```

### Assertion Design

- Test behavioral output, not exact strings
- Use action verbs: "identifies", "recommends", "addresses", "provides", "explains"
- Each assertion should test a different aspect of the skill's output
- Assertions should be falsifiable — it must be possible to clearly determine pass/fail

### assertions.md

Human-readable explanation of each assertion: what it tests, why it matters, and what constitutes a pass vs fail.

## Example Requirements

### 01-basic-usage.md
A straightforward scenario that demonstrates the skill's core functionality. Should be approachable for someone new to the skill's domain.

### 02-advanced-usage.md
A complex scenario that exercises the skill's full capabilities, including edge cases, multi-step reasoning, and reference file loading.

## Quality Gates

Before merging, every skill must:

1. Pass `npm run test:attributes` — validates frontmatter fields
2. Have valid JSON in evals.json — no trailing commas, proper encoding
3. Have all referenced files exist — every file in the References table must be present
4. Have no placeholders or TODOs — every section must contain real content
5. Follow the naming convention — directory name matches frontmatter `name` field
