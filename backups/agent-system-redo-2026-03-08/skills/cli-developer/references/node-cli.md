# Node.js CLI Development

## Commander.js (Recommended)

Commander is the most widely used Node.js CLI framework. It provides a clean API for defining commands, options, and arguments.

```bash
npm install commander chalk ora inquirer cli-progress
```

### Full Example

```javascript
#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json" assert { type: "json" };

const program = new Command();

program
  .name("mycli")
  .description("A project scaffolding and deployment tool")
  .version(version, "-V, --version", "Show version number");

// --- init command ---
program
  .command("init <name>")
  .description("Create a new project")
  .option("-t, --template <template>", "Project template", "default")
  .option("-f, --force", "Overwrite existing directory", false)
  .option("--no-git", "Skip git initialization")
  .option("--package-manager <pm>", "Package manager to use", "npm")
  .action(async (name, options) => {
    const { init } = await import("./commands/init.js");
    await init(name, options);
  });

// --- deploy command ---
program
  .command("deploy")
  .description("Deploy to target environment")
  .requiredOption("-e, --env <environment>", "Target environment")
  .option("--dry-run", "Preview changes without deploying", false)
  .option("--tag <tag>", "Deploy specific version tag")
  .option("--timeout <seconds>", "Deployment timeout", parseInt, 300)
  .action(async (options) => {
    const { deploy } = await import("./commands/deploy.js");
    await deploy(options);
  });

// --- config command group ---
const configCmd = program.command("config").description("Manage configuration");

configCmd
  .command("get <key>")
  .description("Get a config value")
  .action(async (key) => {
    const { configGet } = await import("./commands/config.js");
    await configGet(key);
  });

configCmd
  .command("set <key> <value>")
  .description("Set a config value")
  .action(async (key, value) => {
    const { configSet } = await import("./commands/config.js");
    await configSet(key, value);
  });

configCmd
  .command("list")
  .description("List all config values")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const { configList } = await import("./commands/config.js");
    await configList(options);
  });

// --- Global error handling ---
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (
    error.code === "commander.helpDisplayed" ||
    error.code === "commander.version"
  ) {
    process.exit(0);
  }
  console.error(`\nError: ${error.message}`);
  process.exit(1);
}
```

---

## Yargs Alternative

Yargs uses a builder pattern and supports middleware.

```javascript
#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const cli = yargs(hideBin(process.argv))
  .scriptName("mycli")
  .usage("$0 <command> [options]")
  .middleware([
    (argv) => {
      // Runs before every command
      if (argv.verbose) {
        process.env.LOG_LEVEL = "debug";
      }
    },
  ])
  .command(
    "init <name>",
    "Create a new project",
    (yargs) => {
      return yargs
        .positional("name", {
          describe: "Project name",
          type: "string",
        })
        .option("template", {
          alias: "t",
          describe: "Project template",
          choices: ["default", "react", "vue", "node"],
          default: "default",
        });
    },
    async (argv) => {
      const { init } = await import("./commands/init.js");
      await init(argv.name, { template: argv.template });
    },
  )
  .command(
    "deploy",
    "Deploy to target environment",
    (yargs) => {
      return yargs
        .option("env", {
          alias: "e",
          describe: "Target environment",
          choices: ["staging", "production"],
          demandOption: true,
        })
        .option("dry-run", {
          describe: "Preview without deploying",
          type: "boolean",
          default: false,
        });
    },
    async (argv) => {
      const { deploy } = await import("./commands/deploy.js");
      await deploy(argv);
    },
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Enable verbose output",
  })
  .demandCommand(1, "You must specify a command")
  .strict()
  .help()
  .alias("help", "h")
  .version()
  .alias("version", "V")
  .epilogue("For more info, visit https://github.com/example/mycli");

await cli.parse();
```

---

## Interactive Prompts with Inquirer

```bash
npm install @inquirer/prompts
```

```javascript
import { input, select, checkbox, confirm, password } from "@inquirer/prompts";

// Text input
const projectName = await input({
  message: "Project name:",
  default: "my-project",
  validate: (value) => {
    if (!/^[a-z0-9-]+$/.test(value)) {
      return "Name must be lowercase alphanumeric with hyphens";
    }
    return true;
  },
});

// Select (single choice)
const template = await select({
  message: "Select a template:",
  choices: [
    {
      name: "Default",
      value: "default",
      description: "Minimal starter template",
    },
    { name: "React", value: "react", description: "React with Vite" },
    { name: "Vue", value: "vue", description: "Vue 3 with Vite" },
    { name: "Node API", value: "node", description: "Express REST API" },
  ],
});

// Checkbox (multiple choices)
const features = await checkbox({
  message: "Select features:",
  choices: [
    { name: "TypeScript", value: "typescript", checked: true },
    { name: "ESLint", value: "eslint", checked: true },
    { name: "Prettier", value: "prettier" },
    { name: "Testing (Vitest)", value: "testing" },
    { name: "Docker", value: "docker" },
    { name: "CI/CD (GitHub Actions)", value: "ci" },
  ],
});

// Confirm
const shouldInit = await confirm({
  message: "Initialize git repository?",
  default: true,
});

// Password (masked input)
const apiKey = await password({
  message: "Enter your API key:",
  mask: "*",
  validate: (value) => {
    if (value.length < 10) return "API key must be at least 10 characters";
    return true;
  },
});

console.log({ projectName, template, features, shouldInit, apiKey });
```

