# Stitch Anti-Abuse Rules

Treat Stitch as a rate-sensitive remote service.

## Default guardrails

1. One Stitch generation or edit action per user turn by default.
2. Prefer `edit_screens` over full regeneration once a screen already exists.
3. Maximum two automatic retries on transient failures.
4. Use short backoff before retry one and longer backoff before retry two.
5. Stop after two retries and ask for direction if progress is still blocked.

## Prompt budget rules

- Do not send raw repo dumps, long transcripts, or whole foundation docs.
- Send a compact structured brief only.
- Reuse `projectId` and `screenId` when editing rather than creating unnecessary new Stitch resources.
- If Stitch returns suggestions, incorporate them before retrying instead of resending the same prompt.

## Stop conditions

Stop and report when:

- Stitch status or tool discovery failed
- design context is missing for a multi-screen task
- repeated retries do not materially change the result
- the user appears to want a large autonomous loop
