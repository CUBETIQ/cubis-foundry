# Assertions Reference — playwright-persistent-browser

## Eval 001: Persistent Authentication Session

### Assertion 1 — storageState API usage
- **Type**: contains
- **What**: Output must include `storageState`
- **Why**: Playwright's `storageState()` method captures cookies (including HttpOnly), localStorage, and origin-scoped storage in a single call. Manual cookie extraction via `context.cookies()` misses HttpOnly cookies, which are the primary session mechanism for most web applications.

### Assertion 2 — State file existence check
- **Type**: contains
- **What**: Output must include `existsSync`
- **Why**: The persistence flow has two branches: fresh login (no saved state) and restoration (saved state exists). Without checking for the state file, the implementation either always logs in (defeating persistence) or always tries to restore (crashes on first run).

### Assertion 3 — Error handling
- **Type**: contains
- **What**: Output must include `catch` for error handling
- **Why**: Persistent sessions introduce failure modes that ephemeral tests do not have: expired tokens, corrupt JSON files, changed cookie domains, revoked sessions. Without error handling, any of these silently produces wrong behavior or crashes.

### Assertion 4 — Accessible locators
- **Type**: contains
- **What**: Output must use `getByLabel` for form inputs
- **Why**: Login forms are the most refactored UI component in any application. Role-based and label-based locators survive redesigns. CSS-based locators break on every login page update.

### Assertion 5 — JSON serialization
- **Type**: contains
- **What**: Output must reference `json` for state persistence
- **Why**: JSON is the standard format for `storageState` output. It is human-readable (debuggable), version-controllable, and parseable without custom deserialization logic.

---

## Eval 002: Multi-Tab State Management

### Assertion 1 — Tab creation via newPage
- **Type**: contains
- **What**: Output must use `newPage` to create tabs
- **Why**: `context.newPage()` creates a new tab within the existing browser context. This is the only way to share cookies and storage between tabs. Using `browser.newPage()` creates a new context, which defeats the purpose.

### Assertion 2 — Single context usage
- **Type**: contains
- **What**: Output must reference `context` for shared state
- **Why**: All tabs must share the same browser context for cookie and storage sharing. Multiple contexts would create isolated sessions, making the tabs unable to share authentication state.

### Assertion 3 — Resource cleanup
- **Type**: contains
- **What**: Output must include `close` for cleanup
- **Why**: Long-running multi-tab sessions accumulate memory. Each page retains DOM state, network caches, and JavaScript heap. Without closing unused pages or cycling resources, Chromium's memory usage grows without bound — typically 50-200MB per tab.

### Assertion 4 — Async coordination
- **Type**: contains
- **What**: Output must use `async` patterns
- **Why**: Tabs operate independently and concurrently. Synchronous coordination would serialize tab operations, defeating the purpose of multi-tab architecture. Async patterns (Promise.all, async generators) allow tabs to work in parallel while coordinating at specific sync points.

### Assertion 5 — Multiple page management
- **Type**: contains
- **What**: Output must manage multiple `page` references
- **Why**: Each tab is a separate Playwright Page object with its own navigation state, event listeners, and DOM. The implementation must track which page handles which responsibility to avoid sending commands to the wrong tab.
