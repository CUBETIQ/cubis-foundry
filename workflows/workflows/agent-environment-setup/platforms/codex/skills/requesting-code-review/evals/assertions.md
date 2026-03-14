# Requesting Code Review Eval Assertions

## Eval 1: PR Description Quality

This eval tests whether the skill produces a well-structured PR description with sufficient context, risk assessment, testing details, and review guidance for a feature change that touches multiple areas.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `cache` — Core feature description              | The PR description must clearly describe the caching feature being added, as this is the central change.|
| 2 | contains | `Redis` — Implementation technology             | Reviewers need to know the specific technology to evaluate the approach and check for Redis-specific issues (connection pooling, memory limits, serialization). |
| 3 | contains | `auth` — Risk area identification               | The auth middleware reordering is the highest-risk part of this change. Failing to highlight it means the reviewer may not scrutinize it. |
| 4 | contains | `invalidation` — Cache consistency strategy     | Cache invalidation is the hardest part of caching. The description must address how stale data is prevented. |
| 5 | contains | `test` — Testing approach description           | Reviewers need to know what was tested and how, so they can focus review effort on untested areas. |
| 6 | contains | `review` — Review guidance and expectations     | The request must specify what feedback is needed and where reviewers should focus their attention. |

### What a passing response looks like

- Includes a concise PR title summarizing the caching feature.
- Provides a structured description with What/Why/How sections.
- Calls out the auth middleware reordering as a high-risk area needing careful review.
- Describes the cache invalidation strategy and its trade-offs.
- Includes a testing section covering unit tests, integration tests, and manual verification.
- Recommends a reviewer with backend/infrastructure expertise.
- Specifies the desired review depth and focus areas.

---

## Eval 2: Reviewer Selection and Timeline

This eval tests whether the skill correctly selects reviewers based on expertise and availability, and communicates appropriate urgency for a security fix.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `Bob` — Primary reviewer selection              | Bob is the best primary reviewer: frontend expertise, availability, and original code context. |
| 2 | contains | `Alice` — Security sign-off                     | Alice should be involved as security team lead, even if her review comes after initial approval. |
| 3 | contains | `urgent` — Urgency communication                | The review request must clearly communicate that this is time-sensitive due to an active vulnerability. |
| 4 | contains | `XSS` — Vulnerability identification            | The vulnerability type must be clearly stated so reviewers understand the threat model. |
| 5 | contains | `sanitiz` — Fix approach description            | The sanitization approach must be described so reviewers can evaluate completeness and correctness. |

### What a passing response looks like

- Recommends Bob as the primary reviewer due to availability and frontend expertise.
- Recommends Alice as a secondary reviewer for security sign-off after her meetings.
- Does not recommend waking Dave (different timezone, 11pm) for a non-critical-infrastructure fix.
- Notes Carol is too new to be the primary reviewer for a security fix but could be added for learning.
- Communicates clear urgency with a specific timeline (review by end of day).
- Includes a PR description that clearly states the XSS vulnerability and the sanitization fix.
- Suggests a two-phase approval: Bob for immediate merge, Alice for post-merge security audit if timeline requires.
