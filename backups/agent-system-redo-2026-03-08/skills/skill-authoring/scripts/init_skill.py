#!/usr/bin/env python3
"""
Scaffold a new Foundry canonical skill.

Usage:
  python init_skill.py <skill-name> [--path workflows/skills] [--resources scripts,references]
"""

import argparse
import re
import sys
from pathlib import Path

ALLOWED_RESOURCES = {"scripts", "references", "steering", "templates", "assets"}
MAX_SKILL_NAME_LENGTH = 64


def normalize_skill_name(raw_name: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", raw_name.strip().lower())
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized


def title_case(skill_name: str) -> str:
    return " ".join(part.capitalize() for part in skill_name.split("-") if part)


def parse_resources(raw_resources: str) -> list[str]:
    if not raw_resources:
        return []
    resources = []
    seen = set()
    for item in raw_resources.split(","):
        value = item.strip()
        if not value:
            continue
        if value not in ALLOWED_RESOURCES:
            allowed = ", ".join(sorted(ALLOWED_RESOURCES))
            raise SystemExit(f"Unknown resource type '{value}'. Allowed: {allowed}")
        if value not in seen:
            resources.append(value)
            seen.add(value)
    return resources


def skill_template(skill_name: str) -> str:
    skill_title = title_case(skill_name)
    return f"""---
name: "{skill_name}"
description: "Use when [TODO: describe the task trigger, expected files or outputs, and clear non-goals]."
---

# {skill_title}

## Overview

[TODO: Add a short description of what this skill enables.]

## When to Use

- [TODO]

## When Not to Use

- [TODO]

## Core Workflow

1. [TODO]
2. [TODO]
3. [TODO]

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/example.md` | Replace or remove this row after creating real sidecar docs. |

## Rules

- Keep `SKILL.md` concise and move detailed variants to sidecar files.
- Keep links relative to the skill root.
- Do not add `POWER.md`.
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a Foundry canonical skill")
    parser.add_argument("skill_name", help="Requested skill name")
    parser.add_argument(
        "--path",
        default="workflows/skills",
        help="Root directory that will contain the new skill",
    )
    parser.add_argument(
        "--resources",
        default="references",
        help="Comma-separated optional folders to create",
    )
    args = parser.parse_args()

    skill_name = normalize_skill_name(args.skill_name)
    if not skill_name:
        raise SystemExit("Skill name normalized to an empty value")
    if len(skill_name) > MAX_SKILL_NAME_LENGTH:
        raise SystemExit(
            f"Skill name '{skill_name}' is too long ({len(skill_name)} > {MAX_SKILL_NAME_LENGTH})"
        )

    target_root = Path(args.path).resolve()
    skill_dir = target_root / skill_name
    if skill_dir.exists():
        raise SystemExit(f"Target skill already exists: {skill_dir}")

    resources = parse_resources(args.resources)
    skill_dir.mkdir(parents=True, exist_ok=False)
    (skill_dir / "SKILL.md").write_text(skill_template(skill_name), encoding="utf8")

    for resource in resources:
        resource_dir = skill_dir / resource
        resource_dir.mkdir(parents=True, exist_ok=True)
        if resource == "references":
            (resource_dir / "example.md").write_text(
                "# Example Reference\n\nReplace or remove this file once you add real sidecar documentation.\n",
                encoding="utf8",
            )

    print(f"[OK] Created skill scaffold: {skill_dir}")
    print("[NEXT] Replace TODO sections in SKILL.md")
    print("[NEXT] Add real sidecar files or remove placeholder reference rows")
    return 0


if __name__ == "__main__":
    sys.exit(main())
