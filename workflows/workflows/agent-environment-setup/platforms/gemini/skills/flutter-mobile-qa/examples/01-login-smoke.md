# Example: Login Smoke Flow

Prompt:

> Use the configured Android MCP server to boot the emulator if needed, install the debug APK, run the login flow with the provided staging credentials, and report each checkpoint with screenshots and logs if anything fails.

Expected behavior:

1. Confirm the device state.
2. Launch the package.
3. Capture a baseline screenshot.
4. Enter credentials.
5. Submit with `tap_and_wait`.
6. Assert the home screen loads and no crash appears in logs.
