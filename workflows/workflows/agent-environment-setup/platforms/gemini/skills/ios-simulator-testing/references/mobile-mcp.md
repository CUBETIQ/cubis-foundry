# iOS `mobile-mcp` Flow

Use this when Simulator is already healthy and the semantic bridge is ready.

## Start
- Boot the target simulator and wait until it is responsive.
- Start the runtime with `npx @mobilenext/mobile-mcp@latest`.
- Confirm the iOS semantic bridge is available before you rely on it.

## Use
1. Ask `mobile-mcp` for the current screen and available controls.
2. Drive the flow semantically: launch, tap, type, scroll, back.
3. Capture screenshots or local logs at key state changes if the result needs a
   replayable record.
4. If semantic actions stall or the bridge loses state, switch to `simctl`
   fallback and continue there.

## Switch to fallback when
- The simulator is not fully booted.
- WebDriverAgent or an equivalent bridge is missing or unhealthy.
- You need deterministic install, launch, logs, screenshots, or app-state
  capture from local CLI tools.
