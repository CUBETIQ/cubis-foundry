import { loadCatalog } from "../../catalog/index.js";
import type { Adapter, RuntimeId } from "../../catalog/types.js";
import type { CompilationContext, LoadStageOutput } from "../types.js";

/**
 * Stage 1 — Load the catalog and resolve the requested platform adapter.
 *
 * @param root  Root of the foundry workspace (contains package.json).
 * @param platform  Target runtime ID.  If omitted, the first available adapter is used.
 * @returns LoadStageOutput with the full catalog and resolved adapter.
 */
export async function loadStage(
  root: string,
  platform?: RuntimeId,
): Promise<LoadStageOutput> {
  const catalog = await loadCatalog(root);

  if (!platform) {
    // Default to the first available adapter.
    const first = catalog.adapters.values().next().value;
    if (!first) {
      throw new Error(
        "No adapters found in catalog. Cannot determine a default platform.",
      );
    }
    return { catalog, adapter: first };
  }

  const adapter = catalog.adapters.get(platform);
  if (!adapter) {
    const available = [...catalog.adapters.keys()].join(", ");
    throw new Error(
      `Adapter for platform "${platform}" not found. Available: ${available}`,
    );
  }

  return { catalog, adapter };
}

/**
 * Builds the initial CompilationContext from the load stage output.
 * Modules are not filtered yet — the resolve stage handles that.
 */
export function buildContext(
  loadOutput: LoadStageOutput,
  repoRoot?: string,
): CompilationContext {
  return {
    catalog: loadOutput.catalog,
    platform: loadOutput.adapter.platform,
    adapter: loadOutput.adapter,
    repoRoot,
    modules: [...loadOutput.catalog.modules.values()],
  };
}
