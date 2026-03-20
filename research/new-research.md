# Mobile App Testing Orchestrator (MATO)
### AI-Agent Driven Integration Testing for Flutter Apps via Android Emulator + MCP

---

## Overview

This skill defines how an AI agent **reasons about, plans, and executes** full integration tests for Flutter (and any Android) apps using a local Android emulator. It mirrors what Playwright + AI does for the web — but for mobile. The agent controls the device via an **MCP server written in Go**, takes screenshots to see the UI, reads the element tree for precision targeting, and adapts its test strategy based on what it observes in real time.

**Core philosophy**: The agent is a *tester*, not a script runner. It thinks like a QA engineer — exploring flows, catching edge cases, documenting failures with evidence, and asking humans only when it genuinely cannot proceed (e.g., real credentials for a login screen).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI AGENT (Claude)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Test Planner│  │ Reasoning    │  │ Evidence Collector  │   │
│  │  (reads app) │  │ Loop Engine  │  │ (screenshots+logs)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘   │
└─────────┼────────────────┼────────────────────────┼────────────┘
          │ MCP Protocol (stdio / SSE)               │
          ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Flutter MCP Server (Go)                            │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ ADB Bridge   │  │ Flutter     │  │  Session Manager     │   │
│  │ (shell reuse)│  │ Driver Ext. │  │  (state, creds, ctx) │   │
│  └──────┬───────┘  └──────┬──────┘  └──────────────────────┘   │
└─────────┼────────────────┼─────────────────────────────────────┘
          │                │
          ▼                ▼
┌──────────────────────────────────────┐
│       Android Emulator (AVD)         │
│  Flutter App running in debug/profile│
│  ADB accessible on localhost:5554    │
└──────────────────────────────────────┘
```

### Component Responsibilities

| Component | Role |
|---|---|
| **AI Agent** | Plans tests, reasons about UI, decides next action, asks for credentials |
| **Go MCP Server** | Exposes tools over MCP protocol, bridges to ADB + Flutter driver |
| **ADB Bridge** | Low-level device control (tap, swipe, screenshot, logcat) |
| **Flutter Driver Ext** | Semantic tree access (Flutter widget keys, semantics labels) |
| **Session Manager** | Stores test credentials, current app state, test context |

---

## Go MCP Server Design

### Why Go (Latest Version)

Go 1.22+ is ideal for this server: goroutines handle concurrent ADB + Flutter driver calls without blocking, the stdlib is rich enough to avoid heavy dependencies, and it compiles to a single binary that any developer can run.

### Project Structure

```
flutter-mcp-server/
├── main.go                    # Entry point, MCP server bootstrap
├── go.mod                     # module flutter-mcp-server, go 1.22
├── go.sum
├── internal/
│   ├── mcp/
│   │   ├── server.go          # MCP protocol handler (stdio + SSE)
│   │   ├── tools.go           # Tool registration + dispatch
│   │   └── types.go           # MCP request/response structs
│   ├── adb/
│   │   ├── bridge.go          # Persistent ADB shell session
│   │   ├── screenshot.go      # Capture + compress to base64
│   │   ├── uitree.go          # UI Automator XML → structured tree
│   │   ├── logcat.go          # Filtered logcat streaming
│   │   └── device.go          # Device listing, info, emulator boot
│   ├── flutter/
│   │   ├── driver.go          # Flutter Driver / Integration Test bridge
│   │   ├── semantics.go       # Flutter semantics tree extractor
│   │   └── vmservice.go       # Dart VM Service WebSocket client
│   ├── session/
│   │   ├── manager.go         # Test session: creds, state, history
│   │   └── credentials.go     # Secure credential storage for session
│   └── report/
│       ├── collector.go       # Evidence: screenshots, logs, assertions
│       └── formatter.go       # Output: JSON, markdown, JUnit XML
├── tools/                     # One file per MCP tool implementation
│   ├── screenshot.go
│   ├── flutter_find.go
│   ├── flutter_tap.go
│   ├── flutter_input.go
│   ├── flutter_scroll.go
│   ├── flutter_assert.go
│   ├── get_semantics_tree.go
│   ├── get_logs.go
│   ├── provide_credentials.go
│   ├── set_test_context.go
│   └── generate_test_report.go
└── config/
    └── config.go              # ANDROID_HOME, emulator name, ports
```

### MCP Server Bootstrap (`main.go`)

```go
package main

import (
    "context"
    "log/slog"
    "os"
    "os/signal"
    "syscall"

    "flutter-mcp-server/internal/mcp"
    "flutter-mcp-server/internal/session"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))

    sess := session.New()

    srv := mcp.NewServer(mcp.Config{
        Name:    "flutter-mobile-tester",
        Version: "1.0.0",
        Logger:  logger,
        Session: sess,
    })

    ctx, cancel := signal.NotifyContext(context.Background(),
        syscall.SIGINT, syscall.SIGTERM)
    defer cancel()

    // stdio transport for Claude Code / Claude Desktop
    if err := srv.ServeStdio(ctx); err != nil {
        logger.Error("server error", "err", err)
        os.Exit(1)
    }
}
```

### MCP Protocol Handler (`internal/mcp/server.go`)

```go
package mcp

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "os"
)

