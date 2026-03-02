# CLI UX Patterns

## Progress Indicators

### When to Use Each Type

| Type                           | When to Use          | Example                                        |
| ------------------------------ | -------------------- | ---------------------------------------------- |
| **Determinate** (progress bar) | Total count is known | Downloading 50 files, processing 200 records   |
| **Indeterminate** (spinner)    | Duration unknown     | Connecting to server, waiting for API response |
| **Multi-step** (sequential)    | Ordered pipeline     | Build → Test → Deploy                          |

### Progress Bar Components

```
  Downloading |████████████░░░░░░░░| 60% | 30/50 files | 2.3 MB/s | ETA: 12s
               ↑ visual bar          ↑ %    ↑ current/total  ↑ rate    ↑ ETA
```

| Component     | Include When                                     |
| ------------- | ------------------------------------------------ |
| Visual bar    | Always — gives immediate sense of progress       |
| Percentage    | Always — precise progress indication             |
| Current/Total | When count is meaningful (files, records, items) |
| Rate          | For data transfer or long operations             |
| ETA           | For operations > 10 seconds                      |

### Spinner Styles

Use spinners for operations where you can't predict completion:

```
⠋ Connecting to server...       # Braille dots (smooth, modern)
⣾ Building project...           # Braille dots (alternative)
◐ Running health checks...      # Circle quarters
⠸ Uploading artifacts...        # Dots
```

**Rules:**

- Update spinner text as the operation progresses through stages
- Stop the spinner before printing other output
- On success: replace with `✓` in green
- On failure: replace with `✗` in red

---

## Color Usage

### Semantic Colors

| Color        | Meaning                | Symbol | Usage                                     |
| ------------ | ---------------------- | ------ | ----------------------------------------- |
| **Red**      | Error, failure, danger | `✗`    | Fatal errors, destructive actions         |
| **Green**    | Success, completion    | `✓`    | Completed operations, confirmations       |
| **Yellow**   | Warning, caution       | `⚠`    | Non-fatal issues, deprecation notices     |
| **Blue**     | Info, neutral          | `ℹ`    | Status updates, informational messages    |
| **Cyan**     | Highlight, accent      |        | Commands, paths, important values         |
| **Dim/Gray** | Secondary, hint        |        | Timestamps, hints, less important details |
| **Bold**     | Emphasis               |        | Key values, headings, important names     |

### When to Disable Color

```javascript
function shouldUseColor() {
  // Respect NO_COLOR standard (https://no-color.org/)
  if (process.env.NO_COLOR !== undefined) return false;

  // Disable in CI environments
  if (process.env.CI) return false;

  // Disable when not a TTY (piped output)
  if (!process.stdout.isTTY) return false;

  // Disable if TERM is "dumb"
  if (process.env.TERM === "dumb") return false;

  return true;
}
```

### Accessibility: Symbols + Color, Not Color Alone

```
# GOOD — meaning conveyed by both symbol and color
✓ Tests passed                    (green + checkmark)
✗ Build failed                    (red + X)
⚠ Deprecated API version          (yellow + warning symbol)
ℹ Using default configuration     (blue + info symbol)

# BAD — meaning conveyed by color only
Tests passed                      (green text only)
Build failed                      (red text only)
```

**Rule:** Every colored message must also have a symbol or text prefix that conveys the same meaning. Users with color blindness or monochrome terminals must still understand the output.

---

## Help Text Design

### Command Help

```
USAGE
  $ mycli <command> [options]

COMMANDS
  init <name>       Create a new project from a template
  deploy            Deploy to target environment
  config            Manage configuration settings
  plugin            Manage CLI plugins

OPTIONS
  -v, --verbose     Enable verbose output
  -q, --quiet       Suppress all output except errors
  --no-color        Disable colored output
  --version         Show version number
  -h, --help        Show this help message

EXAMPLES
  $ mycli init my-app --template react
  $ mycli deploy --env production --dry-run
  $ mycli config set apiKey sk-1234
```

### Subcommand Help

