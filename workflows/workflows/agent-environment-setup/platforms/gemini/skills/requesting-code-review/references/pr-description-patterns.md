# PR Description Patterns

## Overview

A well-written PR description is the single highest-leverage action for getting fast, high-quality reviews. Reviewers who understand the context, motivation, and risks of a change provide better feedback in fewer cycles. This reference provides templates and patterns for different change types.

## Universal Structure

Every PR description should contain these sections, regardless of change type:

### Title

- Imperative mood: "Add search endpoint" not "Added search endpoint"
- Under 72 characters
- Prefix with type if the project uses conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

### What / Why / How

- **What**: One sentence describing the change at a high level.
- **Why**: The motivation — what problem this solves, what user need it addresses, what issue it closes.
- **How**: The approach taken, key design decisions, and any alternatives considered.

### Testing

- What was tested (unit, integration, E2E, manual).
- How it was tested (specific commands, test scenarios).
- What was not tested and why.

### Risk Assessment

- Areas of highest risk or uncertainty.
- Rollback strategy if something goes wrong.
- Dependencies on other changes or deployments.

## Pattern: Feature Addition

```markdown
## What
Add [feature] to [area] for [user type].

## Why
[Problem statement]. Currently [current behavior]. Users need [desired behavior].
Closes #[issue].

## How
- [Key implementation decision 1]
- [Key implementation decision 2]
- [New dependency, if any, and why]

## Testing
- Unit tests: [what is covered]
- Integration tests: [what is covered]
- Manual testing: [scenarios tested]
- Not tested: [gaps and why]

## Screenshots
[Before/after for UI changes]

## Review Focus
- [Specific area needing attention]
- [Architecture question, if any]
```

## Pattern: Bug Fix

```markdown
## What
Fix [bug description] in [area].

## Root Cause
[Explanation of why the bug occurred — not just what the fix is, but what was wrong.]

## Fix
[Description of the fix and why this approach was chosen over alternatives.]

## How to Reproduce (Before Fix)
1. [Step 1]
2. [Step 2]
3. [Observe: incorrect behavior]

## Verification (After Fix)
1. [Step 1]
2. [Step 2]
3. [Observe: correct behavior]

## Testing
- [Regression test added to prevent recurrence]
- [Related edge cases checked]

## Risk
- [Could this fix break other behavior?]
- [Is this a symptom fix or root cause fix?]
```

## Pattern: Refactoring

```markdown
## What
Refactor [area] from [old approach] to [new approach].

## Why
[Specific problems with the current approach: performance, maintainability, scalability.]
No behavior change — this is a pure refactor.

## Approach
[How the refactoring was done, what the new structure looks like.]

## Verification
- All existing tests pass without modification (confirms no behavior change).
- [Additional verification, if any.]

## Commit Strategy
Review commit-by-commit:
1. [First commit: preparatory changes]
2. [Second commit: core refactoring]
3. [Third commit: cleanup and tests]

## Risk
- [Areas where behavior change might have been accidentally introduced]
- [Performance implications, if any]
```

## Pattern: Database Migration

```markdown
## What
[Migration description: add table, add column, change index, etc.]

## Why
[What feature or fix requires this schema change.]

## Migration Details
- **Backward compatible**: [Yes/No — can the old code run with the new schema?]
- **Estimated runtime**: [For large tables, how long will the migration take?]
- **Locking behavior**: [Does this lock tables? For how long?]
- **Rollback migration**: [Does a down migration exist? Has it been tested?]

## Deployment Order
1. [Deploy migration]
2. [Deploy application code]
3. [Or: deploy code first, then migration — explain order dependency]

## Testing
- Migration tested on a copy of production data (size: [X] rows).
- Rollback migration tested.

## Risk
- [Data loss scenarios]
- [Performance impact during migration]
```

## Pattern: Security Fix

```markdown
## What
Fix [vulnerability type] in [area].

## Severity
[Critical / High / Medium / Low] — [brief justification].

## Vulnerability Details
[Description of the vulnerability — enough for reviewers to understand the threat model, but be mindful of disclosure if the repo is public.]

## Fix
[What the fix does and why this approach was chosen.]

## Verification
- [How the fix was verified — including attempting the exploit after the fix]
- [Regression test added]

## Urgency
[Ship timeline — same day, this sprint, etc.]
[Disclosure timeline — is there an external reporter waiting?]

## Review Focus
- Security completeness: does the fix address the root cause or just one vector?
- Regression risk: could the fix break existing functionality?
```

## Anti-Patterns to Avoid

### The empty description

> "Fixed stuff"

This tells reviewers nothing. Even a one-line change deserves a one-sentence explanation.

### The novel

A 2,000-word description for a 10-line change. Match description length to change complexity.

### The copy-paste Jira ticket

Pasting the entire Jira description is not a PR description. The PR should describe the implementation, not repeat the requirements.

### The missing "why"

> "Changed the timeout from 30s to 60s"

Why? Was there a timeout error? A specific user report? A load test result? The "why" is what makes the change reviewable.

### The optimistic "no risk"

Every change has risk. Claiming "no risk" signals that the author has not thought about failure modes.

## Checklist Before Submitting

- [ ] Title is concise, imperative mood, under 72 characters
- [ ] Description explains what, why, and how
- [ ] Related issues are linked with closing keywords
- [ ] Testing approach is described, including gaps
- [ ] Risk areas are identified and explained
- [ ] Screenshots included for UI changes
- [ ] Review guidance specifies focus areas and expected depth
- [ ] Draft/ready-for-review status is set correctly
