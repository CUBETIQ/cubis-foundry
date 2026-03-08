#!/usr/bin/env python3
"""
Validate a Foundry skill package without external dependencies.
"""

import re
import sys
from pathlib import Path

MAX_SKILL_NAME_LENGTH = 64
ALLOWED_KEYS = {
    "name",
    "description",
    "license",
    "allowed-tools",
    "metadata",
    "compatibility",
}
SIDECAR_DIRS = {"references", "steering", "templates"}


def extract_frontmatter(markdown: str):
    match = re.match(r"^---\n(.*?)\n---\n?", markdown, re.DOTALL)
    if not match:
        return None, markdown
    return match.group(1), markdown[match.end():]


def parse_top_level_keys(frontmatter: str):
    keys = []
    values = {}
    for line in frontmatter.splitlines():
        if not line or line.startswith((" ", "\t")):
            continue
        match = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", line)
        if not match:
            continue
        key = match.group(1)
        raw_value = match.group(2).strip()
        keys.append(key)
        values[key] = raw_value.strip("\"'")
    return keys, values


def extract_markdown_targets(markdown: str):
    stripped = re.sub(r"```[\s\S]*?```", "", markdown)
    return [match.group(1).strip() for match in re.finditer(r"\[[^\]]+\]\(([^)]+)\)", stripped)]


def validate(skill_dir: Path):
    errors = []
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return ["SKILL.md not found"]

    content = skill_md.read_text(encoding="utf8")
    frontmatter, _body = extract_frontmatter(content)
    if not frontmatter:
        return ["SKILL.md is missing YAML frontmatter"]

    keys, values = parse_top_level_keys(frontmatter)
    unexpected = sorted(set(keys) - ALLOWED_KEYS)
    if unexpected:
        errors.append(
            "Unexpected frontmatter keys: " + ", ".join(unexpected)
        )

    name = values.get("name", "").strip()
    description = values.get("description", "").strip()
    if not name:
        errors.append("Missing name in frontmatter")
    elif not re.fullmatch(r"[a-z0-9-]+", name):
        errors.append("name must be lowercase hyphen-case")
    elif "--" in name or name.startswith("-") or name.endswith("-"):
        errors.append("name cannot start/end with '-' or contain consecutive hyphens")
    elif len(name) > MAX_SKILL_NAME_LENGTH:
        errors.append(
            f"name is too long ({len(name)} > {MAX_SKILL_NAME_LENGTH})"
        )

    if not description:
        errors.append("Missing description in frontmatter")

    if (skill_dir / "POWER.md").exists():
        errors.append("POWER.md must not exist")

    top_level_markdown = sorted(
        item.name
        for item in skill_dir.iterdir()
        if item.is_file() and item.suffix == ".md"
    )
    extras = [name for name in top_level_markdown if name != "SKILL.md"]
    if extras:
        errors.append(
            "Extra top-level markdown files found: " + ", ".join(extras)
        )

    markdown_files = [skill_md]
    for folder_name in SIDECAR_DIRS:
        folder = skill_dir / folder_name
        if not folder.exists():
            continue
        markdown_files.extend(sorted(folder.rglob("*.md")))

    for markdown_file in markdown_files:
        text = markdown_file.read_text(encoding="utf8")
        if markdown_file != skill_md and not text.strip():
            errors.append(f"{markdown_file.relative_to(skill_dir)} is empty")
        for target in extract_markdown_targets(text):
            if target.startswith(("http://", "https://", "#", "mailto:", "/")):
                continue
            target_path = (markdown_file.parent / target.split("#")[0].split("?")[0]).resolve()
            if not target_path.exists():
                errors.append(
                    f"{markdown_file.relative_to(skill_dir)} references missing file {target}"
                )
                continue
            if target_path.suffix == ".md" and not target_path.read_text(encoding="utf8").strip():
                errors.append(
                    f"{markdown_file.relative_to(skill_dir)} references empty markdown file {target}"
                )

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        return 1

    skill_dir = Path(sys.argv[1]).resolve()
    if not skill_dir.exists() or not skill_dir.is_dir():
        print(f"Skill directory not found: {skill_dir}")
        return 1

    errors = validate(skill_dir)
    if errors:
        print("Skill validation failed:")
        for item in errors:
            print(f"- {item}")
        return 1

    print("Skill is valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