```
USAGE
  $ mycli deploy [options]

DESCRIPTION
  Deploy the current project to the specified environment.
  Runs build, upload, and health check steps automatically.

OPTIONS
  -e, --env <name>        Target environment (required)
                           Allowed: staging, production
  --dry-run               Preview changes without deploying
  --tag <tag>             Deploy a specific version tag
  --timeout <seconds>     Deployment timeout (default: 300)
  --skip-health-check     Skip post-deploy health check
  --rollback-on-failure   Auto-rollback if health check fails

EXAMPLES
  # Deploy to staging
  $ mycli deploy --env staging

  # Dry run for production
  $ mycli deploy --env production --dry-run

  # Deploy specific version with auto-rollback
  $ mycli deploy --env production --tag v1.2.0 --rollback-on-failure
```

**Rules:**

- USAGE first, then DESCRIPTION (for subcommands), then OPTIONS, then EXAMPLES
- Align option descriptions in columns
- Show default values inline: `(default: 300)`
- Show allowed values inline: `Allowed: staging, production`
- Include 2-3 practical examples with comments

---

## Error Messages

### Good Pattern: Context → Problem → Solution

**Example 1: Missing configuration**

```
✗ Cannot deploy to production

  Configuration file not found at ~/.mycli/config.yaml
  This file is required for deployment credentials.

  To fix this:
    $ mycli config init
    $ mycli config set deploy.token <your-token>
```

**Example 2: Network failure**

```
✗ Failed to connect to registry

  Could not reach https://registry.example.com (connection timed out after 30s)

  Possible fixes:
    • Check your internet connection
    • Verify the registry URL: mycli config get registry.url
    • Try again with a longer timeout: --timeout 60
    • If behind a proxy, set HTTPS_PROXY environment variable
```

**Example 3: Validation error**

```
✗ Invalid project name: "My Project"

  Project names must be lowercase alphanumeric with hyphens only.
  Examples: my-project, api-v2, hello-world

  Try:
    $ mycli init my-project
```

### Error Message Guidelines

**DO:**

- Be specific about what failed and where
- Include the actual value that caused the error
- Suggest concrete fixes (commands, flags, config changes)
- Use plain language, not technical jargon
- Show the relevant file path or URL

**DON'T:**

- Show raw stack traces to end users (use `--verbose` for debug info)
- Use error codes without explanation (`Error: E4012`)
- Be vague (`Something went wrong`, `An error occurred`)
- Use technical jargon (`ECONNREFUSED`, `EPERM`, `segfault`)
- Blame the user (`You did something wrong`)

---

## Interactive Prompts

### Prompt Types

| Type         | When to Use             | Example                   |
| ------------ | ----------------------- | ------------------------- |
| **Text**     | Free-form input         | Project name, description |
| **Select**   | Single choice from list | Template, environment     |
| **Checkbox** | Multiple choices        | Features, plugins         |
| **Confirm**  | Yes/no decision         | Overwrite, deploy, delete |
| **Password** | Sensitive input         | API keys, tokens          |

### Prompt Guidelines

- **Show keyboard hints:** `↑/↓: navigate • space: toggle • enter: confirm`
- **Provide defaults:** Pre-fill with sensible values (current directory name, common choices)
- **Handle Ctrl+C gracefully:** Print "Operation cancelled." and exit with code 130
- **Never prompt in CI:** Detect non-interactive mode and use defaults or fail with a clear message
- **Every prompt must have a flag equivalent:** `--name`, `--template`, `--yes` for confirm-all

```
? Project name: (my-project) █
  ↑ question      ↑ default    ↑ cursor

? Select a template: (Use arrow keys)
❯ Default — Minimal starter template
  React — React with Vite
  Vue — Vue 3 with Vite
  Node API — Express REST API

? Select features: (Press <space> to select, <enter> to confirm)
 ◉ TypeScript
 ◉ ESLint
 ◯ Prettier
 ◯ Testing (Vitest)
 ◯ Docker

? Initialize git repository? (Y/n) █

? Enter your API key: ********█
```

---

## Output Formatting

### Tables

**Fancy (default for TTY):**

```
┌─────────────┬───────────┬─────────┬──────────────────┐
│ Environment │ Status    │ Version │ Last Deploy      │
├─────────────┼───────────┼─────────┼──────────────────┤
│ production  │ ✓ healthy │ v2.1.0  │ 2024-01-15 14:30 │
│ staging     │ ✓ healthy │ v2.2.0  │ 2024-01-16 09:15 │
│ development │ ⚠ degraded│ v2.2.0  │ 2024-01-16 11:00 │
└─────────────┴───────────┴─────────┴──────────────────┘
```

