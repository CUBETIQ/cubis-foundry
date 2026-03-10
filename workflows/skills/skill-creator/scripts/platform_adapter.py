 #!/usr/bin/env python3
"""
platform_adapter.py — Deploy a portable SKILL.md across platforms and convert
to GEMINI.md for Google Gemini (the only platform that doesn't support SKILL.md).

All three major platforms use the Agent Skills open standard (SKILL.md):
  - Claude Code    → ~/.claude/skills/<name>/SKILL.md
  - OpenAI Codex   → <repo>/<name>/SKILL.md (Agent Skills open standard)
  - GitHub Copilot → .github/skills/<name>/SKILL.md or ~/.copilot/skills/<name>/SKILL.md

Google Gemini uses its own format:
  - Google Gemini  → GEMINI.md (project root) or .idx/airules.md

Usage:
    python -m scripts.platform_adapter <skill-path> --deploy copilot codex
    python -m scripts.platform_adapter <skill-path> --convert gemini
    python -m scripts.platform_adapter <skill-path> --all
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


# ── Platform abstractions ──────────────────────────────────────────────────


class Platform(Enum):
    claude_code = "claude_code"
    openai_codex = "openai_codex"
    github_copilot = "github_copilot"
    google_gemini = "google_gemini"


@dataclass(frozen=True)
class PlatformCapabilities:
    name: str
    platform: Platform
    canonical_file: str
    file_location: str
    trigger_mechanism: str
    supports_skill_triggering: bool
    supports_scripts: bool
    supports_references: bool
    supports_dynamic_loading: bool
    supports_subagents: bool
    max_tokens: int
    env_config: str | None


@dataclass
class QueryResult:
    response: str
    duration_ms: int
    error: str | None


_CAPABILITIES: dict[Platform, PlatformCapabilities] = {
    Platform.claude_code: PlatformCapabilities(
        name="Claude Code",
        platform=Platform.claude_code,
        canonical_file="SKILL.md",
        file_location="~/.claude/skills/<skill-name>/SKILL.md",
        trigger_mechanism="Description-based dynamic loading",
        supports_skill_triggering=True,
        supports_scripts=True,
        supports_references=True,
        supports_dynamic_loading=True,
        supports_subagents=True,
        max_tokens=5000,
        env_config=None,
    ),
    Platform.openai_codex: PlatformCapabilities(
        name="OpenAI Codex",
        platform=Platform.openai_codex,
        canonical_file="SKILL.md",
        file_location="<repo>/<skill-name>/SKILL.md (Agent Skills open standard)",
        trigger_mechanism="Read at session start",
        supports_skill_triggering=False,
        supports_scripts=True,
        supports_references=True,
        supports_dynamic_loading=False,
        supports_subagents=True,
        max_tokens=3000,
        env_config=".codex/",
    ),
    Platform.github_copilot: PlatformCapabilities(
        name="GitHub Copilot",
        platform=Platform.github_copilot,
        canonical_file="SKILL.md",
        file_location=".github/skills/<name>/SKILL.md or ~/.copilot/skills/<name>/SKILL.md",
        trigger_mechanism="Description-based skill loading",
        supports_skill_triggering=True,
        supports_scripts=True,
        supports_references=True,
        supports_dynamic_loading=True,
        supports_subagents=False,
        max_tokens=3000,
        env_config=None,
    ),
    Platform.google_gemini: PlatformCapabilities(
        name="Google Gemini Code Assist / Project IDX",
        platform=Platform.google_gemini,
        canonical_file="GEMINI.md",
        file_location="GEMINI.md (project root) or .idx/airules.md",
        trigger_mechanism="Read at session start",
        supports_skill_triggering=False,
        supports_scripts=False,
        supports_references=False,
        supports_dynamic_loading=False,
        supports_subagents=False,
        max_tokens=2000,
        env_config=".idx/dev.nix",
    ),
}


def detect_platform() -> Platform:
    """Auto-detect the current platform from environment and file markers."""
    cwd = Path.cwd()
    if os.environ.get("CLAUDECODE") or (cwd / ".claude").is_dir():
        return Platform.claude_code
    if os.environ.get("CODEX_ENV") or (cwd / ".codex").is_dir():
        return Platform.openai_codex
    if (cwd / ".idx").is_dir():
        return Platform.google_gemini
    if (cwd / ".github" / "copilot-instructions.md").is_file():
        return Platform.github_copilot
    return Platform.claude_code


def get_capabilities(platform: Platform) -> PlatformCapabilities:
    """Return capability descriptor for the given platform."""
    return _CAPABILITIES[platform]


# ── Token estimation ────────────────────────────────────────────────────────


def estimate_tokens(text: str) -> int:
    """Rough token count (~4 chars per token)."""
    return len(text) // 4


def validate_token_budget(content: str, platform: Platform) -> tuple[bool, str]:
    """Check whether content fits the platform's recommended token budget."""
    caps = get_capabilities(platform)
    tokens = estimate_tokens(content)
    if tokens > caps.max_tokens:
        return False, (
            f"Content (~{tokens} tokens) exceeds {caps.name} budget "
            f"({caps.max_tokens} tokens). Consider trimming."
        )
    return True, (
        f"Content (~{tokens} tokens) within {caps.name} budget "
        f"({caps.max_tokens} tokens)"
    )


