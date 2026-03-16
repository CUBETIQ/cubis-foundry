# Workflow Prompt: /mobile

Drive mobile implementation decisions for Flutter/cross-platform behavior and reliability.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/mobile.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `expo-app`, `react-native`, `stitch`, `frontend-design`, `swift-best-practices`, `kotlin-best-practices`.
- Local skill file hints if installed: `.github/skills/expo-app/SKILL.md`, `.github/skills/react-native/SKILL.md`, `.github/skills/stitch/SKILL.md`, `.github/skills/frontend-design/SKILL.md`, `.github/skills/swift-best-practices/SKILL.md`, `.github/skills/kotlin-best-practices/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.
