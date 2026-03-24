#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createFixtureServer } from "./lib/fixture-server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturesRoot = path.join(root, "fixtures");
const scenariosRoot = path.join(root, "scenarios");
const reportsRoot = path.join(root, "reports");
const benchmarkRuntimePath = path.join(reportsRoot, "benchmark-runtime.json");
const executionPath = path.join(reportsRoot, "benchmark-execution.json");

function parseArgs(argv) {
  const args = {
    scenario: null,
    host: "127.0.0.1",
    port: 0,
    skipRouteChecks: false,
    skipAggregate: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--scenario") {
      args.scenario = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg.startsWith("--scenario=")) {
      args.scenario = arg.slice("--scenario=".length) || null;
      continue;
    }
    if (arg === "--host") {
      args.host = argv[index + 1] || args.host;
      index += 1;
      continue;
    }
    if (arg.startsWith("--host=")) {
      args.host = arg.slice("--host=".length) || args.host;
      continue;
    }
    if (arg === "--port") {
      args.port = Number.parseInt(argv[index + 1] || "0", 10);
      index += 1;
      continue;
    }
    if (arg.startsWith("--port=")) {
      args.port = Number.parseInt(arg.slice("--port=".length) || "0", 10);
      continue;
    }
    if (arg === "--skip-route-checks") {
      args.skipRouteChecks = true;
      continue;
    }
    if (arg === "--skip-aggregate") {
      args.skipAggregate = true;
    }
  }

  return args;
}

async function runNodeScript(scriptPath, args = []) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${path.relative(process.cwd(), scriptPath)} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function loadScenarioIds(targetScenario) {
  const files = (await fs.readdir(scenariosRoot))
    .filter((file) => file.endsWith(".json"))
    .sort();
  const ids = files.map((file) => file.replace(/\.json$/, ""));
  if (!targetScenario) return ids;
  if (!ids.includes(targetScenario)) {
    throw new Error(`Unknown scenario '${targetScenario}'`);
  }
  return [targetScenario];
}

function buildRoutes(scopeIds, includeAtlas) {
  const routes = [{ id: "hub", route: "/" }];
  for (const id of scopeIds) {
    routes.push({ id, route: `/${id}/` });
  }
  if (includeAtlas) {
    routes.push({ id: "style-atlas", route: "/style-atlas/" });
  }
  return routes;
}

async function startFixtureServer(host, port) {
  const server = createFixtureServer({ root: fixturesRoot, host, port });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve fixture server address.");
  }
  return {
    server,
    host,
    port: address.port,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

async function checkRoutes(baseUrl, routes) {
  const results = [];
  for (const route of routes) {
    const url = new URL(route.route, baseUrl).toString();
    const response = await fetch(url);
    results.push({
      id: route.id,
      route: route.route,
      url,
      status: response.status,
      ok: response.ok,
    });
  }
  return results;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function validateSupplementaryArtifacts(includeAtlas) {
  const atlasNote = path.join(reportsRoot, "style-atlas.md");
  const atlasScreenshot = path.join(reportsRoot, "style-atlas-desktop.png");
  const checks = [
    { id: "benchmark-runtime", path: benchmarkRuntimePath },
  ];

  if (includeAtlas) {
    checks.push(
      { id: "style-atlas-note", path: atlasNote },
      { id: "style-atlas-screenshot", path: atlasScreenshot },
    );
  }

  const results = [];
  for (const item of checks) {
    const present = await fs.access(item.path).then(() => true).catch(() => false);
    results.push({
      id: item.id,
      path: path.relative(process.cwd(), item.path),
      present,
    });
  }
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenarioIds = await loadScenarioIds(args.scenario);
  const scope = args.scenario ? "targeted" : "full-suite";
  const includeAtlas = scope === "full-suite";
  const syncScript = path.join(root, "scripts", "sync-scenario-artifacts.mjs");
  const aggregateScript = path.join(root, "scripts", "aggregate-gap-report.mjs");

  await runNodeScript(syncScript, args.scenario ? ["--scenario", args.scenario] : []);

  let fixtureServer;
  let routeResults = [];
  if (!args.skipRouteChecks) {
    fixtureServer = await startFixtureServer(args.host, args.port);
    const baseUrl = `http://${fixtureServer.host}:${fixtureServer.port}/`;
    routeResults = await checkRoutes(baseUrl, buildRoutes(scenarioIds, includeAtlas));
  }

  if (!args.skipAggregate) {
    await runNodeScript(aggregateScript);
  }

  const [benchmarkRuntime, supplementaryArtifacts] = await Promise.all([
    readJson(benchmarkRuntimePath),
    validateSupplementaryArtifacts(includeAtlas),
  ]);

  const executionArtifact = {
    trace_version: "1.0",
    route: {
      id: "ui-testing",
      command: "/ui-testing",
      scope,
    },
    execution: {
      started_at: new Date().toISOString(),
      sync_script: "ui-testing/scripts/sync-scenario-artifacts.mjs",
      aggregate_script: args.skipAggregate ? null : "ui-testing/scripts/aggregate-gap-report.mjs",
      route_checks: args.skipRouteChecks
        ? { status: "skipped", results: [] }
        : { status: routeResults.every((item) => item.ok) ? "passed" : "failed", results: routeResults },
    },
    benchmark_runtime: benchmarkRuntime,
    supplementary_artifacts: supplementaryArtifacts,
  };

  await fs.writeFile(executionPath, `${JSON.stringify(executionArtifact, null, 2)}\n`, "utf8");

  if (fixtureServer) {
    await fixtureServer.close();
  }

  process.stdout.write(`Wrote ${path.relative(process.cwd(), executionPath)}\n`);
}

main().catch(async (error) => {
  console.error(error.message || error);
  process.exit(1);
});
