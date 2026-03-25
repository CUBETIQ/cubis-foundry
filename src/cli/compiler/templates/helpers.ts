import type { RenderContext } from "./renderer.js";

/**
 * Detect the npm packages declared in the project (e.g. from package.json).
 * Currently returns an empty array — to be implemented when package analysis
 * is wired into the compilation context.
 */
export function detect_packages(_context: RenderContext): string[] {
  return [];
}

/**
 * Detect patterns (e.g. file glob patterns, code conventions) relevant to
 * the current module and platform.
 * Currently returns an empty array — to be implemented.
 */
export function detect_patterns(_context: RenderContext): string[] {
  return [];
}

/**
 * Return the npm script names defined in the project's package.json.
 * Currently returns an empty array — to be implemented.
 */
export function npm_scripts(_context: RenderContext): string[] {
  return [];
}
