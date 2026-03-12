# Multi-Round Research Loop

Load this when the research task is broad, unstable, contested, or likely to have conflicting public sources — or when the user explicitly asks for deep or latest research.

## The Core Principle

Your job is to find what is _missing_, not just summarize the first page of results. Stop when remaining uncertainty is low-impact or explicitly reported back to the user.

---

## The Loop

### Round 1: Define and search broadly

1. **Narrow the question** — State the most specific version of what you're trying to find. Vague questions produce vague results.
2. **Search** — Run initial queries across the most likely sources (official docs, engineering blogs, GitHub repos, research papers as appropriate).
3. **Record gaps** — What did this pass _not_ answer? What's contradictory? What's suspiciously absent?

### Round 2: Target the gaps

4. **Search directly for the missing facts** — Use specific, targeted queries (not broad topic queries). Prefer: official docs > primary source blog > authoritative community reference > general article.
5. **Search for contradictions** — If two sources disagree, search specifically for why. Age, version differences, and context often explain it.
6. **Seek counterexamples** — Actively search for "X doesn't work", "X is wrong", "problems with X" — not just confirmation.

### Round 3: Corroborate and synthesize

7. **Cross-verify** unstable claims against at least one independent source.
8. **Rank sources** by directness (primary > secondary > tertiary), recency (newer > older for fast-moving topics), and authority (official > community > anecdotal).
9. **Write the evidence table** — Track what you found, not just conclusions:

| Fact    | Source       | Confidence          | Open question            |
| ------- | ------------ | ------------------- | ------------------------ |
| [Claim] | [URL or doc] | High / Medium / Low | [What's still uncertain] |

---

## Stop Rule

Stop when:

- Remaining uncertainty is low-impact (won't change the recommendation)
- OR the question is genuinely unresolvable from public sources (report this explicitly)
- OR you've completed 3 rounds without new signal (diminishing returns — report what's known and what's not)

Do NOT stop after one source when the claim is unstable, contested, or from a secondary source.

---

## Output Format

Separate clearly:

- **Sourced facts** — you have direct evidence
- **Informed inference** — logically follows from evidence but not directly stated
- **Unresolved gaps** — you searched and didn't find it; note what's unknown

Do not present inference as fact. Do not present absence of evidence as evidence of absence.

---

## Common Research Failure Modes

| Failure                               | Fix                                                |
| ------------------------------------- | -------------------------------------------------- |
| Stopping at first result              | Check at least 2-3 sources for any unstable claim  |
| Only finding confirmation             | Actively search for counterexamples and criticisms |
| Treating recent = correct             | Cross-check recency with authority and context     |
| Vague queries returning vague results | Restate the question as a specific, narrow query   |
| Reporting uncertainty as fact         | Use "inference" or "unknown" tags explicitly       |
| Burying the answer in context         | Lead with the finding; evidence follows            |

---

## Sub-Agent Reader Test

After completing research, if the output will be used by another agent or handed to a human without context:

- Pass the research summary to a fresh sub-agent with no conversation history
- Ask: "What is the main finding?", "What is still uncertain?", "What sources support the key claims?"
- If the fresh reader gets it wrong, the synthesis has context bleed — revise before delivery
