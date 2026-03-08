# Research Benchmarks

Use this reference when rebuilding a Foundry skill from external examples.

## Primary benchmark sources

- Anthropic `skills` repo for concise skill-package structure and lifecycle discipline.
- OpenAI `skills` repo for catalog tiering and curated/system packaging patterns.
- GitHub Copilot skill docs for repository-aware behavior and supported surface constraints.
- Agent Skills spec for metadata-first portability expectations.
- Public repos such as Vercel Agent Skills for narrow specialist packaging.

## What to extract

- sharp descriptions that trigger reliably
- narrow task boundaries
- numbered procedures
- optional helper scripts for deterministic repetition
- sidecars for variant details

## What not to copy

- platform-specific syntax that belongs in a generator
- vendor brand language
- repo assumptions, file paths, or tool bindings that are not true in Foundry
- large narrative explanations that bloat context

## Rewrite checklist

1. Identify the one reusable pattern worth keeping.
2. Restate the trigger boundary in Foundry terms.
3. Remove vendor-only implementation details from the canonical root.
4. Move platform-specific notes into references if they still matter.
5. Validate the result against Foundry packaging and route rules.
