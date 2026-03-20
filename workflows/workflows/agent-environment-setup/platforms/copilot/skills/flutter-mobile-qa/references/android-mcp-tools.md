# Android MCP Tools For Mobile QA

## Safe-by-default tools

Use these first.

| Tool | Use for | Notes |
| --- | --- | --- |
| `list_devices` | Confirm target devices | First call when the session starts. |
| `list_avds` | Discover emulator names | Use before `start_emulator`. |
| `start_emulator` | Boot a known AVD | Wait for the device before app actions. |
| `screenshot` | Visual state capture | Save evidence under `artifacts/mobile-qa/`. |
| `get_ui_tree` | Element discovery | Use before tap decisions. |
| `wait_for_element` | Stable synchronization | Prefer this over fixed sleeps. |
| `get_current_activity` | Foreground screen sanity check | Useful after deep links or relaunches. |
| `get_device_info` | Device metadata | Record once per test session. |
| `get_logs` | Failure evidence | Filter by package after repro. |
| `clear_logs` | Clean reproduction window | Run before crash repro attempts. |

## Standard interaction tools

Use these when the target element is known.

| Tool | Preferred use |
| --- | --- |
| `tap_element` | First-choice interaction when text, resource ID, or content description is available |
| `tap_and_wait` | First-choice navigation action when the UI should settle after the tap |
| `type_text` | Text entry into the focused field |
| `press_key` | Back/home/enter/menu and similar device controls |
| `scroll_to_element` | Reaching off-screen targets |
| `tap` | Fallback only when element targeting is impossible |
| `swipe` | Lists, carousels, pull-to-refresh, or viewport movement |

## Restricted tools

Use only with explicit justification.

| Tool | Risk | Foundry rule |
| --- | --- | --- |
| `pull_file` | Writes files locally and can leak private app data | Only pull files into a workspace-local artifact directory. |
| `adb_shell` | Arbitrary device shell execution | Require explicit user approval or a clearly bounded troubleshooting need. Record the command in the report. |

## Preferred loop

1. `screenshot`
2. `get_ui_tree`
3. choose the next safe action
4. `tap_and_wait` or `type_text`
5. `screenshot`
6. `get_ui_tree`
7. if failure suspected, `get_logs`

## Flutter-specific targeting order

1. Content description derived from `Semantics(label: ...)`
2. Visible text that is stable and user-facing
3. Resource ID when the host view exposes one
4. Raw coordinates only as the last resort

## Artifact discipline

- Save screenshots under `artifacts/mobile-qa/screenshots/`
- Save logs under `artifacts/mobile-qa/logs/`
- Keep filenames tied to the flow and checkpoint, for example:
  - `artifacts/mobile-qa/screenshots/login-before-submit.png`
  - `artifacts/mobile-qa/logs/login-submit-error.log`
