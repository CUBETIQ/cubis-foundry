---
name: universal-skill-creator
description: Create, test, improve, and package AI skills using the portable Agent Skills SKILL.md format that works across Claude Code, OpenAI Codex, and GitHub Copilot. Convert to GEMINI.md for Google Gemini (the only platform without native SKILL.md support). Use this skill whenever the user wants to build a reusable AI instruction set, prompt template, coding assistant rule, or workflow automation — even if they just say "make a skill", "create a rule", "write a prompt template", or "I want Copilot to always do X". Supports cross-platform deployment, eval-driven iteration, and description optimization.
---

# Universal Skill Creator

A skill for creating, testing, and improving portable AI skills using the **Agent Skills open standard** (`SKILL.md`).

## Portable Format

One `SKILL.md` works natively on three platforms:

- **Claude Code** — `~/.claude/skills/<name>/SKILL.md`
- **OpenAI Codex** — `<repo>/<name>/SKILL.md` (Agent Skills open standard)
- **GitHub Copilot** — `.github/skills/<name>/SKILL.md` or `~/.copilot/skills/<name>/SKILL.md`

Only **Google Gemini** requires format conversion:

- **Gemini Code Assist / Project IDX** — `GEMINI.md` (converted from SKILL.md)

The core loop: draft → test → evaluate → iterate → optimize → package → deploy.

---

## Step 0: Identify Target Platform(s)

All three major platforms use the **Agent Skills SKILL.md format**:

| Platform | File | Deploy Path | Notes |
|---|---|---|---|
| Claude Code | `SKILL.md` | `~/.claude/skills/<name>/` | Description-triggered, dynamic loading |
| OpenAI Codex | `SKILL.md` | `<repo>/<name>/` | Read at session start, supports references |
| GitHub Copilot | `SKILL.md` | `.github/skills/<name>/` or `~/.copilot/skills/<name>/` | Supports scripts and references |

**Exception — Google Gemini does NOT support SKILL.md:**

| Platform | File | Deploy Path | Notes |
|---|---|---|---|
| Gemini Code Assist / IDX | `GEMINI.md` | `GEMINI.md` (project root) or `.idx/airules.md` | Converted from SKILL.md |

Always write **one canonical SKILL.md first**. Only convert to GEMINI.md if Gemini is a target.

---

## Step 1: Capture Intent

Check the conversation for workflows already demonstrated. Extract intent from context first, then ask:

1. What should this skill enable the AI to do?
2. When should it activate? (what user phrases / file types / contexts)
3. What's the expected output format?
4. Which platform(s)?
5. Are outputs objectively verifiable? → set up test cases if yes

---

## Step 2: Interview and Research

Ask about edge cases, input/output formats, example files, success criteria. Don't write test prompts yet.

Platform constraints to probe:
- **Copilot**: supports SKILL.md natively in `.github/skills/`; also supports scripts and references
- **Codex**: reads SKILL.md via Agent Skills open standard; supports multi-file references
- **Gemini/IDX**: does NOT support SKILL.md — needs conversion to `GEMINI.md`; `.idx/dev.nix` for env config

---

## Step 3: Write the Skill

### Portable Skill Folder Structure

One folder, one format. Works on Claude Code, Codex, and Copilot:

```
my-skill/
├── SKILL.md            ← Portable (Claude Code + Codex + Copilot)
├── references/         ← Supporting docs (loaded on demand)
│   └── REFERENCE.md
├── scripts/            ← Reusable automation
│   └── run.sh
├── assets/             ← Templates, fonts, icons
│   └── template.txt
└── evals/
    └── evals.json
```

If Gemini is a target, generate `GEMINI.md` via `platform_adapter.py` (conversion only):
```
my-skill/
├── SKILL.md            ← Source of truth
├── GEMINI.md           ← Generated from SKILL.md (Gemini only)
└── ...
```

### SKILL.md Template (Portable — Claude Code + Codex + Copilot)

