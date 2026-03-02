#!/usr/bin/env node

import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCb);

const thisFilePath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(thisFilePath);
const repoRoot = path.resolve(scriptsDir, "..");
const cliPath = path.join(repoRoot, "bin", "cubis.js");
const resultsPath = path.join(repoRoot, "TECH_SCANNER_TEST_RESULTS.md");

function nowIso() {
  return new Date().toISOString();
}

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

async function createWorkspace(baseDir, name, files) {
  const workspaceDir = path.join(baseDir, name);
  await mkdir(workspaceDir, { recursive: true });
  await mkdir(path.join(workspaceDir, ".git"), { recursive: true });

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(workspaceDir, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf8");
  }

  return workspaceDir;
}

async function generateTechMd(workspaceDir, { compact = false } = {}) {
  const args = [cliPath, "rules", "tech-md", "--overwrite"];
  if (compact) args.push("--compact");
  await execFile(process.execPath, args, {
    cwd: workspaceDir,
    env: process.env
  });

  const techPath = path.join(workspaceDir, "TECH.md");
  const content = await readFile(techPath, "utf8");
  return normalizeNewlines(content);
}

function assertIncludes(content, patterns) {
  const missing = [];
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      missing.push(pattern);
    }
  }
  return missing;
}

function assertNotIncludes(content, patterns) {
  const found = [];
  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      found.push(pattern);
    }
  }
  return found;
}

function techPreview(content, maxLines = 32) {
  return content.split("\n").slice(0, maxLines).join("\n");
}