# ── SKILL.md parsing ────────────────────────────────────────────────────────


def parse_skill_text(text: str) -> dict:
    """Parse SKILL.md text into frontmatter + body sections.

    Handles fenced code blocks so that ``# `` / ``## `` lines inside
    code fences are not mistaken for real section headers.
    """
    fm_match = re.match(r'^---\n(.*?)\n---\n', text, re.DOTALL)
    frontmatter: dict[str, str] = {}
    body = text
    if fm_match:
        for line in fm_match.group(1).splitlines():
            if ':' in line and not line.startswith((' ', '\t')):
                k, _, v = line.partition(':')
                frontmatter[k.strip()] = v.strip()
        body = text[fm_match.end():]

    sections: dict[str, str] = {}
    current: str | None = None
    current_lines: list[str] = []
    in_code_block = False

    for line in body.splitlines():
        # Track fenced code blocks (``` or ~~~)
        stripped = line.strip()
        if stripped.startswith('```') or stripped.startswith('~~~'):
            in_code_block = not in_code_block
            if current:
                current_lines.append(line)
            continue

        if in_code_block:
            # Inside a code block — never treat as section header
            if current:
                current_lines.append(line)
            continue

        if line.startswith('## '):
            if current:
                sections[current] = '\n'.join(current_lines).strip()
            current = line[3:].strip()
            current_lines = []
        elif line.startswith('# '):
            if '__title__' not in sections:
                sections['__title__'] = line[2:].strip()
        else:
            if current:
                current_lines.append(line)

    if current:
        sections[current] = '\n'.join(current_lines).strip()

    return {'frontmatter': frontmatter, 'sections': sections, 'body': body}


def parse_skill_md(skill_path: Path) -> dict:
    """Parse a SKILL.md from a directory into frontmatter + body sections."""
    return parse_skill_text((skill_path / "SKILL.md").read_text(encoding="utf-8"))


# ── Helpers for platform-aware conversion ───────────────────────────────────


def _strip_script_references(text: str) -> str:
    """Remove references to scripts/ folder and script-execution instructions."""
    lines = text.splitlines()
    filtered = []
    for line in lines:
        if re.search(r'\bscripts/', line):
            continue
        if re.search(r'\b(run|execute|invoke)\s+.*\bscript\b', line, re.IGNORECASE):
            continue
        filtered.append(line)
    return '\n'.join(filtered)


def _truncate_to_budget(content: str, max_tokens: int) -> str:
    """Truncate content to fit within token budget, cutting at section boundaries."""
    max_chars = max_tokens * 4
    if len(content) <= max_chars:
        return content

    lines = content[:max_chars].splitlines()
    last_section_end = len(lines)
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].startswith('## '):
            last_section_end = i
            break

    truncated = '\n'.join(lines[:last_section_end])
    truncated += '\n\n<!-- Truncated to fit platform token budget -->\n'
    return truncated


