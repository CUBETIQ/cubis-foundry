# Android `mobile-mcp` Flow

Use this when the emulator is healthy and you want semantic interaction first.

## Start
- Launch the runtime with `npx @mobilenext/mobile-mcp@latest`.
- Point it at the booted Android emulator you want to test.
- Confirm the app under test is installed and the emulator is unlocked.

## Use
1. Ask `mobile-mcp` for the current screen and actionable elements.
2. Drive the next step semantically: open, tap, type, scroll, back.
3. After each meaningful transition, capture a screenshot or log artifact if
   the result needs to survive outside the MCP session.
4. If targeting becomes ambiguous, switch to the CLI fallback and derive exact
   coordinates from the UI tree.

## Switch to fallback when
- The runtime cannot attach to the emulator.
- Semantic targeting is unstable or underspecified.
- You need replayable low-level evidence: activity, XML tree, raw screenshot,
  or `logcat`.