```markdown
---
name: skill-identifier
description: What it does + when to use it. Be explicit about contexts.
license: Apache-2.0
metadata:
  author: your-name
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Skill Name

## Purpose
Explain the task this skill handles.

## When to Use
Describe contexts, file types, or user phrases that should activate this skill.

## Instructions
1. Step one (with reasoning)
2. Step two
3. Step three

## Output Format
Describe expected output structure.

## References
See [reference guide](references/REFERENCE.md).

## Scripts
Use `scripts/run.sh` when the task needs automation.

## Examples
- Example prompt 1
- Example prompt 2
```

### GEMINI.md Template (Gemini only — generated from SKILL.md)

```markdown
# Gemini Code Assist Rules: [Skill Name]
## When These Rules Apply
## Instructions
## Expected Output
## Do Not
```

Note: GEMINI.md is always **generated** from SKILL.md via `platform_adapter.py`, never authored directly.

### Writing Principles

- **Imperative form**: "Do X" not "You should X"
- **Explain the why**: reasoned instructions beat arbitrary mandates
- **Stay general**: write for a million invocations, not just your test cases
- **Bundle repeated work**: if model writes same helper script every run, put it in `scripts/`
- **Keep under 500 lines**: use reference files for detail
- **No malware or deception**: skills must not exploit, mislead, or exfiltrate

---

## Step 4: Write Test Cases

After drafting, create 2-5 realistic test prompts. Share with user for approval.

Save to `evals/evals.json`:

```json
{
  "skill_name": "my-skill",
  "platform": "claude-code",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user prompt",
      "expected_output": "Description of success",
      "files": [],
      "assertions": []
    }
  ]
}
```

---

## Step 5: Run and Evaluate

One continuous sequence — don't stop partway.

**With subagents (Claude Code / Cowork):**

Spawn with-skill AND baseline runs in the same turn. Workspace layout:
```
<skill-name>-workspace/
  iteration-1/
    eval-0/
      with_skill/outputs/
      without_skill/outputs/
      eval_metadata.json
      timing.json
```

**Without subagents (Claude.ai):**

Run tests one at a time inline. Simulate platform reading behavior:
- Claude Code, Codex, Copilot: all read `SKILL.md` natively
- Gemini: read converted `GEMINI.md` as session context

Skip baseline runs. Present results in chat. Ask for feedback inline.

**While runs are in progress:** Draft assertions. Good assertions are objectively verifiable and descriptively named. Don't force assertions on subjective qualities.

**After runs complete:**
1. Grade each run → `grading.json` (fields: `text`, `passed`, `evidence`)
2. Aggregate → `python -m scripts.aggregate_benchmark <workspace>/iteration-N`
3. Launch viewer → `python eval-viewer/generate_review.py <workspace>/iteration-N`
4. If no viewer (Claude.ai / remote): present results inline, ask for feedback

---

## Step 6: Improve the Skill

After user feedback:

1. **Generalize** — fix root causes, not just symptoms from test cases
2. **Trim** — remove instructions that aren't pulling their weight
3. **Explain why** — convert MUST/NEVER into reasoned guidance
4. **Bundle scripts** — if model reinvents same helper repeatedly, move it to `scripts/`
5. **Re-convert Gemini** — if Gemini is a target, re-run `platform_adapter.py` to regenerate GEMINI.md from updated SKILL.md

Rerun all test cases in `iteration-N+1/`. Repeat until: user is happy, feedback is empty, or progress has plateaued.

---

## Step 7: Multi-Platform Deployment

Once SKILL.md is finalized, the same skill folder deploys to all platforms:

**→ Claude Code:** Install to `~/.claude/skills/<name>/` or use `npx skills add <repo> --skill <name>`.

**→ Copilot:** Copy skill folder to `.github/skills/<name>/` (project) or `~/.copilot/skills/<name>/` (personal). SKILL.md works as-is.

