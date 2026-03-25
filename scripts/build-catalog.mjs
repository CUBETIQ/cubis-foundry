import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distEntry = path.join(repoRoot, "dist", "cli", "compiler", "index.js");

async function main() {
  let compilerApi;
  try {
    compilerApi = await import(pathToFileURL(distEntry).href);
  } catch (error) {
    console.error("Catalog build requires a built CLI.");
    console.error("Run `npm run build:cli` first.");
    throw error;
  }

  const results = await compilerApi.compile(repoRoot);
  for (const result of results) {
    console.log(
      `Built ${result.platform}: ${result.assets.length} assets -> ${result.outputDir}`,
    );
  }
}

await main();
