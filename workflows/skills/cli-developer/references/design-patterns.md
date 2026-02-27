# CLI Design Patterns

## Command Hierarchy

Structure CLIs as a root command with subcommands. Each subcommand can have its own flags and arguments.

```
mycli                          # Root command
├── init [name]                # Subcommand with positional arg
│   ├── --template <name>      # Flag with value
│   └── --force                # Boolean flag
├── deploy                     # Subcommand
│   ├── --env <name>           # Required flag
│   └── --dry-run              # Boolean flag
├── config                     # Subcommand group
│   ├── get <key>              # Nested subcommand
│   ├── set <key> <value>      # Nested subcommand
│   └── list                   # Nested subcommand
└── --version                  # Root-level flag
```

**Rules:**

- Root command shows help by default (no silent no-op)
- Subcommands are verbs (`init`, `deploy`, `list`) or nouns for CRUD groups (`config`)
- Nest at most 2 levels deep (`mycli config set`)
- Global flags (`--verbose`, `--quiet`, `--no-color`) live on the root command

---

## Flag Conventions

### Boolean Flags

```
--force          # Affirmative
--no-cache       # Negated (prefix with "no-")
--dry-run        # Hyphenated compound
```

### Short + Long Forms

```
-f, --force
-v, --verbose
-o, --output <path>
-e, --env <name>
```

Reserve single letters for the most common flags. Avoid ambiguous shorts (`-d` for debug or deploy?).

### Required vs Optional

```
mycli deploy --env production        # --env is required (error if missing)
mycli deploy --env production --tag v1.2  # --tag is optional
```

Always provide a clear error when a required flag is missing:

```
Error: Missing required flag --env

Usage: mycli deploy --env <name> [--tag <tag>]
```

### Multiple Values

```
mycli test --ignore node_modules --ignore dist
mycli test --ignore node_modules,dist
```

Support both repeated flags and comma-separated values where it makes sense.

---

## Configuration Layers

Priority order (highest wins):

```
CLI flags > env vars > project config > user config > system config > defaults
```

```javascript
function resolveConfig(flags) {
  // 1. Defaults
  const config = {
    env: "development",
    port: 3000,
    verbose: false,
    logLevel: "info",
  };

  // 2. System config: /etc/mycli/config.json
  const systemConfig = loadJsonSafe("/etc/mycli/config.json");
  Object.assign(config, systemConfig);

  // 3. User config: ~/.mycli/config.json
  const userConfig = loadJsonSafe(
    path.join(os.homedir(), ".mycli", "config.json"),
  );
  Object.assign(config, userConfig);

  // 4. Project config: ./mycli.config.json or package.json "mycli" key
  const projectConfig = loadJsonSafe(path.resolve("mycli.config.json"));
  Object.assign(config, projectConfig);

  // 5. Environment variables: MYCLI_ENV, MYCLI_PORT, etc.
  if (process.env.MYCLI_ENV) config.env = process.env.MYCLI_ENV;
  if (process.env.MYCLI_PORT)
    config.port = parseInt(process.env.MYCLI_PORT, 10);
  if (process.env.MYCLI_LOG_LEVEL)
    config.logLevel = process.env.MYCLI_LOG_LEVEL;

  // 6. CLI flags (highest priority)
  if (flags.env !== undefined) config.env = flags.env;
  if (flags.port !== undefined) config.port = flags.port;
  if (flags.verbose) config.logLevel = "debug";

  return config;
}
```

**Env var naming:** Prefix with tool name, uppercase, underscores: `MYCLI_ENV`, `MYCLI_LOG_LEVEL`.

---

## Exit Codes

| Code  | Meaning           | When to Use                                      |
| ----- | ----------------- | ------------------------------------------------ |
| `0`   | Success           | Command completed without errors                 |
| `1`   | General error     | Unhandled exception, runtime failure             |
| `2`   | Misuse            | Invalid flags, missing required args, bad syntax |
| `77`  | Permission denied | Insufficient permissions for operation           |
| `127` | Command not found | Unknown subcommand or missing dependency         |
| `130` | SIGINT            | User pressed Ctrl+C                              |

