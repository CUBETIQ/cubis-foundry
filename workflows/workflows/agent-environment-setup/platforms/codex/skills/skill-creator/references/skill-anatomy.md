# Skill Anatomy

## Overview

A skill package is a self-contained knowledge module that provides domain-specific guidance to an AI agent. Understanding the purpose and structure of each file helps create well-organized, maintainable skills.

## Directory Structure

```
workflows/skills/<skill-name>/
├── SKILL.md                    # Primary skill definition
├── evals/
│   ├── evals.json             # Machine-readable eval suite
│   └── assertions.md          # Human-readable assertion docs
├── examples/
│   ├── 01-<basic>.md          # Basic usage example
│   └── 02-<advanced>.md       # Advanced usage example
├── references/
│   ├── <topic-1>.md           # Deep-dive reference 1
│   ├── <topic-2>.md           # Deep-dive reference 2
│   └── <topic-3>.md           # Deep-dive reference 3
├── scripts/                    # Optional
│   └── <action>.sh|py
└── agents/                     # Optional
    └── <role>.md
```

## SKILL.md — The Core

The SKILL.md is the entry point. When a skill is loaded, the platform reads this file first. Everything else is loaded on demand.

### Frontmatter
Machine-readable metadata parsed by the platform. Controls how the skill appears in search results, which tools it can use, and whether it runs in a forked context.

### Purpose Section
One paragraph that explains WHAT the skill provides. This is the skill's elevator pitch — read by humans when browsing the skill library.

### When to Use Section
Bullet list of trigger conditions. This is the primary routing signal — the MCP route_resolve tool uses these bullets to match user intent to skills.

### Instructions Section
The heart of the skill. Numbered, ordered guidance that the LLM follows when the skill is active. Quality of instructions directly determines output quality.

### Output Format Section
Describes what the skill produces. Helps the LLM structure its output consistently. Can include templates, code blocks, or structured formats.

### References Table
Maps reference files to loading conditions. Enables progressive disclosure — the platform loads references only when the current task matches the "Load when" condition.

## evals/ — The Test Suite

### evals.json
Machine-readable test cases. Each eval has a prompt (the test input) and assertions (expected output characteristics). Used by the eval runner to measure skill quality.

### assertions.md
Human-readable documentation of each assertion. Explains what the assertion tests, why it matters, and what constitutes a pass vs fail. Useful for skill developers iterating on instruction quality.

## examples/ — Documentation and Training

### 01-basic-usage.md
A straightforward scenario showing the skill in action. Serves three purposes:
1. Documentation — shows users what the skill does
2. Training — provides an implicit few-shot example
3. Eval material — can be used as additional test cases

### 02-advanced-usage.md
A complex scenario exercising the skill's full capabilities. Demonstrates edge cases, multi-step reasoning, and reference file utilization.

## references/ — Progressive Disclosure

Reference files contain deep technical content that would bloat the main SKILL.md. They are loaded on demand when the current task matches the "Load when" condition in the References table.

### Design Principles

1. **One topic per file** — each reference covers a coherent subtopic
2. **Self-contained** — reference can be understood without reading the SKILL.md
3. **Actionable** — provides specific guidance, not general theory
4. **80-150 lines** — detailed enough to be useful, focused enough to stay relevant

### Common Reference Topics

- `testing.md` — testing strategies specific to the skill's domain
- `patterns.md` — design patterns and architectural decisions
- `security.md` — security considerations for the domain
- `performance.md` — performance optimization techniques
- `migration.md` — migration guides from older approaches

## scripts/ — Automation (Optional)

Shell or Python scripts that automate repetitive tasks related to the skill. Examples:
- `validate.sh` — runs validation checks on skill output
- `scaffold.py` — generates boilerplate code
- `benchmark.sh` — runs performance benchmarks

Scripts must be executable and include a usage comment at the top.

## agents/ — Specialist Agents (Optional)

Agent definition files for skills that involve multi-agent workflows. Each agent has YAML frontmatter (name, description, tools, model) and a markdown body with operational instructions.

Use agents/ when:
- The skill involves distinct roles (e.g., author + reviewer)
- Different phases require different tool access
- Parallel execution benefits from isolated contexts

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Skill directory | kebab-case | `python-best-practices` |
| SKILL.md name field | kebab-case, matches directory | `python-best-practices` |
| Reference files | kebab-case | `async-patterns.md` |
| Example files | numbered prefix | `01-basic-usage.md` |
| Agent files | kebab-case role | `test-author.md` |
| Script files | kebab-case action | `validate.sh` |
