import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distEntry = path.join(repoRoot, "dist", "cli", "catalog", "index.js");

async function main() {
  let catalogApi;
  try {
    catalogApi = await import(pathToFileURL(distEntry).href);
  } catch (error) {
    console.error("Catalog validation requires a built CLI.");
    console.error("Run `npm run build:cli` first.");
    throw error;
  }

  const catalog = await catalogApi.loadCatalog(repoRoot);
  const result = catalogApi.validateCatalog(catalog);

  if (result.errors.length > 0) {
    console.error("Catalog validation failed:");
    for (const issue of result.errors) {
      console.error(`- ERROR ${issue.path}: ${issue.message}`);
    }
  }

  if (result.warnings.length > 0) {
    const sink = result.valid ? console.log : console.error;
    sink("Catalog validation warnings:");
    for (const issue of result.warnings) {
      sink(`- WARN ${issue.path}: ${issue.message}`);
    }
  }

  if (result.valid) {
    console.log(
      `Catalog is valid: ${catalog.modules.size} modules, ${catalog.adapters.size} adapters.`,
    );
    return;
  }

  process.exitCode = 1;
}

await main();