**Minimal (for piped output or `--plain`):**

```
ENVIRONMENT  STATUS     VERSION  LAST DEPLOY
production   healthy    v2.1.0   2024-01-15 14:30
staging      healthy    v2.2.0   2024-01-16 09:15
development  degraded   v2.2.0   2024-01-16 11:00
```

**JSON (for `--json` flag):**

```json
[
  {
    "environment": "production",
    "status": "healthy",
    "version": "v2.1.0",
    "lastDeploy": "2024-01-15T14:30:00Z"
  },
  {
    "environment": "staging",
    "status": "healthy",
    "version": "v2.2.0",
    "lastDeploy": "2024-01-16T09:15:00Z"
  }
]
```

### Lists

**Bulleted:**

```
  Installed plugins:
    • mycli-plugin-docker (v1.2.0)
    • mycli-plugin-aws (v0.8.3)
    • mycli-plugin-monitoring (v2.0.1)
```

**Numbered:**

```
  Migration steps:
    1. Back up database
    2. Run schema migration
    3. Deploy new version
    4. Verify health checks
    5. Update DNS records
```

**Tree:**

```
  my-project/
  ├── src/
  │   ├── index.ts
  │   ├── config.ts
  │   └── routes/
  │       ├── auth.ts
  │       └── users.ts
  ├── tests/
  │   └── index.test.ts
  ├── package.json
  └── tsconfig.json
```

---

## Status Messages

### Real-Time Multi-Step Updates

```
  ℹ Deploying to production...

  ✓ Building application          3.2s
  ✓ Running tests                 12.1s
  ✓ Uploading artifacts           1.8s
  ⠸ Running health checks...
```

Each step transitions from spinner → checkmark (or X on failure):

```
  ⠸ Building application...       # In progress (spinner)
  ✓ Building application  3.2s    # Complete (green check + duration)
  ✗ Running tests                  # Failed (red X)
```

### Summary / Completion

```
  ┌──────────────────────────────────────┐
  │                                      │
  │   ✓ Deployed to production           │
  │                                      │
  │   Version:  v2.1.0                   │
  │   URL:      https://app.example.com  │
  │   Duration: 17.1s                    │
  │                                      │
  └──────────────────────────────────────┘
```

Or simpler:

```
  ✓ Done! Deployed v2.1.0 to production in 17.1s

    URL: https://app.example.com
    Dashboard: https://dashboard.example.com/deploys/abc123
```

---

## Debugging & Verbose Mode

### Output Levels

**Normal (default):**

```
  ✓ Project created at ./my-project
```

**Verbose (`--verbose` or `-v`):**

```
  ℹ Creating project directory: /Users/dev/projects/my-project
  ℹ Using template: react (v3.2.0)
  ℹ Copying 23 template files...
  ℹ Installing 15 dependencies...
  ℹ Initializing git repository
  ✓ Project created at ./my-project
```

**Debug (`--debug` or `MYCLI_DEBUG=1`):**

```
  [DEBUG 14:30:01.123] Config loaded from: /Users/dev/.mycli/config.yaml
  [DEBUG 14:30:01.124] Template registry: https://registry.example.com/v2
  [DEBUG 14:30:01.125] GET https://registry.example.com/v2/templates/react
  [DEBUG 14:30:01.340] Response: 200 OK (215ms) — 4.2KB
  [DEBUG 14:30:01.341] Template version: 3.2.0 (latest)
  [DEBUG 14:30:01.342] Target directory: /Users/dev/projects/my-project
  [DEBUG 14:30:01.342] Directory created: /Users/dev/projects/my-project
  [DEBUG 14:30:01.345] Copying template files (23 files, 48KB)...
  ℹ Creating project directory: /Users/dev/projects/my-project
  ℹ Using template: react (v3.2.0)
  ...
```

**Rules:**

- Normal: Only results and errors. Minimal noise.
- Verbose: Add step-by-step progress. Useful for understanding what happened.
- Debug: Add timestamps, HTTP requests/responses, file paths, config values. Useful for bug reports.
- Debug output goes to stderr so stdout remains parseable.
- Never log secrets (API keys, tokens) even in debug mode.
