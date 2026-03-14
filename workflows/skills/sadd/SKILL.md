---
name: sadd
description: "Use when extracting testable specs from requirements, generating tests from specs, verifying implementations against specs, and tracing requirements to coverage."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---

# Spec-Aware Driven Development (SADD)

## Purpose

Bridge the gap between requirements and implementation by extracting machine-verifiable specifications from natural language requirements, generating tests that encode those specifications, and continuously verifying that the implementation satisfies every stated requirement. SADD prevents the common failure mode where code is "done" but does not match what was specified.

## When to Use

- Extracting testable specifications from a requirements document, user story, or PRD
- Generating test cases directly from specifications before writing implementation code
- Verifying that an existing implementation satisfies a specification
- Building a traceability matrix from requirements to tests to code
- Identifying specification gaps where requirements are ambiguous or incomplete
- Auditing test coverage against requirements (not just code coverage)
- Onboarding to a codebase by understanding what it is supposed to do vs what it actually does
- Preparing for compliance audits that require requirements traceability

## Instructions

1. **Gather the specification source** — collect all requirements documents, user stories, acceptance criteria, API contracts, and design documents, because SADD cannot extract specs from what it cannot see.
2. **Mine specifications from requirements** — extract every testable assertion from the source material using the GIVEN-WHEN-THEN format, because natural language requirements contain implicit conditions that must be made explicit before they can be tested.
3. **Classify each specification** — tag each spec as functional, non-functional (performance, security, accessibility), or constraint (business rule, regulatory), because different spec types require different testing strategies and tools.
4. **Identify specification gaps** — flag requirements that are ambiguous, contradictory, or untestable, and generate clarifying questions, because building against incomplete specs guarantees rework.
5. **Generate test skeletons from specs** — create one test case per specification with the assertion structure defined but implementation left empty, because writing tests first forces the specification to be concrete and verifiable.
6. **Map specs to implementation boundaries** — identify which modules, functions, or endpoints each specification maps to, because knowing where the spec should be satisfied guides both implementation and test placement.
7. **Implement against the spec** — write code to make each test pass, one specification at a time, because incremental implementation against explicit specs prevents scope creep and ensures every requirement is addressed.
8. **Verify implementation coverage** — run the full test suite and map passing tests back to specifications, identifying any spec without a passing test, because code coverage measures lines executed while spec coverage measures requirements satisfied.
9. **Check for specification drift** — compare the current implementation behavior against the original specs to detect features that have diverged from requirements, because drift accumulates silently and creates a gap between what the system does and what stakeholders expect.
10. **Build the traceability matrix** — create a mapping from each requirement to its specifications, tests, and implementing code, because traceability is required for compliance audits and is valuable for impact analysis when requirements change.
11. **Validate non-functional specs** — verify performance thresholds, security requirements, and accessibility standards with appropriate tooling (k6, OWASP ZAP, axe), because functional tests alone do not prove the system meets quality attributes.
12. **Iterate on spec changes** — when requirements change, update the specification first, then update the tests, then update the implementation, because changing code without updating specs breaks traceability and hides requirement drift.
13. **Document coverage gaps** — maintain a living document of specifications that cannot be tested automatically and require manual verification, because some requirements (usability, aesthetic quality) resist automation but still need verification.
14. **Use agents for complex workflows** — delegate specification mining to `agents/spec-miner.md` and implementation verification to `agents/verifier.md`, because specialized agents produce more thorough results than a single generalist pass.

## Output Format

When performing SADD, provide:

1. **Specification registry** — numbered list of every extracted spec in GIVEN-WHEN-THEN format with classification tags
2. **Gap analysis** — list of ambiguous, contradictory, or untestable requirements with clarifying questions
3. **Test plan** — test skeletons mapped to specifications, grouped by module or feature
4. **Traceability matrix** — table mapping requirement ID to spec ID to test ID to implementing code
5. **Coverage report** — percentage of specs with passing tests, with explicit list of uncovered specs

## References

| File | Purpose |
|------|---------|
| `references/spec-mining.md` | Techniques for extracting testable specifications from natural language requirements |
| `references/test-generation.md` | Patterns for generating test cases from specifications across frameworks |
| `references/verification.md` | Strategies for verifying implementation against specifications and detecting drift |
| `references/coverage-mapping.md` | Building and maintaining traceability matrices and spec coverage reports |
| `agents/spec-miner.md` | Agent that extracts structured specifications from requirements documents |
| `agents/verifier.md` | Agent that validates implementation against extracted specifications |