type JSONRPCRequest struct {
    JSONRPC string          `json:"jsonrpc"`
    ID      any             `json:"id"`
    Method  string          `json:"method"`
    Params  json.RawMessage `json:"params,omitempty"`
}

type JSONRPCResponse struct {
    JSONRPC string `json:"jsonrpc"`
    ID      any    `json:"id"`
    Result  any    `json:"result,omitempty"`
    Error   *RPCError `json:"error,omitempty"`
}

type RPCError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func (s *Server) ServeStdio(ctx context.Context) error {
    reader := bufio.NewReader(os.Stdin)
    encoder := json.NewEncoder(os.Stdout)

    for {
        select {
        case <-ctx.Done():
            return nil
        default:
        }

        var req JSONRPCRequest
        if err := json.NewDecoder(reader).Decode(&req); err != nil {
            if err == io.EOF {
                return nil
            }
            continue
        }

        go func(r JSONRPCRequest) {
            resp := s.handle(ctx, r)
            // thread-safe write
            s.mu.Lock()
            defer s.mu.Unlock()
            encoder.Encode(resp)
        }(req)
    }
}

func (s *Server) handle(ctx context.Context, req JSONRPCRequest) JSONRPCResponse {
    switch req.Method {
    case "initialize":
        return s.handleInitialize(req)
    case "tools/list":
        return s.handleToolsList(req)
    case "tools/call":
        return s.handleToolCall(ctx, req)
    default:
        return JSONRPCResponse{
            JSONRPC: "2.0",
            ID:      req.ID,
            Error:   &RPCError{Code: -32601, Message: "method not found"},
        }
    }
}
```

### Complete Tool Registry

```go
// internal/mcp/tools.go
package mcp

