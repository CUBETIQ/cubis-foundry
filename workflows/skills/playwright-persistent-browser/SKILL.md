---
name: playwright-persistent-browser
description: "Use when implementing persistent browser sessions in Playwright: long-running browser contexts, cookie and session persistence, authentication state serialization, multi-tab coordination, or debugging browser lifecycle issues."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
  domain: quality
  triggers: persistent browser, long-running session, cookie persistence, storageState, browser context reuse, session management, authentication state, multi-tab
  role: specialist
  scope: testing
  output-format: code
  related-skills: playwright-expert, playwright-interactive, playwright-e2e, auth-architect
compatibility: "Claude Code, Codex, GitHub Copilot"
---

# Playwright Persistent Browser

## Purpose

You are a specialist for building and maintaining persistent browser sessions in Playwright. Standard Playwright tests create and destroy browser contexts for each test, which is correct for isolation. But some scenarios require long-lived sessions — scraping workflows, monitoring dashboards, authenticated crawls, or multi-step workflows where context must survive across operations.

This skill exists because persistent browser management introduces failure modes that ephemeral tests never encounter: cookie expiration, session invalidation, memory leaks, stale DOM references, and context corruption. Handling these requires specific patterns that are not covered by standard test-writing skills.

## When to Use

- Building scraping or monitoring tools that maintain browser sessions for hours or days
- Implementing authentication state that persists across test runs or workflow steps
- Managing multi-tab browser sessions where tabs share cookies and storage
- Serializing and restoring browser state (cookies, localStorage, sessionStorage)
- Debugging memory leaks or performance degradation in long-running browser instances
- Building browser-based automation workflows (not just tests) that need session continuity

## Instructions

1. **Clarify the session lifecycle** — Determine how long the browser session must live (minutes, hours, days) and what triggers session start and end, because the persistence strategy differs dramatically between a 5-minute auth reuse and a 24-hour monitoring session.

2. **Choose the persistence layer** — Decide between `storageState` (cookies + localStorage), full browser context persistence, or external session stores. Load `references/state-management.md` for the decision matrix, because choosing the wrong layer wastes effort on problems that do not exist for your use case.

3. **Configure browser context creation** — Set up the browser context with appropriate options (viewport, locale, permissions, proxy) and document every option, because persistent contexts amplify misconfiguration — a wrong viewport set once affects every subsequent operation.

4. **Implement authentication persistence** — Load `references/authentication.md` and implement the auth flow once, then serialize the state for reuse. This matters because repeating login in every workflow step wastes time and triggers rate limits or account lockouts.

5. **Serialize session state** — Save cookies, localStorage, and sessionStorage to a JSON file or external store after authentication completes. Use `browserContext.storageState()` for the standard case, because manual cookie extraction misses HttpOnly cookies that the browser manages internally.

6. **Restore session state** — On subsequent runs, create the browser context with the saved `storageState` and verify the session is still valid before proceeding, because expired tokens in a restored state produce confusing failures that look like application bugs.

7. **Handle session expiration** — Implement a validity check (e.g., hit a `/me` endpoint or check for a login redirect) after restoring state. If the session expired, re-authenticate and re-serialize, because persistent sessions will eventually expire and your automation must recover without human intervention.

8. **Manage multi-tab coordination** — Load `references/browser-contexts.md` for tab management patterns. Tabs within a context share cookies and storage, but each tab has independent navigation state. Coordinate carefully because race conditions between tabs are the most common source of persistent session bugs.

9. **Implement state checkpointing** — For long-running sessions, periodically save state snapshots so that a crash or restart can resume from the last checkpoint rather than starting over. This matters because a 6-hour workflow that crashes at hour 5 with no checkpoint wastes 5 hours of compute.

10. **Configure resource cleanup** — Set up page and context cleanup to prevent memory leaks. Close pages that are no longer needed, clear caches periodically, and monitor memory usage. Load `references/performance.md` because Chromium's memory usage grows without bound if you never close pages.

11. **Add debug instrumentation** — Load `references/debugging.md` and add console log forwarding, request logging, and screenshot-on-error hooks. Persistent sessions are harder to debug than ephemeral tests because the failure context accumulates over time and is not captured by standard test reporters.

12. **Handle browser crashes gracefully** — Implement reconnection logic that detects when the browser process dies and restarts it with the last saved state. Browsers crash — especially long-running ones — and your automation must recover automatically.

13. **Test the persistence layer** — Write tests that serialize state, kill the browser, restore state in a new browser, and verify the session is intact. This proves the persistence works end-to-end, because untested persistence code always has edge cases (missing cookies, expired tokens, corrupted storage).

14. **Configure CI for persistent workflows** — If the persistent session runs in CI, configure longer timeouts, artifact collection for state files, and health checks. Standard CI timeout defaults (10 minutes) will kill long-running sessions.

15. **Document session topology** — Draw a diagram or write a table showing: what state is persisted, where it is stored, how long it lives, and what triggers refresh. Future maintainers need this because persistent session bugs are nearly impossible to diagnose without understanding the state lifecycle.

## Output Format

Deliver:

1. **Session manager module** — TypeScript/JavaScript class that encapsulates browser launch, state serialization, restoration, and cleanup
2. **Authentication flow** — Login implementation with state export
3. **State files** — JSON schema for the persisted state, with comments explaining each field
4. **Recovery logic** — Error handling for expired sessions, browser crashes, and corrupt state
5. **Configuration** — `playwright.config.ts` or equivalent with persistence-specific settings
6. **Lifecycle diagram** — Text-based diagram showing session states and transitions

## References

| File | Load when |
| --- | --- |
| `references/browser-contexts.md` | Creating or managing browser contexts, multi-tab sessions, or context isolation |
| `references/state-management.md` | Choosing persistence strategies or serializing/restoring browser state |
| `references/authentication.md` | Implementing login flows, token management, or auth state reuse |
| `references/debugging.md` | Debugging long-running sessions, memory leaks, or session corruption |
| `references/performance.md` | Optimizing memory usage, managing resource cleanup, or monitoring browser health |