---

## Terminal Output with Chalk

```bash
npm install chalk
```

```javascript
import chalk from "chalk";

// Basic colors
console.log(chalk.red("Error: Something went wrong"));
console.log(chalk.green("✓ Success"));
console.log(chalk.yellow("⚠ Warning: Config file not found"));
console.log(chalk.blue("ℹ Info: Using default settings"));
console.log(chalk.gray("  Skipping optional step..."));

// Styles
console.log(chalk.bold("Important message"));
console.log(chalk.dim("Less important detail"));
console.log(chalk.underline("https://example.com"));
console.log(chalk.italic("Note: This is experimental"));

// Combinations
console.log(chalk.bold.red("✗ FATAL: Cannot continue"));
console.log(chalk.bgRed.white(" ERROR ") + " Missing required flag --env");
console.log(chalk.bgGreen.black(" DONE ") + " Deployment complete");

// Semantic logging helpers
const log = {
  info: (msg) => console.log(chalk.blue("ℹ") + " " + msg),
  success: (msg) => console.log(chalk.green("✓") + " " + msg),
  warn: (msg) => console.log(chalk.yellow("⚠") + " " + msg),
  error: (msg) => console.error(chalk.red("✗") + " " + msg),
  debug: (msg) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(chalk.gray("⊙ " + msg));
    }
  },
};

log.info("Loading configuration...");
log.success("Project created at ./my-project");
log.warn("Node.js 18+ recommended");
log.error("Failed to connect to registry");
log.debug('Request payload: { name: "test" }');
```

---

## Progress Indicators with Ora

```bash
npm install ora
```

```javascript
import ora from "ora";

// Basic spinner
const spinner = ora("Installing dependencies...").start();

try {
  await installDeps();
  spinner.succeed("Dependencies installed");
} catch (error) {
  spinner.fail("Failed to install dependencies");
  throw error;
}

// State updates during operation
const deploySpinner = ora("Deploying to production...").start();

deploySpinner.text = "Building application...";
await build();

deploySpinner.text = "Uploading artifacts...";
await upload();

deploySpinner.text = "Running health checks...";
await healthCheck();

deploySpinner.succeed("Deployed to production");

// Multiple sequential spinners
async function setupProject(name) {
  let spinner;

  spinner = ora("Creating project structure...").start();
  await createStructure(name);
  spinner.succeed("Project structure created");

  spinner = ora("Installing dependencies...").start();
  await installDeps(name);
  spinner.succeed("Dependencies installed");

  spinner = ora("Initializing git repository...").start();
  await gitInit(name);
  spinner.succeed("Git repository initialized");

  console.log(
    `\n  ${chalk.green("Done!")} Project ${chalk.bold(name)} is ready.\n`,
  );
  console.log(`  ${chalk.dim("$")} cd ${name}`);
  console.log(`  ${chalk.dim("$")} npm run dev\n`);
}
```

---

## Progress Bars with cli-progress

```bash
npm install cli-progress
```

```javascript
import cliProgress from "cli-progress";

// Single bar
const bar = new cliProgress.SingleBar({
  format: "  Downloading |{bar}| {percentage}% | {value}/{total} files",
  barCompleteChar: "█",
  barIncompleteChar: "░",
  hideCursor: true,
});

bar.start(100, 0);
for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await sleep(50);
}
bar.stop();

// Multi-bar (parallel operations)
const multibar = new cliProgress.MultiBar(
  {
    format: "  {task} |{bar}| {percentage}%",
    barCompleteChar: "█",
    barIncompleteChar: "░",
    clearOnComplete: false,
    hideCursor: true,
  },
  cliProgress.Presets.shades_grey,
);

const bar1 = multibar.create(100, 0, { task: "Frontend " });
const bar2 = multibar.create(100, 0, { task: "Backend  " });
const bar3 = multibar.create(100, 0, { task: "Database " });

// Simulate parallel progress
await Promise.all([
  simulateProgress(bar1, 100),
  simulateProgress(bar2, 100),
  simulateProgress(bar3, 100),
]);

multibar.stop();
```