var toolDefinitions = []ToolDef{
    // ── Device & App Management ─────────────────────────────────────
    {
        Name:        "list_devices",
        Description: "List connected Android emulators and devices",
        InputSchema: schema{},
    },
    {
        Name:        "start_emulator",
        Description: "Start a named AVD and wait until booted (up to 120s)",
        InputSchema: schema{
            "avd_name": {Type: "string", Required: true},
        },
    },
    {
        Name:        "install_apk",
        Description: "Install an APK onto the running emulator",
        InputSchema: schema{
            "apk_path": {Type: "string", Required: true},
        },
    },
    {
        Name:        "launch_app",
        Description: "Launch a Flutter app by package name",
        InputSchema: schema{
            "package_name": {Type: "string", Required: true},
            "wait_ms":      {Type: "integer", Default: 2000},
        },
    },
    {
        Name:        "restart_app",
        Description: "Force stop and relaunch the app (clean state)",
        InputSchema: schema{
            "package_name": {Type: "string", Required: true},
        },
    },
    {
        Name:        "clear_app_data",
        Description: "Clear app storage/prefs (full reset of app state)",
        InputSchema: schema{
            "package_name": {Type: "string", Required: true},
        },
    },

    // ── Vision & UI Inspection ───────────────────────────────────────
    {
        Name:        "screenshot",
        Description: "Capture the current screen as a base64 JPEG (max 1280px)",
        InputSchema: schema{
            "save_path": {Type: "string", Required: false},
        },
    },
    {
        Name:        "get_ui_tree",
        Description: "Get Android UI Automator element tree with bounds, text, resource-id, content-desc, and state flags",
        InputSchema: schema{},
    },
    {
        Name:        "get_flutter_semantics",
        Description: "Get Flutter's own semantics tree (widget keys, labels, roles). More accurate than UI Automator for Flutter apps.",
        InputSchema: schema{
            "package_name": {Type: "string", Required: true},
        },
    },
    {
        Name:        "get_current_activity",
        Description: "Return the foreground package and activity class name",
        InputSchema: schema{},
    },

    // ── Interaction ──────────────────────────────────────────────────
    {
        Name:        "tap",
        Description: "Tap at absolute screen coordinates",
        InputSchema: schema{
            "x": {Type: "integer", Required: true},
            "y": {Type: "integer", Required: true},
        },
    },
    {
        Name:        "tap_element",
        Description: "Find and tap an element by resource-id, text, or content-desc",
        InputSchema: schema{
            "by":    {Type: "string", Enum: []string{"resource-id", "text", "content-desc"}, Required: true},
            "value": {Type: "string", Required: true},
            "wait_ms": {Type: "integer", Default: 3000},
        },
    },
    {
        Name:        "flutter_tap",
        Description: "Tap a Flutter widget by its semantics label or ValueKey. Preferred over tap_element for Flutter apps.",
        InputSchema: schema{
            "by":    {Type: "string", Enum: []string{"key", "text", "semantics-label", "tooltip"}, Required: true},
            "value": {Type: "string", Required: true},
        },
    },
    {
        Name:        "tap_and_wait",
        Description: "Tap element, wait for UI to settle, return updated UI tree — single round trip",
        InputSchema: schema{
            "by":    {Type: "string", Required: true},
            "value": {Type: "string", Required: true},
            "settle_ms": {Type: "integer", Default: 1500},
        },
    },
    {
        Name:        "type_text",
        Description: "Type text into the currently focused input field",
        InputSchema: schema{
            "text":          {Type: "string", Required: true},
            "clear_first":   {Type: "boolean", Default: false},
        },
    },
    {
        Name:        "press_key",
        Description: "Press a hardware or soft key: back, home, enter, tab, delete, menu, volume_up, volume_down",
        InputSchema: schema{
            "key": {Type: "string", Required: true},
        },
    },
    {
        Name:        "swipe",
        Description: "Swipe from (x1,y1) to (x2,y2) over a duration",
        InputSchema: schema{
            "x1": {Type: "integer", Required: true},
            "y1": {Type: "integer", Required: true},
            "x2": {Type: "integer", Required: true},
            "y2": {Type: "integer", Required: true},
            "duration_ms": {Type: "integer", Default: 300},
        },
    },
    {
        Name:        "scroll_to_element",
        Description: "Scroll a list until target element appears (up to max_scrolls attempts)",
        InputSchema: schema{
            "by":          {Type: "string", Required: true},
            "value":       {Type: "string", Required: true},
            "direction":   {Type: "string", Enum: []string{"down", "up"}, Default: "down"},
            "max_scrolls": {Type: "integer", Default: 10},
        },
    },
    {
        Name:        "wait_for_element",
        Description: "Wait until an element is visible on screen (polling)",
        InputSchema: schema{
            "by":      {Type: "string", Required: true},
            "value":   {Type: "string", Required: true},
            "timeout_ms": {Type: "integer", Default: 10000},
        },
    },

    // ── Flutter Assertions ───────────────────────────────────────────
    {
        Name:        "flutter_assert_text",
        Description: "Assert that a text string exists on screen. Returns pass/fail + screenshot.",
        InputSchema: schema{
            "text":    {Type: "string", Required: true},
            "visible": {Type: "boolean", Default: true},
        },
    },
    {
        Name:        "flutter_assert_element",
        Description: "Assert an element exists (and optionally is enabled/checked)",
        InputSchema: schema{
            "by":       {Type: "string", Required: true},
            "value":    {Type: "string", Required: true},
            "exists":   {Type: "boolean", Default: true},
            "enabled":  {Type: "boolean", Required: false},
            "checked":  {Type: "boolean", Required: false},
        },
    },
    {
        Name:        "flutter_assert_route",
        Description: "Assert the current Flutter route/page name via the VM service",
        InputSchema: schema{
            "expected_route": {Type: "string", Required: true},
        },
    },

    // ── Diagnostics ──────────────────────────────────────────────────
    {
        Name:        "get_logs",
        Description: "Get logcat output, filterable by package name, log level (V/D/I/W/E/F), and since_ms",
        InputSchema: schema{
            "package_name": {Type: "string", Required: false},
            "level":        {Type: "string", Enum: []string{"V","D","I","W","E","F"}, Default: "E"},
            "since_ms":     {Type: "integer", Required: false},
            "max_lines":    {Type: "integer", Default: 100},
        },
    },
    {
        Name:        "clear_logs",
        Description: "Clear the logcat buffer — call before reproducing a bug",
        InputSchema: schema{},
    },
    {
        Name:        "get_flutter_errors",
        Description: "Extract Flutter framework errors from logcat (FlutterError, assert failures, RenderFlex overflow)",
        InputSchema: schema{
            "package_name": {Type: "string", Required: true},
            "since_ms":     {Type: "integer", Required: false},
        },
    },
    {
        Name:        "get_device_info",
        Description: "Get emulator model, Android version, API level, screen resolution, DPI",
        InputSchema: schema{},
    },
    {
        Name:        "get_network_info",
        Description: "Check if network is available; useful before testing API-dependent flows",
        InputSchema: schema{},
    },

    // ── Session & Test Orchestration ─────────────────────────────────
    {
        Name:        "set_test_context",
        Description: "Set the app under test: package name, APK path, app description, test goals",
        InputSchema: schema{
            "package_name":    {Type: "string", Required: true},
            "app_description": {Type: "string", Required: true},
            "test_goals":      {Type: "array", Items: "string", Required: false},
        },
    },
    {
        Name:        "provide_credentials",
        Description: "Supply login credentials for the test session. Agent calls this when it encounters an auth screen.",
        InputSchema: schema{
            "credential_type": {Type: "string", Enum: []string{"email_password", "phone_otp", "sso", "api_key"}, Required: true},
            "username":        {Type: "string", Required: false},
            "password":        {Type: "string", Required: false},
            "phone_number":    {Type: "string", Required: false},
            "otp_code":        {Type: "string", Required: false},
            "extra":           {Type: "object", Required: false},
        },
    },
    {
        Name:        "request_otp",
        Description: "Notify the human tester that the app is waiting for an OTP code and pause until it is provided",
        InputSchema: schema{
            "phone_or_email": {Type: "string", Required: true},
            "context":        {Type: "string", Required: false},
        },
    },
    {
        Name:        "mark_test_step",
        Description: "Record a named test step with pass/fail and optional evidence screenshot",
        InputSchema: schema{
            "step_name":   {Type: "string", Required: true},
            "status":      {Type: "string", Enum: []string{"pass", "fail", "skip", "info"}, Required: true},
            "description": {Type: "string", Required: false},
            "screenshot":  {Type: "boolean", Default: true},
        },
    },
    {
        Name:        "generate_test_report",
        Description: "Generate a full test report in the requested format after the session completes",
        InputSchema: schema{
            "format":     {Type: "string", Enum: []string{"markdown", "json", "junit"}, Default: "markdown"},
            "output_path": {Type: "string", Required: false},
        },
    },
}
```

### Flutter VM Service Integration (`internal/flutter/vmservice.go`)

This is what makes this server *better* than a generic Android MCP for Flutter apps — it speaks directly to the Dart VM running inside the emulator.

```go
package flutter

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/gorilla/websocket"
)

