## Gemini Platform Notes

- Use `activate_skill` to invoke skills by name from Gemini CLI or Gemini Code Assist.
- Skill files are stored under `.gemini/skills/` in the project root.
- Gemini does not support `context: fork` — all skill execution is inline.
- User arguments are passed as natural language in the activation prompt.
- Reference files are loaded relative to the skill directory under `.gemini/skills/<skill-id>/`.
