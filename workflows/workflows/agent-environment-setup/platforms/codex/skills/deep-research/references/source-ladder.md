# Source Ladder

## Goal

Use the smallest amount of external research that still produces a decision-ready answer. Keep the evidence traceable and ordered by trust.

## 1. Repo / Local Evidence First

Start by inspecting:

- application code and tests
- README files and internal docs
- generated workflow or skill assets
- lockfiles, config files, and package manifests
- existing integration code and migration history

If the repo already answers the question, stop there. Do not browse externally just because web research feels safer.

## 2. Primary External Sources

Use these next:

- official vendor docs
- upstream repositories and release notes
- standards bodies and reference specs
- maintainer-authored examples

Prefer sources that expose:

- exact feature names
- current version constraints
- config formats
- dates or changelog context

When the topic is time-sensitive, capture the date you verified the source and the version or doc page involved.

## 3. Secondary / Community Sources

Use these only after primary evidence:

- Reddit threads
- issue comments
- independent blog posts
- forum discussions
- third-party comparison articles

Community evidence is useful for:

- practical gotchas
- migration pain points
- missing-doc workarounds
- real-world adoption patterns

Community evidence is not enough on its own for authoritative claims about product behavior, supported configuration, or security guarantees.

## 4. Conflict Handling

When sources disagree:

1. Prefer repo evidence for the current codebase state.
2. Prefer official docs over community claims for product behavior.
3. Prefer newer dated material when the sources cover the same feature.
4. If the conflict remains unresolved, report it as a gap instead of guessing.

## 5. Evidence Labels

Use these labels in research output:

- **Verified fact** — backed by repo evidence or a primary source
- **Secondary evidence** — backed only by community or indirect sources
- **Inference** — reasoned conclusion not directly stated by a source
- **Gap** — could not be verified confidently

## 6. Stop Conditions

Stop researching when:

- the decision is already clear
- new sources only repeat the same point
- the remaining uncertainty is small and clearly documented
- the task should move into implementation or planning