_SCRIPT_SECTIONS = frozenset({
    'Helper Scripts', 'Reference Files', 'References', 'Scripts',
})


# ── Platform converters ────────────────────────────────────────────────────
#
# Claude Code, Codex, and Copilot all read the Agent Skills SKILL.md format
# natively — no conversion needed. Only Gemini requires a format conversion.
#
# For platforms that support SKILL.md, "export" means copying the skill folder
# to the platform-specific deployment path.


def to_gemini(parsed: dict, skill_name: str) -> str:
    """Generate GEMINI.md from parsed SKILL.md.

    Gemini is the only supported platform that does NOT use the Agent Skills
    SKILL.md format. It reads rules at session start from GEMINI.md.
    No scripts, no dynamic loading. Keep under ~2000 tokens.
    """
    sections = parsed['sections']
    caps = get_capabilities(Platform.google_gemini)

    lines = [f"# Gemini Code Assist Rules: {skill_name}", ""]

    if 'When to Use' in sections:
        lines += ["## When These Rules Apply", sections['When to Use'], ""]

    if 'Instructions' in sections:
        content = _strip_script_references(sections['Instructions'])
        lines += ["## Instructions", content, ""]

    if 'Output Format' in sections:
        lines += ["## Expected Output", sections['Output Format'], ""]

    if 'Examples' in sections:
        lines += ["## Examples", sections['Examples'], ""]

    # Include remaining non-script sections
    skip = {'When to Use', 'Instructions', 'Output Format', 'Examples', '__title__'}
    skip |= _SCRIPT_SECTIONS
    for key, val in sections.items():
        if key not in skip:
            content = _strip_script_references(val)
            if content.strip():
                lines += [f"## {key}", content, ""]

    lines += [
        "## Do Not",
        "- Do not act outside the described scope.",
        "- If a request falls outside this skill's purpose, say so clearly.",
        "",
    ]

    result = '\n'.join(lines)

    within, msg = validate_token_budget(result, Platform.google_gemini)
    if not within:
        result = _truncate_to_budget(result, caps.max_tokens)
        print(f"[gemini] Warning: {msg}", file=sys.stderr)

    return result


# ── Cross-platform query execution ─────────────────────────────────────────


