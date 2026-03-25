import type { Module } from "../../catalog/types.js";
import type { CompilationContext, ResolveStageOutput } from "../types.js";

/**
 * Stage 3 — Resolve module dependencies and produce a stable execution order.
 *
 * Uses Kahn's algorithm for topological sorting:
 *  1. Build a dependency graph and compute in-degree for each module.
 *  2. Process modules with in-degree 0 (no unsatisfied dependencies).
 *  3. When a module is resolved, decrement the in-degree of its dependents.
 *  4. Any modules left unresolved form one or more cycles — throw an error.
 */
export async function resolveStage(
  ctx: CompilationContext,
): Promise<ResolveStageOutput> {
  const modules = ctx.modules;

  // Build id → module lookup.
  const moduleById = new Map<string, Module>();
  for (const m of modules) {
    moduleById.set(m.id, m);
  }

  // Validate that all dependency IDs actually exist in this module set.
  for (const m of modules) {
    for (const depId of m.dependencies) {
      if (!moduleById.has(depId)) {
        throw new Error(
          `ResolveError: module '${m.id}' declares unknown dependency '${depId}'`,
        );
      }
    }
  }

  // in-degree[m] = number of dependencies m has that are not yet resolved.
  const inDegree = new Map<string, number>();
  // dependents[m] = modules that list m as a direct dependency.
  const dependents = new Map<string, string[]>();

  for (const m of modules) {
    inDegree.set(m.id, m.dependencies.length);
    dependents.set(m.id, []);
  }

  // Populate dependents (reverse edges).
  for (const m of modules) {
    for (const depId of m.dependencies) {
      dependents.get(depId)!.push(m.id);
    }
  }

  // Kahn's algorithm: start with all modules that have no dependencies.
  const queue: string[] = [];
  for (const m of modules) {
    if (inDegree.get(m.id)! === 0) {
      queue.push(m.id);
    }
  }

  const orderedIds: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    orderedIds.push(id);

    // Every module that depends on `id` gets one fewer unresolved dependency.
    for (const dependentId of dependents.get(id) ?? []) {
      const newDegree = inDegree.get(dependentId)! - 1;
      inDegree.set(dependentId, newDegree);
      if (newDegree === 0) {
        queue.push(dependentId);
      }
    }
  }

  // If not all modules made it into the sorted list, there is a cycle.
  if (orderedIds.length !== modules.length) {
    const remaining = modules
      .map((m) => m.id)
      .filter((id) => !orderedIds.includes(id));

    // Build a human-readable cycle description using the remaining module IDs.
    // Trace a path from the first remaining module by following its deps
    // until we loop back.
    const cycleIds: string[] = [];
    const seen = new Set<string>();

    // Start from the first remaining module and follow dependencies to build
    // the cycle segment. We stop when we revisit a node already in cycleIds.
    let current = remaining[0]!;
    while (!seen.has(current)) {
      seen.add(current);
      cycleIds.push(current);
      const m = moduleById.get(current)!;
      // Follow the first remaining dependency to extend the path.
      const next = m.dependencies.find((d) => remaining.includes(d));
      if (!next) break;
      current = next;
    }

    const cycleLabel =
      cycleIds.length > 0
        ? cycleIds.join(" → ") + " → " + cycleIds[0]!
        : remaining.join(", ");

    throw new Error(
      `Circular dependency detected: module '${cycleIds[0] ?? remaining[0]}' ` +
        `depends on '${cycleIds[1] ?? remaining[1]}' which depends on ` +
        `'${cycleIds[2] ?? remaining[2] ?? cycleIds[0] ?? remaining[0]}'`,
    );
  }

  // Preserve stable order: return in the same order that Kahn's algorithm resolved them.
  const orderedModules = orderedIds.map((id) => moduleById.get(id)!);

  return { orderedModules };
}
