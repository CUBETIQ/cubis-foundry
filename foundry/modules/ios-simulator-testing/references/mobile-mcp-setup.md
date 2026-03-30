# iOS `mobile-mcp` Setup And Troubleshooting

`mobile-mcp` on iOS assumes a heavier stack than Android. Treat semantic
automation as optional until the environment proves it is ready.

## Expected prerequisites
- Xcode and Simulator runtimes are installed and working.
- The target simulator is booted and responsive.
- A WebDriverAgent-class bridge or equivalent iOS automation layer is
  available.
- The app under test can be built, installed, and launched locally.

## Start sequence
1. Run the local simulator health checks first.
2. Boot the target device and wait for readiness.
3. Start `mobile-mcp` with `npx @mobilenext/mobile-mcp@latest`.
4. Verify the iOS bridge can see and interact with the simulator before running
   the actual test flow.

## Common failure modes
- Simulator boots slowly or never reaches a ready state.
- WebDriverAgent is missing, unsigned, stale, or attached to the wrong device.
- Xcode build settings drift from the current runtime or developer tools.
- Semantic actions resolve the wrong element because the bridge state is stale.

## Recovery
- Reboot the simulator and rerun the health checks.
- Rebuild or reattach the iOS automation bridge.
- Fall back to `simctl` + `xcodebuild` + Python helpers when semantic setup is
  not trustworthy.
- Keep the failure report explicit about which layer failed: simulator, bridge,
  app build, or `mobile-mcp`.
