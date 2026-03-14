#!/usr/bin/env python3
"""Mirror all canonical SKILL.md files to Claude and Copilot platform directories."""
import os
import shutil

BASE = "/Users/phumrin/Documents/Cubis Foundry"
SKILLS_DIR = os.path.join(BASE, "workflows/skills")
CLAUDE_DIR = os.path.join(BASE, "workflows/workflows/agent-environment-setup/platforms/claude/skills")
COPILOT_DIR = os.path.join(BASE, "workflows/workflows/agent-environment-setup/platforms/copilot/skills")

# Get all canonical skills (excluding special dirs)
EXCLUDE = {"_schema", "catalogs", "generated"}

skills = []
for entry in sorted(os.listdir(SKILLS_DIR)):
    full = os.path.join(SKILLS_DIR, entry)
    if os.path.isdir(full) and entry not in EXCLUDE:
        skill_file = os.path.join(full, "SKILL.md")
        if os.path.isfile(skill_file):
            skills.append(entry)

print(f"Found {len(skills)} canonical skills")

# Skip receiving-code-review if it doesn't exist (already handled by the check above)

created_claude = 0
created_copilot = 0

for skill in skills:
    src = os.path.join(SKILLS_DIR, skill, "SKILL.md")

    # Claude mirror
    claude_dest_dir = os.path.join(CLAUDE_DIR, skill)
    claude_dest = os.path.join(claude_dest_dir, "SKILL.md")
    if not os.path.isfile(claude_dest):
        os.makedirs(claude_dest_dir, exist_ok=True)
        shutil.copy2(src, claude_dest)
        created_claude += 1
        print(f"  Claude: {skill}")

    # Copilot mirror
    copilot_dest_dir = os.path.join(COPILOT_DIR, skill)
    copilot_dest = os.path.join(copilot_dest_dir, "SKILL.md")
    if not os.path.isfile(copilot_dest):
        os.makedirs(copilot_dest_dir, exist_ok=True)
        shutil.copy2(src, copilot_dest)
        created_copilot += 1
        print(f"  Copilot: {skill}")

print(f"\nCreated {created_claude} Claude mirrors and {created_copilot} Copilot mirrors")
print(f"Total skills with mirrors: {len(skills)}")