```javascript
// Always exit with meaningful codes
process.on("SIGINT", () => {
  console.log("\nOperation cancelled.");
  process.exit(130);
});

try {
  await runCommand(args);
  process.exit(0);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Error: ${error.message}`);
    process.exit(2);
  }
  if (error.code === "EACCES") {
    console.error(`Permission denied: ${error.path}`);
    process.exit(77);
  }
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
```

---

## Plugin Architecture

Discover plugins from multiple sources:

```javascript
async function discoverPlugins(config) {
  const plugins = [];

  // 1. Built-in plugins directory
  const builtinDir = path.join(__dirname, "plugins");
  if (fs.existsSync(builtinDir)) {
    const builtins = fs
      .readdirSync(builtinDir)
      .filter((f) => f.endsWith(".js"));
    plugins.push(
      ...builtins.map((f) => ({
        source: "builtin",
        path: path.join(builtinDir, f),
      })),
    );
  }

  // 2. User plugins: ~/.mycli/plugins/
  const userPluginDir = path.join(os.homedir(), ".mycli", "plugins");
  if (fs.existsSync(userPluginDir)) {
    const userPlugins = fs
      .readdirSync(userPluginDir)
      .filter((f) => f.endsWith(".js"));
    plugins.push(
      ...userPlugins.map((f) => ({
        source: "user",
        path: path.join(userPluginDir, f),
      })),
    );
  }

  // 3. npm packages: mycli-plugin-*
  const nodeModules = path.resolve("node_modules");
  if (fs.existsSync(nodeModules)) {
    const npmPlugins = fs
      .readdirSync(nodeModules)
      .filter((name) => name.startsWith("mycli-plugin-"));
    plugins.push(
      ...npmPlugins.map((name) => ({
        source: "npm",
        path: path.join(nodeModules, name),
      })),
    );
  }

  // 4. Env var: MYCLI_PLUGINS (comma-separated paths)
  if (process.env.MYCLI_PLUGINS) {
    const envPlugins = process.env.MYCLI_PLUGINS.split(",").map((p) =>
      p.trim(),
    );
    plugins.push(...envPlugins.map((p) => ({ source: "env", path: p })));
  }

  return plugins;
}

// Plugin interface
// Each plugin exports: { name, version, register(cli) }
function loadPlugin(pluginPath) {
  const plugin = require(pluginPath);
  if (!plugin.name || !plugin.register) {
    throw new Error(
      `Invalid plugin at ${pluginPath}: must export { name, register }`,
    );
  }
  return plugin;
}
```

---

## Error Handling Patterns

### Good: Context → Problem → Solution

```
✗ Failed to deploy to production

  Could not connect to server api.example.com:443
  Connection timed out after 30s.

  Possible fixes:
    • Check your internet connection
    • Verify the server URL in ~/.mycli/config.json
    • Try again with --timeout 60
```

### Bad: Raw Error Codes

```
Error: ECONNREFUSED 10.0.0.1:443
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
```

**Rules:**

- Always say WHAT failed, WHY it failed, and HOW to fix it
- Never show stack traces to end users (use `--verbose` for debug info)
- Use color: red for errors, yellow for warnings
- Include the failing value when relevant (`Expected "production" or "staging", got "prod"`)

---

## Interactive vs Non-Interactive Mode

```javascript
function isInteractive() {
  // Non-interactive if any CI env is set
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) return false;
  if (process.env.BUILD_NUMBER || process.env.GITHUB_ACTIONS) return false;

  // Non-interactive if not a TTY
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false;

  return true;
}

async function getProjectName(flags) {
  // Flag always wins
  if (flags.name) return flags.name;

  // Interactive: prompt the user
  if (isInteractive()) {
    const { name } = await inquirer.prompt({
      type: "input",
      name: "name",
      message: "Project name:",
      default: path.basename(process.cwd()),
    });
    return name;
  }

  // Non-interactive: use default or error
  return path.basename(process.cwd());
}
```

**Rules:**

- Every interactive prompt must have a flag equivalent
- In CI, never block waiting for input — use defaults or fail with a clear message
- Detect CI broadly: `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `JENKINS`, `CIRCLECI`, `BUILD_NUMBER`