// VMService connects to the Flutter/Dart VM Service WebSocket
// exposed on the emulator via ADB port forwarding.
type VMService struct {
    conn    *websocket.Conn
    pending map[int64]chan json.RawMessage
    nextID  int64
}

// Connect sets up ADB port forwarding and dials the VM service.
// Run: adb forward tcp:8181 tcp:8181 before connecting.
func Connect(ctx context.Context, adbDeviceID string) (*VMService, error) {
    // Forward VM service port from emulator to localhost
    // adb -s <deviceID> forward tcp:8181 tcp:8181
    // This is done by the ADB bridge before calling Connect.

    dialer := websocket.Dialer{
        HandshakeTimeout: 10 * time.Second,
    }
    conn, _, err := dialer.DialContext(ctx,
        "ws://localhost:8181/ws", http.Header{})
    if err != nil {
        return nil, fmt.Errorf("vm service dial: %w", err)
    }

    vm := &VMService{
        conn:    conn,
        pending: make(map[int64]chan json.RawMessage),
    }
    go vm.readLoop()
    return vm, nil
}

// GetCurrentRoute returns the name of the topmost route on the
// Navigator stack by inspecting the widget tree via ext.flutter.inspector.
func (vm *VMService) GetCurrentRoute(ctx context.Context) (string, error) {
    resp, err := vm.call(ctx, "ext.flutter.inspector.getRootRenderObject", nil)
    if err != nil {
        return "", err
    }
    // parse route from response ...
    _ = resp
    return "", nil
}

// GetSemanticsTree calls the Flutter inspector extension to return
// the full semantics tree — widget labels, roles, values, actions.
func (vm *VMService) GetSemanticsTree(ctx context.Context) ([]SemanticsNode, error) {
    params := map[string]any{"objectGroup": "test"}
    resp, err := vm.call(ctx, "ext.flutter.inspector.getSemantics", params)
    if err != nil {
        return nil, err
    }
    var nodes []SemanticsNode
    if err := json.Unmarshal(resp, &nodes); err != nil {
        return nil, fmt.Errorf("parse semantics: %w", err)
    }
    return nodes, nil
}

type SemanticsNode struct {
    ID          int             `json:"id"`
    Label       string          `json:"label"`
    Value       string          `json:"value"`
    Hint        string          `json:"hint"`
    Role        string          `json:"role"`
    Flags       SemanticsFlags  `json:"flags"`
    Rect        Rect            `json:"rect"`
    Children    []SemanticsNode `json:"children,omitempty"`
}

type SemanticsFlags struct {
    IsEnabled   bool `json:"isEnabled"`
    IsChecked   bool `json:"isChecked"`
    IsFocused   bool `json:"isFocused"`
    IsSelected  bool `json:"isSelected"`
    IsButton    bool `json:"isButton"`
    IsTextField bool `json:"isTextField"`
}
```

### ADB Bridge with Persistent Shell (`internal/adb/bridge.go`)

```go
package adb

import (
    "bytes"
    "context"
    "fmt"
    "os/exec"
    "strings"
    "sync"
    "time"
)

// Bridge manages a single persistent ADB connection to avoid
// the startup overhead of spawning a new process per command.
type Bridge struct {
    deviceID   string
    androidHome string
    mu          sync.Mutex
}

func New(deviceID, androidHome string) *Bridge {
    return &Bridge{deviceID: deviceID, androidHome: androidHome}
}

func (b *Bridge) adbPath() string {
    return b.androidHome + "/platform-tools/adb"
}

// Run executes an ADB shell command and returns stdout+stderr.
func (b *Bridge) Run(ctx context.Context, args ...string) (string, error) {
    b.mu.Lock()
    defer b.mu.Unlock()

    fullArgs := []string{"-s", b.deviceID}
    fullArgs = append(fullArgs, args...)

    cmd := exec.CommandContext(ctx, b.adbPath(), fullArgs...)
    var out bytes.Buffer
    var errOut bytes.Buffer
    cmd.Stdout = &out
    cmd.Stderr = &errOut

    if err := cmd.Run(); err != nil {
        return "", fmt.Errorf("adb %v: %w\nstderr: %s",
            args, err, errOut.String())
    }
    return strings.TrimSpace(out.String()), nil
}

// Screenshot captures a PNG from the device, compresses to JPEG,
// and returns base64-encoded bytes ready for the MCP image response.
func (b *Bridge) Screenshot(ctx context.Context) (string, error) {
    // screencap to device /data/local/tmp/mato_ss.png
    if _, err := b.Run(ctx, "shell", "screencap", "-p",
        "/data/local/tmp/mato_ss.png"); err != nil {
        return "", err
    }
    // pull to temp file, compress, encode
    // ... (see screenshot.go for full implementation)
    return "", nil
}