---

## File System Helpers

```bash
npm install fs-extra globby
```

```javascript
import fs from "fs-extra";
import { globby } from "globby";

// fs-extra: copy, move, ensure directories
await fs.ensureDir("./output/assets");
await fs.copy("./template", "./my-project", {
  filter: (src) => !src.includes("node_modules"),
});
await fs.move("./old-name", "./new-name", { overwrite: true });
await fs.outputJson("./config.json", { key: "value" }, { spaces: 2 });
const config = await fs.readJson("./config.json");

// globby: find files with patterns
const sourceFiles = await globby(["src/**/*.ts", "!src/**/*.test.ts"]);
const configs = await globby(["**/tsconfig.json", "!node_modules"]);
const images = await globby(["assets/**/*.{png,jpg,svg}"]);

// Process matched files
for (const file of sourceFiles) {
  const content = await fs.readFile(file, "utf8");
  const transformed = transformContent(content);
  await fs.writeFile(file, transformed);
}
```

---

## Error Handling

```javascript
async function runCommand(command, options) {
  try {
    await command(options);
  } catch (error) {
    // Permission errors
    if (error.code === "EACCES") {
      console.error(chalk.red(`\n  Permission denied: ${error.path}`));
      console.error(
        chalk.dim(`  Try running with sudo or check file permissions.\n`),
      );
      process.exit(77);
    }

    // File not found
    if (error.code === "ENOENT") {
      console.error(chalk.red(`\n  File not found: ${error.path}`));
      console.error(
        chalk.dim(`  Make sure the path exists and is spelled correctly.\n`),
      );
      process.exit(1);
    }

    // Network errors
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.error(
        chalk.red(
          `\n  Network error: Could not connect to ${error.hostname || "server"}`,
        ),
      );
      console.error(
        chalk.dim(`  Check your internet connection and try again.\n`),
      );
      process.exit(1);
    }

    // Unknown errors
    console.error(chalk.red(`\n  Error: ${error.message}`));
    if (process.env.LOG_LEVEL === "debug") {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

// SIGINT handling
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n  Operation cancelled.\n"));
  process.exit(130);
});

// Unhandled rejections
process.on("unhandledRejection", (error) => {
  console.error(chalk.red(`\n  Unexpected error: ${error.message}`));
  if (process.env.LOG_LEVEL === "debug") {
    console.error(chalk.dim(error.stack));
  }
  process.exit(1);
});
```

---

## package.json Setup

```json
{
  "name": "mycli",
  "version": "1.0.0",
  "description": "A project scaffolding and deployment tool",
  "type": "module",
  "bin": {
    "mycli": "./bin/cli.js"
  },
  "files": ["bin/", "src/", "templates/"],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node bin/cli.js",
    "test": "vitest",
    "lint": "eslint src/",
    "prepublishOnly": "npm test && npm run lint"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "@inquirer/prompts": "^5.0.0",
    "fs-extra": "^11.2.0",
    "globby": "^14.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "execa": "^9.0.0"
  },
  "keywords": ["cli", "scaffold", "deploy"]
}
```

Make sure `bin/cli.js` starts with the shebang:

```javascript
#!/usr/bin/env node
```

And set executable permissions:

```bash
chmod +x bin/cli.js
```

---

## Testing CLIs

```bash
npm install -D vitest execa
```

```javascript
// test/cli.test.js
import { describe, it, expect } from "vitest";
import { execa } from "execa";

const CLI = "./bin/cli.js";

describe("mycli", () => {
  it("shows version", async () => {
    const { stdout } = await execa("node", [CLI, "--version"]);
    expect(stdout).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("shows help", async () => {
    const { stdout } = await execa("node", [CLI, "--help"]);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("init");
    expect(stdout).toContain("deploy");
    expect(stdout).toContain("config");
  });

  it("errors on unknown command", async () => {
    try {
      await execa("node", [CLI, "unknown"]);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error.exitCode).toBe(1);
      expect(error.stderr).toContain("unknown");
    }
  });

  it("init creates project directory", async () => {
    const { stdout } = await execa(
      "node",
      [CLI, "init", "test-project", "--template", "default"],
      {
        cwd: tmpDir,
      },
    );
    expect(stdout).toContain("Project test-project is ready");
    expect(fs.existsSync(path.join(tmpDir, "test-project"))).toBe(true);
  });

  it("deploy requires --env flag", async () => {
    try {
      await execa("node", [CLI, "deploy"]);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error.exitCode).not.toBe(0);
      expect(error.stderr).toContain("--env");
    }
  });
});
```
