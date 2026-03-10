# Universal Skill Creator

A full replication and extension of Anthropic's `skill-creator`, with added support for:

| Platform | File Generated |
|---|---|
| **Claude Code** | `SKILL.md` (canonical) |
| **OpenAI Codex** | `AGENTS.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` |
| **Google Gemini Code Assist / Project IDX** | `GEMINI.md` |

## What's Included

```
universal-skill-creator/
├── SKILL.md                        ← Main skill instructions (Claude Code)
├── README.md                       ← This file
├── agents/
│   ├── grader.md                   ← Eval assertion grader
│   ├── comparator.md               ← Blind A/B comparison agent
│   └── analyzer.md                 ← Post-hoc analysis agent
├── assets/
│   └── eval_review.html            ← Browser-based eval reviewer UI
├── eval-viewer/
│   ├── generate_review.py          ← Launch the eval viewer server
│   └── viewer.html                 ← Viewer template
├── evals/
│   └── evals.json                  ← Test case templates
├── references/
│   ├── schemas.md                  ← JSON schemas for all structured outputs
│   └── platform-formats.md        ← Detailed format specs per platform
└── scripts/
    ├── platform_adapter.py         ← NEW: Convert SKILL.md → all platform formats
    ├── aggregate_benchmark.py      ← Aggregate eval results into benchmark.json
    ├── generate_report.py          ← Generate markdown reports
    ├── improve_description.py      ← Improve the skill description
    ├── package_skill.py            ← Package skill as .skill file
    ├── quick_validate.py           ← Validate skill structure
    ├── run_eval.py                 ← Run evals against a skill
    └── run_loop.py                 ← Automated description optimization loop
```

## Quick Start

### 1. Create a new skill
Tell Claude: *"I want to create a skill that [does X] for [platform(s)]"*

### 2. Export to all platforms
```bash
python -m scripts.platform_adapter ./my-skill --all
```

### 3. Export to specific platforms
```bash
python -m scripts.platform_adapter ./my-skill --platforms copilot codex
```

### 4. Run evals (Claude Code / Cowork)
```bash
python -m scripts.run_eval --skill-path ./my-skill --eval-set evals/evals.json
```

### 5. Optimize description (Claude Code only)
```bash
python -m scripts.run_loop \
  --eval-set trigger-eval.json \
  --skill-path ./my-skill \
  --model claude-sonnet-4-20250514 \
  --max-iterations 5
```

### 6. Package
```bash
python -m scripts.package_skill ./my-skill
```

## Platform Notes

- **Claude Code**: Full dynamic skill system. Description field drives triggering.
- **Copilot**: Always-active workspace instructions. No dynamic loading.
- **Codex**: Session-start loading from `AGENTS.md`. Supports subagents natively.
- **Gemini/IDX**: Session-start loading from `GEMINI.md`. IDX uses `.idx/dev.nix` for environment.