// WaitForBoot polls until the emulator is fully booted.
func (b *Bridge) WaitForBoot(ctx context.Context, timeout time.Duration) error {
    deadline := time.Now().Add(timeout)
    for time.Now().Before(deadline) {
        out, err := b.Run(ctx, "shell", "getprop",
            "sys.boot_completed")
        if err == nil && strings.TrimSpace(out) == "1" {
            return nil
        }
        time.Sleep(2 * time.Second)
    }
    return fmt.Errorf("emulator boot timeout after %v", timeout)
}
```

### Session & Credentials Manager (`internal/session/manager.go`)

```go
package session

import (
    "sync"
    "time"
)

// Session holds all state for the current test run.
// The AI agent stores credentials here after the human provides them,
// so it can re-use them (e.g., after clearing app data and re-logging in).
type Session struct {
    mu sync.RWMutex

    PackageName    string
    AppDescription string
    TestGoals      []string

    Credentials    *Credentials
    OTPPending     bool
    OTPChannel     chan string

    Steps          []TestStep
    StartedAt      time.Time
    DeviceID       string
}

type Credentials struct {
    Type        string // "email_password", "phone_otp", "sso"
    Username    string
    Password    string
    PhoneNumber string
    OTPCode     string
    Extra       map[string]string
}

type TestStep struct {
    Name        string
    Status      string // "pass" | "fail" | "skip" | "info"
    Description string
    Screenshot  string // base64 or file path
    Timestamp   time.Time
    Error       string
}

func New() *Session {
    return &Session{
        StartedAt:  time.Now(),
        OTPChannel: make(chan string, 1),
    }
}

func (s *Session) StoreCredentials(c *Credentials) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.Credentials = c
}

func (s *Session) GetCredentials() *Credentials {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.Credentials
}

func (s *Session) AddStep(step TestStep) {
    s.mu.Lock()
    defer s.mu.Unlock()
    step.Timestamp = time.Now()
    s.Steps = append(s.Steps, step)
}