---

## State Management

```
~/.mycli/
├── config.json          # User preferences
├── credentials.json     # Auth tokens (600 permissions)
├── cache/               # Cached data (safe to delete)
│   ├── templates/       # Downloaded templates
│   └── registry.json    # Package registry cache
├── plugins/             # User-installed plugins
├── logs/                # Debug logs (rotated)
│   └── debug.log
└── update-check.json    # Last update check timestamp
```

**Rules:**

- Use `XDG_CONFIG_HOME` on Linux, `~/Library/Application Support/` on macOS, `%APPDATA%` on Windows — or fall back to `~/.mycli/`
- Credentials file: `chmod 600` (owner read/write only)
- Cache is ephemeral — always handle missing cache gracefully
- Rotate logs (keep last 5, max 10MB each)

---

## Performance Patterns

### Lazy Loading

```javascript
// Don't import everything at startup
// BAD
const deploy = require("./commands/deploy");
const init = require("./commands/init");
const config = require("./commands/config");

// GOOD — load only the command being run
program.command("deploy").action(async (options) => {
  const { deploy } = await import("./commands/deploy.js");
  await deploy(options);
});
```

### Caching

```javascript
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedOrFetch(key, fetchFn) {
  const cachePath = path.join(os.homedir(), ".mycli", "cache", `${key}.json`);

  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const data = await fetchFn();
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
}
```

### Async Operations

```javascript
// Run independent operations in parallel
const [templates, config, plugins] = await Promise.all([
  loadTemplates(),
  loadConfig(),
  discoverPlugins(),
]);

// Stream large outputs instead of buffering
const stream = createReadStream(logFile);
stream.pipe(process.stdout);
```

---

## Versioning & Updates

### Non-Blocking Update Check

```javascript
async function checkForUpdates(currentVersion) {
  const checkFile = path.join(os.homedir(), ".mycli", "update-check.json");
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Don't check more than once per day
  if (fs.existsSync(checkFile)) {
    const last = JSON.parse(fs.readFileSync(checkFile, "utf8"));
    if (Date.now() - last.timestamp < ONE_DAY) return;
  }

  try {
    // Fire and forget — don't block the command
    const latest = await fetchLatestVersion("mycli");
    if (semver.gt(latest, currentVersion)) {
      // Show after command completes, not before
      process.on("exit", () => {
        console.log(`\n  Update available: ${currentVersion} → ${latest}`);
        console.log(`  Run "npm install -g mycli" to update\n`);
      });
    }
    fs.writeFileSync(
      checkFile,
      JSON.stringify({ timestamp: Date.now(), latest }),
    );
  } catch {
    // Silently ignore — network issues shouldn't break the CLI
  }
}
```

### Version Compatibility

```javascript
// Check minimum Node.js version in package.json engines
// Then verify at runtime:
const MIN_NODE = "18.0.0";
if (semver.lt(process.version.slice(1), MIN_NODE)) {
  console.error(
    `mycli requires Node.js ${MIN_NODE} or higher (current: ${process.version})`,
  );
  process.exit(1);
}
```

---

## Help Text Design

```
USAGE
  $ mycli <command> [options]

COMMANDS
  init <name>       Create a new project
  deploy            Deploy to target environment
  config            Manage configuration
  plugin            Manage plugins

OPTIONS
  -v, --verbose     Enable verbose output
  -q, --quiet       Suppress all output except errors
  --no-color        Disable colored output
  --version         Show version number
  -h, --help        Show help

EXAMPLES
  $ mycli init my-app --template react
  $ mycli deploy --env production --dry-run
  $ mycli config set apiKey sk-1234
```

**Rules:**

- Show USAGE first, then COMMANDS, then OPTIONS, then EXAMPLES
- Align descriptions in columns
- Include 2-3 real-world examples
- Subcommand help shows its own flags, not global flags
- Use `$` prefix in examples to indicate shell commands