**→ Codex:** SKILL.md works as-is via the Agent Skills open standard. Place in repo or reference from AGENTS.md.

**→ Gemini (conversion required):** Gemini does NOT support SKILL.md. Convert:
```bash
python -m scripts.platform_adapter <skill-path> --platforms gemini
```
This generates `GEMINI.md` from your SKILL.md. Place at project root or `.idx/airules.md`.

Deploy to all platforms at once:
```bash
python -m scripts.platform_adapter <skill-path> --all
```

Package as distributable:
```bash
python -m scripts.package_skill <path/to/skill-folder>
```

---

## Step 8: Description Optimization (Claude Code only)

After the skill is stable, optimize the description to improve triggering accuracy.

Generate 20 trigger eval queries (8-10 should-trigger, 8-10 should-not-trigger). Make them realistic, specific, with context. Focus on near-misses for negative cases.

```json
[
  {"query": "specific realistic prompt", "should_trigger": true},
  {"query": "adjacent task that looks similar but should NOT trigger", "should_trigger": false}
]
```

Review with user, then run:
```bash
python -m scripts.run_loop \
  --eval-set <trigger-eval.json> \
  --skill-path <skill-path> \
  --model <current-model-id> \
  --max-iterations 5 \
  --verbose
```

Apply `best_description` to SKILL.md frontmatter. Note: this step only matters for Claude Code — other platforms don't use description-based triggering.

---

## Platform-Specific Notes

### Shared Format (Claude Code + Codex + Copilot)
All three platforms use Agent Skills `SKILL.md` with the same structure:
- YAML frontmatter with `name` and `description` (required), `license` (optional)
- Markdown body with sections: Purpose, When to Use, Instructions, Output Format, Examples
- Optional `references/`, `scripts/`, `assets/` subdirectories
- Supplementary files referenced via relative paths from SKILL.md

### Claude Code
- Full dynamic skill system: metadata always in context, SKILL.md loaded on trigger
- Install via `npx skills add <repo-url> --skill <skill-name>`
- Skills live in `~/.claude/skills/<name>/`
- Optional `dependencies` metadata field for required packages

### GitHub Copilot
- Project skills: `.github/skills/<name>/SKILL.md`
- Personal skills: `~/.copilot/skills/<name>/SKILL.md`
- Supports scripts and references alongside SKILL.md
- Description-based skill loading (like Claude Code)

### OpenAI Codex
- Reads SKILL.md via Agent Skills open standard
- Session-start loading; supports multi-file references
- Native subagent support

### Google Gemini Code Assist / Project IDX (NO SKILL.md support)
- Does NOT support SKILL.md — requires conversion to `GEMINI.md`
- `GEMINI.md` or `.idx/airules.md` for AI rules
- `.idx/dev.nix` for dev environment config
- Enterprise: `codeassist.yaml` for org-wide rules

---

## Claude.ai Adaptations

- Run test cases one at a time inline (no subagents)
- Skip quantitative benchmarking and baseline comparisons
- Skip description optimization (requires `claude -p` CLI)
- No browser/viewer: present results in conversation, ask for inline feedback
- Packaging still works: run `package_skill.py`, use `present_files` to share `.skill` file
- When updating existing skill: preserve original name, copy to `/tmp/` before editing

---

## Reference Files

- `references/schemas.md` — JSON schemas for all structured outputs
- `references/platform-formats.md` — Full format specs per platform
- `agents/grader.md` — How to evaluate assertions against outputs
- `agents/comparator.md` — Blind A/B comparison
- `agents/analyzer.md` — Why one version beat another

---

## The Loop

```
identify platform(s)
  → draft SKILL.md (one portable file)
    → test cases
      → run (parallel or sequential)
        → evaluate (viewer + assertions)
          → improve (generalize, trim, explain why)
            → repeat until satisfied
              → optimize description (Claude Code / Copilot)
                → deploy to platform paths
                  → convert to GEMINI.md (if Gemini target)
```