def run_query(
    query: str,
    skill_name: str,
    skill_description: str,
    skill_body: str,
    platform: Platform,
    model: str | None = None,
    timeout: int = 60,
) -> QueryResult:
    """Run a query with platform-formatted skill context (simulated).

    For Claude Code, callers should use run_eval.py directly (trigger detection).
    For other platforms, this simulates the platform by converting the skill to
    the target format and injecting it as context via ``claude -p``.
    """
    parsed = parse_skill_text(skill_body)

    if platform == Platform.google_gemini:
        # Gemini is the only platform needing format conversion
        context = to_gemini(parsed, skill_name)
        platform_label = "Gemini Code Assist"
    else:
        # Claude Code, Codex, and Copilot all read SKILL.md natively
        context = skill_body
        platform_label = get_capabilities(platform).name

    simulation_prompt = (
        f"You are a {platform_label} coding assistant with the following "
        f"instructions loaded at session start. Follow them precisely.\n\n"
        f"<loaded_instructions>\n{context}\n</loaded_instructions>\n\n"
        f"User request:\n{query}"
    )

    cmd = ["claude", "-p", "--output-format", "text"]
    if model:
        cmd.extend(["--model", model])

    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    start = time.time()

    try:
        result = subprocess.run(
            cmd,
            input=simulation_prompt,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        duration_ms = int((time.time() - start) * 1000)
        if result.returncode != 0:
            return QueryResult(
                response="",
                duration_ms=duration_ms,
                error=f"Exit {result.returncode}: {result.stderr[:500]}",
            )
        return QueryResult(
            response=result.stdout,
            duration_ms=duration_ms,
            error=None,
        )
    except subprocess.TimeoutExpired:
        return QueryResult(
            response="",
            duration_ms=int((time.time() - start) * 1000),
            error=f"Timeout after {timeout}s",
        )
    except FileNotFoundError:
        return QueryResult(
            response="",
            duration_ms=int((time.time() - start) * 1000),
            error="'claude' CLI not found. Install Claude Code or set PATH.",
        )
    except Exception as e:
        return QueryResult(
            response="",
            duration_ms=int((time.time() - start) * 1000),
            error=str(e),
        )


# ── Description improvement (universal) ────────────────────────────────────


def improve_description_universal(
    skill_name: str,
    skill_content: str,
    current_description: str,
    eval_results: dict,
    history: list[dict],
    model: str | None,
    platform: Platform,
    log_dir: Path | None = None,
    iteration: int | None = None,
) -> str:
    """Improve skill description, delegating to the platform-appropriate strategy.

    Claude Code: uses existing trigger-focused improve_description.
    Other platforms: uses quality-based improvement via claude -p.
    """
    caps = get_capabilities(platform)

    if caps.supports_skill_triggering:
        from scripts.improve_description import improve_description
        return improve_description(
            skill_name=skill_name,
            skill_content=skill_content,
            current_description=current_description,
            eval_results=eval_results,
            history=history,
            model=model or "claude-sonnet-4-20250514",
            log_dir=log_dir,
            iteration=iteration,
        )

    # Quality-based improvement for non-Claude platforms
    failed = [r for r in eval_results.get("results", []) if not r.get("pass")]
    summary = eval_results.get("summary", {})

    prompt = (
        f'You are improving instructions for a {caps.name} skill called '
        f'"{skill_name}".\n\n'
        f"Platform: {caps.canonical_file}\n"
        f"Loading: {caps.trigger_mechanism}\n"
        f"Token budget: ~{caps.max_tokens} tokens\n\n"
        f'Current description:\n"{current_description}"\n\n'
        f"Results: {summary.get('passed', 0)}/{summary.get('total', 0)} passed\n"
    )

    if failed:
        prompt += "\nFAILED tests:\n"
        for r in failed:
            q = r.get("query", r.get("prompt", ""))[:100]
            prompt += f'  - "{q}"\n'
            if r.get("avg_score") is not None:
                prompt += f"    Score: {r['avg_score']:.0%}\n"

    if history:
        prompt += "\nPrevious attempts (try something different):\n"
        for h in history[-3:]:
            desc = h.get("description", "")[:100]
            prompt += (
                f'  "{desc}..." → '
                f"{h.get('passed', 0)}/{h.get('total', 0)}\n"
            )

    prompt += (
        f"\nSkill content:\n{skill_content[:2000]}\n\n"
        f"Write an improved description (under 1024 characters) for "
        f"{caps.name} that will produce better responses. Focus on clarity, "
        f"specificity, and actionable instructions.\n"
        f"Respond with only the description in <new_description> tags."
    )

    try:
        cmd = ["claude", "-p", "--output-format", "text"]
        if model:
            cmd.extend(["--model", model])
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
        result = subprocess.run(
            cmd, input=prompt, capture_output=True, text=True,
            env=env, timeout=300,
        )
        text = result.stdout
        match = re.search(
            r"<new_description>(.*?)</new_description>", text, re.DOTALL,
        )
        description = (
            match.group(1).strip().strip('"') if match
            else text.strip().strip('"')
        )

        if len(description) > 1024:
            description = description[:1020] + "..."

        return description
    except Exception as e:
        print(
            f"Warning: improve_description_universal failed: {e}",
            file=sys.stderr,
        )
        return current_description


# ── CLI export ──────────────────────────────────────────────────────────────


# ── Deployment & export ─────────────────────────────────────────────────────
#
# Claude Code, Codex, and Copilot all read the same SKILL.md file. "Export"
# for those platforms means copying the skill folder to the right path.
# Only Gemini needs an actual format conversion.


def _copy_skill_folder(skill_path: Path, dest: Path):
    """Copy the entire skill folder (SKILL.md + references/ + scripts/ + assets/)."""
    import shutil
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(skill_path, dest, dirs_exist_ok=True)


def export_platform(skill_path: Path, platform: str):
    """Export / deploy a skill to a specific platform."""
    parsed = parse_skill_md(skill_path)
    skill_name = parsed['frontmatter'].get('name', skill_path.name)

    if platform == 'copilot':
        # Copilot reads SKILL.md from .github/skills/<name>/ (project)
        # or ~/.copilot/skills/<name>/ (personal)
        dest = skill_path.parent / '.github' / 'skills' / skill_name
        dest.mkdir(parents=True, exist_ok=True)
        _copy_skill_folder(skill_path, dest)
        content = (skill_path / 'SKILL.md').read_text(encoding='utf-8')
        within, msg = validate_token_budget(content, Platform.github_copilot)
        status = "OK" if within else "OVER BUDGET"
        print(f"[copilot] Deployed: {dest}/SKILL.md ({status})")
        if not within:
            print(f"[copilot] Warning: {msg}", file=sys.stderr)
        print(f"[copilot] Personal alt: ~/.copilot/skills/{skill_name}/SKILL.md")

    elif platform == 'codex':
        # Codex supports SKILL.md via the Agent Skills open standard.
        # The skill folder works as-is — just validate token budget.
        content = (skill_path / 'SKILL.md').read_text(encoding='utf-8')
        within, msg = validate_token_budget(content, Platform.openai_codex)
        status = "OK" if within else "OVER BUDGET"
        print(f"[codex]  SKILL.md ready as-is ({status})")
        if not within:
            print(f"[codex]  Warning: {msg}", file=sys.stderr)
        print(f"[codex]  Place skill folder in repo root or reference from AGENTS.md")

    elif platform == 'claude':
        # Claude Code reads SKILL.md from ~/.claude/skills/<name>/
        content = (skill_path / 'SKILL.md').read_text(encoding='utf-8')
        within, msg = validate_token_budget(content, Platform.claude_code)
        status = "OK" if within else "OVER BUDGET"
        print(f"[claude] SKILL.md ready ({status})")
        if not within:
            print(f"[claude] Warning: {msg}", file=sys.stderr)
        print(f"[claude] Install: npx skills add <repo> --skill {skill_name}")
        print(f"[claude] Or copy to: ~/.claude/skills/{skill_name}/")

    elif platform == 'gemini':
        # Gemini does NOT support SKILL.md — convert to GEMINI.md
        content = to_gemini(parsed, skill_name)
        out_path = skill_path / 'GEMINI.md'
        out_path.write_text(content, encoding='utf-8')
        within, msg = validate_token_budget(content, Platform.google_gemini)
        status = "OK" if within else "OVER BUDGET"
        print(f"[gemini] Converted: {out_path} ({status})")
        if not within:
            print(f"[gemini] Warning: {msg}", file=sys.stderr)
        print(f"[gemini] Note: Gemini does not support the SKILL.md format")

    else:
        print(f"Unknown platform: {platform}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description='Deploy SKILL.md to platforms or convert for Gemini',
    )
    parser.add_argument('skill_path', help='Path to the skill directory')
    parser.add_argument(
        '--platforms', nargs='+',
        choices=['copilot', 'codex', 'claude', 'gemini'],
        help='Platforms to deploy/convert for',
    )
    parser.add_argument(
        '--all', action='store_true',
        help='Deploy to all platforms (Copilot, Codex, Claude + convert Gemini)',
    )
    args = parser.parse_args()

    skill_path = Path(args.skill_path)
    if not (skill_path / 'SKILL.md').exists():
        print(f"Error: No SKILL.md found in {skill_path}", file=sys.stderr)
        sys.exit(1)

    platforms = (
        ['copilot', 'codex', 'claude', 'gemini'] if args.all
        else (args.platforms or [])
    )

    if not platforms:
        print("Specify --platforms or --all", file=sys.stderr)
        sys.exit(1)

    print(f"Portable format: SKILL.md (works on Claude Code, Codex, Copilot)")
    print(f"Conversion needed: Gemini only (SKILL.md → GEMINI.md)")
    print()

    for platform in platforms:
        export_platform(skill_path, platform)

    print("\nDone. Review output before committing.")


if __name__ == '__main__':
    main()