func (s *Session) Summary() (passed, failed, skipped int) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    for _, step := range s.Steps {
        switch step.Status {
        case "pass":   passed++
        case "fail":   failed++
        case "skip":   skipped++
        }
    }
    return
}
```

### MCP Configuration (`.mcp.json`)

```json
{
  "mcpServers": {
    "flutter-tester": {
      "command": "./flutter-mcp-server",
      "env": {
        "ANDROID_HOME": "/Users/you/Library/Android/sdk",
        "FLUTTER_ROOT": "/Users/you/flutter",
        "DEFAULT_AVD": "Pixel_8_API_34",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## AI Agent Reasoning System

### The Core Loop

Unlike a scripted test runner, the agent uses a **Observe → Reason → Act → Assert** loop at every step:

```
1. OBSERVE   → screenshot() + get_flutter_semantics()
2. REASON    → "What screen am I on? What are my test goals?
                What's the next logical action?"
3. ACT       → flutter_tap() / type_text() / scroll_to_element()
4. ASSERT    → flutter_assert_text() / flutter_assert_element()
              → check get_flutter_errors() for crash evidence
5. RECORD    → mark_test_step()
6. LOOP      → back to OBSERVE
```

The agent terminates the loop when:
- All test goals are covered
- It encounters an unrecoverable error and marks it as `fail`
- It needs human input (credentials, OTP) and pauses pending response

### Agent System Prompt (embed this when building the agent)

```
You are a mobile QA engineer testing a Flutter app on an Android emulator.
Your job is to reason about the app's UI, execute test flows, and document results.

## Guiding principles

1. ALWAYS start a test by taking a screenshot and reading the semantics tree.
   Never assume what screen you are on — verify visually first.

2. PREFER flutter_tap() over tap() for Flutter apps. Flutter widgets have
   semantic labels that are more reliable than pixel coordinates.

3. BEFORE interacting with any input field: take a screenshot to confirm focus,
   then type_text(), then screenshot again to verify the text was entered.

4. When you encounter a LOGIN SCREEN:
   a. Call provide_credentials to check if credentials are already stored.
   b. If NOT stored: STOP. Ask the human:
      "I've reached the login screen. Please provide test credentials.
       Format: email=<email> password=<password>"
   c. Once credentials are provided via provide_credentials tool, proceed.
   d. Store them in the session — do NOT ask again if you restart the app.

5. For OTP flows: call request_otp() with the phone/email, then WAIT.
   Do NOT try to proceed until the human provides the OTP via provide_credentials.

6. After EVERY significant action, call get_flutter_errors() to check for
   crashes, assertion failures, or RenderFlex overflows.

7. Mark EVERY test step explicitly with mark_test_step() — pass or fail.
   Include a screenshot for any failure.

8. When a test fails: document it thoroughly.
   - Screenshot of the failure state
   - Relevant logcat errors (get_logs with level=E)
   - Exact reproduction steps in the step description
   Then CONTINUE testing other flows if possible.

9. You are exploring the app intelligently — not blindly tapping everything.
   Think about USER JOURNEYS: what would a real user try to do?

10. When done: call generate_test_report().
```

### Credential Handshake Protocol

This is the exact flow the agent follows when it needs auth:

```
AGENT detects login screen
  └─► agent calls screenshot() + get_flutter_semantics()
  └─► agent reasons: "I see email/password fields and a Login button"
  └─► agent checks session.GetCredentials() via internal tool
      ├─► CREDENTIALS EXIST → fill fields automatically → continue
      └─► CREDENTIALS MISSING →
            agent outputs to human:
            ┌──────────────────────────────────────────────────────┐
            │ 🔐 TEST PAUSED — Login Screen Detected               │
            │                                                       │
            │ I've reached the login screen. To continue testing,  │
            │ please provide a test account:                        │
            │                                                       │
            │   • Email/Username                                    │
            │   • Password                                          │
            │                                                       │
            │ These will be stored only for this session.           │
            │ Reply: email=test@example.com password=TestPass123    │
            └──────────────────────────────────────────────────────┘
            agent PAUSES and waits for provide_credentials() tool call
            
  HUMAN provides credentials via provide_credentials tool
  └─► session stores credentials
  └─► agent resumes: fills email field, fills password field, taps Login
  └─► agent verifies successful login via screenshot + route assertion
```

### OTP Handshake Protocol

```
AGENT sees OTP input screen
  └─► agent calls request_otp(phone_or_email="...", context="Login OTP")
  └─► MCP server returns:
      {
        "status": "waiting_for_otp",
        "message": "OTP requested. Provide via provide_credentials tool
                    with credential_type=phone_otp and otp_code=<6digit>"
      }
  └─► Agent outputs to human:
      "⏳ Waiting for OTP — please check your device/email and provide
       the 6-digit code using the provide_credentials tool."
  
  HUMAN calls provide_credentials(credential_type="phone_otp", otp_code="123456")
  └─► Session OTPChannel receives the code
  └─► Agent types OTP into field and submits
```

---

## Flutter-Specific Testing Patterns

### 1. Finding Elements in Flutter

Flutter widgets are best targeted via **semantic labels** set in the code:

```dart
// In Flutter code — add Semantics or Key to important widgets
ElevatedButton(
  key: const Key('login_button'),       // ← use flutter_tap(by:"key", value:"login_button")
  child: Semantics(
    label: 'Login',                      // ← use flutter_tap(by:"semantics-label", value:"Login")
    child: Text('Login'),
  ),
  onPressed: () { ... },
)
```

When keys/labels aren't present, fall back to the UI Automator tree:

```
Priority order for element targeting:
1. flutter_tap(by:"key", ...)            — most reliable, widget key
2. flutter_tap(by:"semantics-label", ...) — accessibility label
3. tap_element(by:"text", ...)           — visible text
4. tap_element(by:"content-desc", ...)   — a11y description
5. tap(x, y)                             — last resort, coordinate-based
```

### 2. Navigation and Routes

Flutter's Navigator keeps a stack. Assert you're on the right screen:

```
After login:
  flutter_assert_route(expected_route: "/home")
  
After tapping a settings item:
  flutter_assert_route(expected_route: "/settings/notifications")
```

The agent reads routes from the VM service via `ext.flutter.inspector`.

### 3. Form Testing Checklist

For every form the agent encounters, it should test:

```
□ Empty submission — tap Submit with no fields filled
  └─► Expect: validation error messages appear
  └─► Assert: error text visible on screen
  └─► Log: mark_test_step("Empty form validation", status based on result)

□ Invalid data — enter malformed email, short password, etc.
  └─► Expect: inline field errors

□ Valid data — fill all fields correctly
  └─► Expect: success state / navigation

□ Password visibility toggle (if present)
  └─► Tap eye icon, assert password becomes visible

□ Keyboard dismissal — press back after filling a field
  └─► Assert: data is preserved in field
```

### 4. Scroll and List Testing

```
// Agent pattern for testing long lists
1. get_flutter_semantics() → count visible list items
2. scroll_to_element(by:"text", value:"Last Known Item", direction:"down")
3. screenshot() → verify list end behavior (empty state? loading indicator?)
4. scroll_to_element(by:"text", value:"First Item", direction:"up")
5. flutter_assert_element(by:"key", value:"list_container", exists:true)
```

### 5. Loading State Verification

```
// Flutter often shows CircularProgressIndicator during API calls
After triggering an action that loads data:
1. wait_for_element(by:"content-desc", value:"Loading", timeout_ms:1000)
   — verify loading state appears briefly
2. wait_for_element(by:"key", value:"content_loaded", timeout_ms:10000)
   — wait for actual content
3. flutter_assert_element(by:"content-desc", value:"Loading", exists:false)
   — verify loading spinner is gone
```

### 6. Error State & Network Failure Testing

```
// Test offline/error states using ADB network manipulation
adb_shell: "svc wifi disable"          // simulate no network
  → trigger a data fetch action
  → assert error state/retry button appears
adb_shell: "svc wifi enable"           // restore
  → tap retry
  → assert content loads
```

---

## Test Plan Generation

### Agent Self-Discovery Flow

When the agent first encounters an app it hasn't seen before, it runs this discovery protocol:

```
DISCOVERY PROTOCOL (run once at session start):

1. screenshot() + get_flutter_semantics()
   → "What is this app? What screen am I on?"
   
2. Walk the main navigation:
   - Identify bottom tab bar or drawer
   - Visit each top-level screen
   - Take a screenshot of each
   - Build a mental map: [{screen: "Home", route: "/", key_elements: [...]}]

3. Identify AUTH GATES:
   - Which screens require login?
   - What type of login does the app use?

4. Identify FORMS:
   - Registration, login, profile edit, checkout, etc.

5. Identify KEY USER JOURNEYS based on app type:
   - E-commerce: Browse → Add to Cart → Checkout → Order Confirmation
   - Social: Login → Feed → Post → Comment → Like
   - Productivity: Create Item → Edit → Delete → Search
   - Auth only: Register → Verify → Login → Reset Password

6. Generate test plan with priority ordering:
   P0 (Critical): Login, core value action (buy, post, create)
   P1 (High):     All forms, navigation flows, error states
   P2 (Medium):   Edge cases, empty states, settings
   P3 (Low):      Accessibility, visual regression notes
```

### Sample Generated Test Plan (Markdown output)

```markdown
# Test Plan: ShopApp v2.1.0
Generated by MATO on 2026-03-20
Device: Pixel 8 API 34 (emulator-5554)

## App Summary
E-commerce app. Main flows: Browse → Product Detail → Cart → Checkout.
Auth: Email/Password login. Social login (Google) also present.

## Credentials Required
- [ ] Test account: email + password (standard user)
- [ ] Admin account: for testing order management (optional)

## Test Suites

### P0 — Auth Flow
- [ ] TC-001: Successful email/password login
- [ ] TC-002: Login with wrong password → error message
- [ ] TC-003: Login with empty fields → validation
- [ ] TC-004: Forgot password flow (email entry)
- [ ] TC-005: Logout and session clearing

### P0 — Core Purchase Flow  
- [ ] TC-010: Browse home → tap product → view detail
- [ ] TC-011: Add product to cart
- [ ] TC-012: Increase/decrease quantity in cart
- [ ] TC-013: Remove item from cart
- [ ] TC-014: Proceed to checkout (requires login)
- [ ] TC-015: Enter shipping address
- [ ] TC-016: Order confirmation screen

### P1 — Search & Filter
- [ ] TC-020: Search for existing product
- [ ] TC-021: Search with no results → empty state
- [ ] TC-022: Apply price filter
- [ ] TC-023: Clear filters

### P1 — User Profile
- [ ] TC-030: View profile screen
- [ ] TC-031: Edit display name
- [ ] TC-032: Change password form validation

### P2 — Edge Cases
- [ ] TC-040: Empty cart state UI
- [ ] TC-041: Out of stock product → disabled Add to Cart
- [ ] TC-042: Network error during product load → retry button
- [ ] TC-043: App backgrounded and resumed mid-flow
```

---

## Evidence Collection & Reporting

### What to Capture at Each Step

```
For PASS steps:
  - One screenshot showing the successful state
  - Route assertion result (if route changed)
  - Step duration in ms

For FAIL steps:
  - Screenshot of failure state
  - Full Flutter error stack from get_flutter_errors()
  - Last 50 lines of logcat (level E and above)
  - Exact action sequence that led to failure
  - Device info (for reproducing)

For ALL steps:
  - Before/after screenshot pair for actions that change UI
  - Any visible error toasts or snackbars
```

### Report Generation

The agent calls `generate_test_report()` at the end of the session. Output formats:

**Markdown** (human review):
```markdown
# Test Report: ShopApp
Date: 2026-03-20 | Device: Pixel 8 API 34 | Duration: 4m 32s

## Summary
| | Count |
|---|---|
| ✅ Passed | 18 |
| ❌ Failed | 2 |
| ⏭ Skipped | 3 |

## Failures

### TC-013: Remove item from cart
**Status**: FAIL  
**Step**: Tapped remove button — app crashed  
**Error**: `E/FlutterApp: RangeError: index out of range...`  
**Logcat**: [error excerpt]  
**Screenshot**: [attached]  
**Repro**: Add item to cart → go to cart → swipe left on item → crash

### TC-042: Network error retry
**Status**: FAIL  
**Step**: Expected retry button, found empty screen with no affordance  
**Note**: UX issue — error state has no retry mechanism  
**Screenshot**: [attached]
```

**JUnit XML** (CI integration):
```xml
<testsuite name="ShopApp" tests="23" failures="2" skipped="3" time="272">
  <testcase name="TC-001 Successful login" classname="Auth" time="8.2"/>
  <testcase name="TC-013 Remove item from cart" classname="Cart" time="3.1">
    <failure message="App crashed on item removal">
      RangeError: index out of range at cart_controller.dart:87
    </failure>
  </testcase>
</testsuite>
```

---

## Setup Guide (Step by Step)

### Prerequisites

```bash
# 1. Install Go 1.22+
brew install go  # macOS
# or download from golang.org/dl

# 2. Android SDK with emulator tools
# Install via Android Studio or sdkmanager
# Required: platform-tools, emulator, system-images

# 3. Create an AVD (if you don't have one)
$ANDROID_HOME/tools/bin/avdmanager create avd \
  -n Pixel_8_API_34 \
  -k "system-images;android-34;google_apis;x86_64" \
  -d pixel_8

# 4. Flutter SDK (for driver integration)
# Only needed if using flutter_tap / flutter_assert tools
export FLUTTER_ROOT=/path/to/flutter
```

### Build the MCP Server

```bash
git clone <this-repo>
cd flutter-mcp-server

# Download dependencies
go mod tidy

# Build single binary
go build -o flutter-mcp-server ./...

# Test it works
./flutter-mcp-server --version
```

### Configure Flutter App for Testing

Your Flutter app needs minor changes to enable the semantics/VM service bridge:

```dart
// In main.dart — enable semantics for test builds
void main() {
  // Enable accessibility semantics (needed for get_flutter_semantics)
  WidgetsFlutterBinding.ensureInitialized();
  
  if (kDebugMode || kProfileMode) {
    // Enable full semantics tree exposure
    SemanticsBinding.instance.ensureSemantics();
  }
  
  runApp(const MyApp());
}
```

```dart
// Add meaningful keys and semantic labels to testable widgets
// Example: Login button
FilledButton(
  key: const Key('btn_login'),        // ValueKey for flutter_tap
  onPressed: _handleLogin,
  child: Text('Sign In'),
)

// Example: Email field
TextField(
  key: const Key('input_email'),
  decoration: InputDecoration(
    labelText: 'Email',
    hintText: 'Enter your email',
  ),
)
```

### Start a Test Session

```bash
# 1. Start the emulator
$ANDROID_HOME/emulator/emulator -avd Pixel_8_API_34 &

# 2. Wait for boot (the MCP server handles this too via start_emulator tool)
adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done'

# 3. Build and install your Flutter app in debug/profile mode
flutter build apk --debug
adb install build/app/outputs/flutter-apk/app-debug.apk

# 4. Start MCP server (Claude Code / Desktop picks this up via .mcp.json)
./flutter-mcp-server

# 5. In Claude Code or Claude Desktop, start a test session:
# "Test the ShopApp Flutter app. Package: com.example.shopapp.
#  Start with the login flow, then test the main shopping journey."
```

---

## Prompting the Agent — Effective Patterns

### Starting a Full Test Session

```
Test the Flutter app installed on the emulator.
Package name: com.example.myapp
App description: A fitness tracking app for logging workouts and viewing progress.

Test goals:
1. Auth flow (login, logout, forgot password)  
2. Create a new workout entry
3. View workout history and stats
4. Profile settings

Start by exploring the app. Take a screenshot first, then build a test plan.
Tell me if you need test credentials — I'll provide them when asked.
When finished, generate a markdown test report.
```

### Targeted Flow Testing

```
Test ONLY the checkout flow for the e-commerce app.
Package: com.example.shop
Assume the user is already logged in (credentials: email=test@shop.com password=Test1234).
Start at the product listing, add two items, go to checkout, and verify the order summary.
```

### Regression After Bug Fix

```
We fixed a crash in the cart removal flow (TC-013 from the last report).
Package: com.example.shop
Test specifically: add 3 items to cart → remove the middle item → verify cart 
shows 2 items correctly and no crash occurs. 
Evidence: screenshot before and after removal.
```

### Exploratory / Edge Case Mode

```
Exploratory test: look for crashes, layout overflows, and broken states.
Package: com.example.myapp
Specifically:
- Try every button without filling required fields first
- Rotate the screen during form entry (if the emulator supports it)
- Go back unexpectedly from multi-step flows
- Try very long strings in text fields (100+ chars)
Log every anomaly you find with a screenshot.
```

---

## Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---|---|---|
| `flutter_tap` can't find element | Widget has no semantics label or Key | Add `Key('...')` to widget in Flutter code |
| Screenshot is blank/black | App not in foreground | Call `launch_app` first, wait 2s |
| VM service connection refused | Port not forwarded | Server auto-runs `adb forward tcp:8181 tcp:8181` on connect |
| OTP test stuck indefinitely | Agent doesn't know to wait | Agent calls `request_otp()` which pauses until human responds |
| Random tap failures | Screen still animating | Use `tap_and_wait` instead of `tap_element` |
| Flutter errors not in logcat | Wrong tag filter | Use `get_flutter_errors()` which filters on `flutter` and `FlutterError` tags |
| App state leaks between tests | Previous session not cleared | Call `clear_app_data()` at start of each test suite |
| Emulator slow/laggy | Hardware acceleration off | Ensure HAXM/KVM enabled; use x86_64 system image |

---

## Extension Points

### Adding a New Tool

1. Create `tools/my_new_tool.go`
2. Implement the handler function
3. Register in `internal/mcp/tools.go` (add to `toolDefinitions`)
4. Wire the dispatch in `internal/mcp/server.go` in the `handleToolCall` switch

### iOS Support (Future)

Swap the ADB bridge for `libimobiledevice` + `xcrun simctl`. The MCP protocol and agent reasoning loop stay identical. Only the transport layer changes.

### CI/CD Integration

```yaml
# .github/workflows/mobile-test.yml
- name: Start emulator
  uses: reactivecircus/android-emulator-runner@v2
  with:
    api-level: 34
    target: google_apis
    arch: x86_64
    
- name: Run MATO tests
  run: |
    ./flutter-mcp-server &
    # Use Claude API to drive the agent
    curl https://api.anthropic.com/v1/messages \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -d @test-prompt.json > test-result.json
    
- name: Publish test report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: mato-report
    path: test-report.md
```

---

## File Output Reference

When `generate_test_report` is called, the server writes:

```
test-reports/
├── report.md              # Human-readable summary
├── report.json            # Machine-readable full data
├── report.junit.xml       # JUnit format for CI
└── screenshots/
    ├── step_001_pass.jpg
    ├── step_013_fail.jpg
    └── ...
```

---

*MATO Skill v1.0 — Flutter / Android Emulator / Go MCP Server*
*Designed for use with Claude Code, Claude Desktop, and any MCP-compatible AI agent.*
