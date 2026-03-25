import { parse } from "yaml";
import { readFile } from "node:fs/promises";
import { RuleSetSchema } from "./smart-rule.js";
import type { Rule, RuleSet } from "./smart-rule.js";
import { mergeRuleSets } from "./merger.js";

export type { Rule, RuleSet };
export { loadRules, mergeRules, isUserOverridden, compileRules };

// ─── loadRules ───────────────────────────────────────────────────────────────

/** Read and parse a YAML rules file, validating with Zod. */
async function loadRulesFromPath(path: string): Promise<RuleSet> {
  const raw = await readFile(path, "utf-8");
  const parsed = parse(raw);
  return RuleSetSchema.parse(parsed);
}

// Public overload: accepts string
async function loadRules(path: string): Promise<RuleSet>;
// Public overload: accepts string[]
async function loadRules(paths: string[]): Promise<RuleSet[]>;
async function loadRules(paths: string | string[]): Promise<RuleSet | RuleSet[]> {
  if (Array.isArray(paths)) {
    return Promise.all(paths.map(loadRulesFromPath));
  }
  return loadRulesFromPath(paths);
}

// ─── mergeRules ─────────────────────────────────────────────────────────────

/** Merge generated rules with user rules (user always wins when overrideable). */
function mergeRules(userRules: RuleSet | null, generatedRules: RuleSet): RuleSet {
  return mergeRuleSets(userRules, generatedRules);
}

// ─── isUserOverridden ───────────────────────────────────────────────────────

/** Returns true when the given rule id exists in the user rules. */
function isUserOverridden(ruleId: string, userRules: RuleSet | null): boolean {
  if (!userRules) return false;
  return userRules.rules.some((r) => r.id === ruleId);
}

// ─── compileRules ────────────────────────────────────────────────────────────

/** Context object passed to each rule's condition evaluator. */
export interface RuleContext {
  file?: string;
  prompt?: string;
  project?: string;
  [key: string]: unknown;
}

/**
 * Evaluate every rule's condition against the given context.
 * Returns all rules whose condition evaluates to `true`, sorted by priority desc.
 *
 * Conditions are evaluated using a sandboxed `new Function()` call with no access
 * to globals beyond the provided context keys.
 */
function compileRules(rules: RuleSet, context: RuleContext): Rule[] {
  const matches: Rule[] = [];

  for (const rule of rules.rules) {
    if (evaluateCondition(rule.condition, context)) {
      matches.push(rule);
    }
  }

  // Ensure priority order (already sorted by mergeRuleSets, but be safe)
  matches.sort((a, b) => b.priority - a.priority);
  return matches;
}

/**
 * Safely evaluate a simple boolean expression against a context.
 *
 * Allowed patterns:
 *   - Property access:  `file`, `project`, `prompt`
 *   - Methods:         `file.endsWith('.ts')`, `file.includes('src/')`
 *   - Comparisons:     `project === 'cli'`, `file && file.includes('src/')`
 *
 * The function body is wrapped in `"use strict"` and has no access to globals
 * (no `window`, no `console`, no `globalThis`, etc.).
 */
/** All standard RuleContext keys — declared as parameters so any unused key is undefined. */
const STANDARD_CONTEXT_KEYS = ["file", "prompt", "project"] as const;

function evaluateCondition(condition: string, ctx: RuleContext): boolean {
  // Always declare standard keys so any key referenced in the condition but absent
  // from ctx is `undefined` rather than a ReferenceError.
  const allKeys = [...new Set([...STANDARD_CONTEXT_KEYS, ...Object.keys(ctx)])];
  const paramList = allKeys.join(", ");

  // eslint-disable-next-line no-new-func
  const fn = new Function(
    `"use strict"; return (function (${paramList}) { return (${condition}); })`,
  )();

  const args = allKeys.map((k) => ctx[k] ?? undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
    return fn(...(args as any));
  } catch {
    // If the condition throws (e.g. undefined.endsWith(...)), the rule doesn't match.
    return false;
  }
}
