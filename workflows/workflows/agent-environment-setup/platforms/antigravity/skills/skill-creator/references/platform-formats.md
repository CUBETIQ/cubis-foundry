# Platform Format Reference

Detailed file format specifications for each supported platform.

---

## Claude Code — SKILL.md

**Location:** `~/.claude/skills/<skill-name>/SKILL.md`
**Install:** `npx skills add <repo> --skill <name>`
**Trigger:** Description-based; Claude reads description and decides whether to load the full skill

```
---
name: my-skill
description: One paragraph. Include what it does AND when to trigger. Be explicit.
compatibility:
  tools: [bash, python]   # optional
---

# Skill Title

Body instructions here. Imperative form. Explain the why.

## When to Use
## Instructions
## Output Format
## Examples
```

**Tips:**
- Keep SKILL.md under 500 lines
- Put large docs in `references/` and point to them from SKILL.md
- Scripts in `scripts/` can run without being loaded into context
- Description is the #1 trigger — write it to be "pushy"

---

## OpenAI Codex — AGENTS.md

**Location:** Repo root (`AGENTS.md`) or `.codex/instructions.md`
**Auto-detection:** Codex looks for `AGENTS.md` at the working directory root
**Trigger:** Loaded at session start; always active for that session

```markdown
# Agent Instructions: [Skill Name]

## Purpose
Brief description of what this agent configuration enables.

## Behavior Rules
Numbered or bulleted rules. Always include the reason behind each rule.

- Always X because Y
- When you see Z, do W (reason: ...)

## Output Format
Describe the expected structure of outputs.
Specify file names, formats, encodings where relevant.

## Limitations
What this agent should NOT do.
What to do if the user asks for something outside scope.

## References
- See `docs/style-guide.md` for formatting rules
- See `schemas/output.json` for output structure
```

**Tips:**
- Codex respects Markdown headers as logical sections
- Reference other files with relative paths — Codex can read them
- Keep the main file focused; delegate detail to referenced docs
- Subagent spawning is native in Codex

---

## GitHub Copilot — copilot-instructions.md

**Location:** `.github/copilot-instructions.md`
**Scope:** Workspace-scoped; applies to all Copilot interactions in the repo
**Trigger:** Always active — no triggering needed or possible

```markdown
# GitHub Copilot Instructions

## [Skill/Topic Name]

When working on [context/file type/task], follow these rules:

1. [Rule with brief reason]
2. [Rule with brief reason]

### Output Format
[Description of expected output structure]

### Avoid
- [Anti-pattern 1]
- [Anti-pattern 2]

## [Another Topic]
...
```

**Tips:**
- Instructions are always active — don't make them too restrictive globally
- Use H2 sections to scope rules to specific contexts
- Keep total file under ~1000 tokens for reliability
- No dynamic loading; no scripts; just persistent context
- Works in VS Code, JetBrains, GitHub.com, and Copilot Chat

---

## Google Gemini Code Assist / Project IDX — GEMINI.md

**Location:** `GEMINI.md` (project root) or `.idx/airules.md`
**Enterprise:** `codeassist.yaml` for org-wide rules (Google Cloud)
**Trigger:** Loaded at session start; always active for the project

```markdown
# Gemini Code Assist Rules: [Skill Name]

## When These Rules Apply
[Describe the context: specific file types, tasks, user phrases]

## Instructions
[Steps with reasoning. Imperative form.]

## Expected Output
[Format, file types, naming conventions]

## Do Not
[Explicit exclusions]
```

**For Project IDX — .idx/dev.nix:**
```nix
{ pkgs, ... }: {
  packages = [ pkgs.python311 pkgs.nodejs ];
  
  idx.extensions = [
    "ms-python.python"
    "esbenp.prettier-vscode"
  ];

  idx.workspace.onCreate = {
    npm-install = "npm install";
  };

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev"];
        manager = "web";
      };
    };
  };
}
```

**Tips:**
- `GEMINI.md` is read at session start — keep it concise
- Project IDX uses Nix for reproducible environments; document dependencies clearly
- Gemini Code Assist in Google Cloud Workstations supports org-level `codeassist.yaml`
- IDX AI rules are per-project; no global skill loading

---

## Cross-Platform Conversion Cheatsheet

| Concept | Claude Code | Codex | Copilot | Gemini/IDX |
|---|---|---|---|---|
| Main file | `SKILL.md` | `AGENTS.md` | `.github/copilot-instructions.md` | `GEMINI.md` |
| Trigger | Description field | Session start | Always active | Session start |
| Scripts | `scripts/` folder | Reference in AGENTS.md | Not supported | Not supported |
| References | `references/` folder | Relative file paths | Not supported | Not supported |
| Dynamic loading | Yes | Partial | No | No |
| Subagents | Via skill system | Native | No | No |
| Env config | N/A | `.codex/` | N/A | `.idx/dev.nix` |