function buildResultMarkdown({ startedAt, finishedAt, passedCount, failedCount, cases }) {
  const lines = [];
  lines.push("# TECH Scanner Test Results");
  lines.push("");
  lines.push(`Generated at: ${finishedAt}`);
  lines.push(`Started at: ${startedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total cases: ${cases.length}`);
  lines.push(`- Passed: ${passedCount}`);
  lines.push(`- Failed: ${failedCount}`);
  lines.push("");

  for (const result of cases) {
    lines.push(`## ${result.status === "PASS" ? "PASS" : "FAIL"}: ${result.name}`);
    lines.push(`- Description: ${result.description}`);
    lines.push(`- Workspace: \`${result.workspaceDir}\``);
    if (result.error) {
      lines.push(`- Error: \`${result.error}\``);
    }
    if (result.missing.length > 0) {
      lines.push("- Missing expected markers:");
      for (const marker of result.missing) {
        lines.push(`  - \`${marker}\``);
      }
    }
    if (result.unexpected.length > 0) {
      lines.push("- Unexpected markers present:");
      for (const marker of result.unexpected) {
        lines.push(`  - \`${marker}\``);
      }
    }
    lines.push("");
    lines.push("### TECH.md Preview");
    lines.push("```md");
    lines.push(result.preview);
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

const testCases = [
  {
    name: "flutter-go-router-riverpod",
    description: "Detect Flutter stack with go_router and riverpod packages from pubspec.",
    files: {
      "pubspec.yaml": `name: sample_app\nenvironment:\n  sdk: ^3.4.0\ndependencies:\n  flutter:\n    sdk: flutter\n  flutter_riverpod: ^2.5.1\n  go_router: ^14.2.0\n  dio: ^5.7.0\ndev_dependencies:\n  flutter_test:\n    sdk: flutter\n`,
      "pubspec.lock": "# lock\n",
      "lib/main.dart": "void main() {}\n"
    },
    includes: [
      "- Flutter",
      "- Riverpod",
      "- go_router",
      "### Dart / Flutter (pubspec.yaml)",
      "`flutter_riverpod`",
      "`go_router`",
      "`dio`"
    ]
  },
  {
    name: "nextjs-stack",
    description: "Detect Next.js/React/Tailwind from package.json dependencies.",
    files: {
      "package.json": JSON.stringify(
        {
          name: "next-app",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            test: "vitest"
          },
          dependencies: {
            next: "15.0.0",
            react: "19.0.0",
            "react-dom": "19.0.0"
          },
          devDependencies: {
            tailwindcss: "4.0.0",
            vitest: "2.0.0"
          }
        },
        null,
        2
      ),
      "pages/index.tsx": "export default function Home(){return null}\n"
    },
    includes: [
      "- Next.js",
      "- React",
      "- Tailwind CSS",
      "### JavaScript / TypeScript (package.json)",
      "`next`",
      "`react`",
      "`tailwindcss`",
      "`dev`: `next dev`"
    ]
  },
  {
    name: "nestjs-stack",
    description: "Detect NestJS from dependency graph.",
    files: {
      "package.json": JSON.stringify(
        {
          name: "nest-app",
          dependencies: {
            "@nestjs/core": "11.0.0",
            "@nestjs/common": "11.0.0",
            rxjs: "7.8.0"
          }
        },
        null,
        2
      ),
      "src/main.ts": "console.log('nest');\n"
    },
    includes: ["- NestJS", "`@nestjs/core`", "`@nestjs/common`"]
  },
  {
    name: "go-fiber-stack",
    description: "Detect Go Fiber module from go.mod requirements.",
    files: {
      "go.mod": `module sample/service\n\ngo 1.22\n\nrequire (\n  github.com/gofiber/fiber/v2 v2.52.5\n  github.com/google/uuid v1.6.0\n)\n`,
      "main.go": "package main\nfunc main(){}\n"
    },
    includes: [
      "- Go Modules",
      "- Go Fiber",
      "### Go Modules (go.mod)",
      "`github.com/gofiber/fiber/v2`"
    ]
  },
  {
    name: "python-fastapi-requirements",
    description: "Detect FastAPI and related packages from requirements.txt.",
    files: {
      "requirements.txt": "fastapi==0.115.2\nuvicorn[standard]>=0.31.0\npydantic>=2.8.0\n",
      "app/main.py": "from fastapi import FastAPI\napp=FastAPI()\n"
    },
    includes: [
      "- Python",
      "- FastAPI",
      "### Python Packages (requirements / pyproject)",
      "`fastapi`",
      "`uvicorn`",
      "`pydantic`"
    ]
  },
  {
    name: "python-pyproject-poetry",
    description: "Detect python packages from pyproject.toml poetry dependencies.",
    files: {
      "pyproject.toml": `[tool.poetry]\nname = "py-app"\nversion = "0.1.0"\n\n[tool.poetry.dependencies]\npython = "^3.12"\nfastapi = "^0.115.0"\nuvicorn = "^0.31.0"\n`,
      "service/main.py": "print('hello')\n"
    },
    includes: ["- Python", "- FastAPI", "`fastapi`", "`uvicorn`"]
  },
  {
    name: "rust-axum-stack",
    description: "Detect Rust crates and Axum framework from Cargo.toml.",
    files: {
      "Cargo.toml": `[package]\nname = "api"\nversion = "0.1.0"\n\n[dependencies]\naxum = "0.7"\ntokio = { version = "1", features = ["full"] }\nserde = "1"\n`,
      "src/main.rs": "fn main() {}\n"
    },
    includes: ["- Rust Cargo", "- Axum", "- Tokio", "### Rust Crates (Cargo.toml)", "`axum`", "`tokio`"]
  },
  {
    name: "monorepo-nested-package-json",
    description: "Detect framework signals from nested package.json files in monorepo.",
    files: {
      "package.json": JSON.stringify({ name: "mono", private: true }, null, 2),
      "apps/web/package.json": JSON.stringify(
        {
          name: "web",
          dependencies: {
            next: "15.0.0",
            react: "19.0.0"
          }
        },
        null,
        2
      ),
      "apps/web/pages/index.tsx": "export default function P(){return null}\n"
    },
    includes: ["- Next.js", "`next`", "`react`"]
  },
  {
    name: "ignore-node-modules",
    description: "Ensure ignored directories do not leak false package signals.",
    files: {
      "package.json": JSON.stringify({ name: "clean", private: true }, null, 2),
      "src/index.js": "console.log('ok')\n",
      "node_modules/fake/package.json": JSON.stringify(
        {
          name: "fake",
          dependencies: {
            "totally-fake-framework": "1.0.0"
          }
        },
        null,
        2
      )
    },
    includes: ["### JavaScript / TypeScript (package.json)"],
    notIncludes: ["`totally-fake-framework`"]
  },
  {
    name: "compact-mode-with-mcp-signal",
    description: "Compact mode should keep context budget sections and omit verbose package/tooling sections.",
    compact: true,
    files: {
      "package.json": JSON.stringify(
        {
          name: "compact-next-app",
          private: true,
          dependencies: {
            next: "15.0.0",
            react: "19.0.0"
          }
        },
        null,
        2
      ),
      ".vscode/mcp.json": JSON.stringify(
        {
          servers: {
            postman: {
              url: "https://mcp.postman.com/minimal"
            }
          }
        },
        null,
        2
      )
    },
    includes: ["Mode: compact.", "`.vscode/mcp.json`", "- Suggested MCP inclusion: `--include-mcp`"],
    notIncludes: [
      "## Package Signals",
      "## Tooling and Lockfiles",
      "## Key Scripts",
      "## Important Top-Level Paths"
    ]
  }
];

const COMMON_INCLUDES = ["## Recommended Skills", "## MCP Footprint", "## Context Budget Notes"];

async function run() {
  const startedAt = nowIso();
  const testRoot = await mkdtemp(path.join(os.tmpdir(), "cbx-tech-scanner-"));
  const results = [];

  try {
    for (const testCase of testCases) {
      const workspaceDir = await createWorkspace(testRoot, testCase.name, testCase.files);
      const result = {
        name: testCase.name,
        description: testCase.description,
        workspaceDir,
        status: "PASS",
        missing: [],
        unexpected: [],
        error: null,
        preview: ""
      };

      try {
        const techContent = await generateTechMd(workspaceDir, { compact: Boolean(testCase.compact) });
        result.missing = assertIncludes(techContent, [...COMMON_INCLUDES, ...(testCase.includes || [])]);
        result.unexpected = assertNotIncludes(techContent, testCase.notIncludes || []);
        if (result.missing.length > 0 || result.unexpected.length > 0) {
          result.status = "FAIL";
        }
        result.preview = techPreview(techContent);
      } catch (error) {
        result.status = "FAIL";
        result.error = error instanceof Error ? error.message : String(error);
      }

      results.push(result);
    }

    const passedCount = results.filter((item) => item.status === "PASS").length;
    const failedCount = results.length - passedCount;
    const finishedAt = nowIso();

    const report = buildResultMarkdown({
      startedAt,
      finishedAt,
      passedCount,
      failedCount,
      cases: results
    });

    await writeFile(resultsPath, report, "utf8");

    console.log(`Tech scanner tests completed: ${passedCount}/${results.length} passed.`);
    console.log(`Report: ${resultsPath}`);

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
}

run().catch(async (error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  const fallback = [
    "# TECH Scanner Test Results",
    "",
    `Generated at: ${nowIso()}`,
    "",
    "## Summary",
    "- Total cases: 0",
    "- Passed: 0",
    "- Failed: 1",
    "",
    "## Fatal Error",
    "```txt",
    message,
    "```",
    ""
  ].join("\n");
  await writeFile(resultsPath, fallback, "utf8");
  console.error(message);
  process.exit(1);
});
