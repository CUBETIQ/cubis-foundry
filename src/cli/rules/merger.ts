import type { Rule, RuleSet } from "./smart-rule.js";

/**
 * Merge two rule sets, preferring user rules when userOverrideable is true.
 *
 * - Rules that only exist in one set are kept as-is.
 * - For rules with the same `id`:
 *   - If the user version has `userOverrideable === true`, the user version wins.
 *   - If `userOverrideable === false`, the generated version wins.
 * - Result is sorted by priority descending.
 */
export function mergeRuleSets(
  userRules: RuleSet | null,
  generatedRules: RuleSet,
): RuleSet {
  const mergedRules: Rule[] = [];

  // Index generated rules by id for fast lookup
  const generatedMap = new Map<string, Rule>();
  for (const rule of generatedRules.rules) {
    generatedMap.set(rule.id, rule);
  }

  // Index user rules by id for fast lookup
  const userMap = new Map<string, Rule>();
  if (userRules) {
    for (const rule of userRules.rules) {
      userMap.set(rule.id, rule);
    }
  }

  // Collect all unique rule ids
  const allIds = new Set([...generatedMap.keys(), ...userMap.keys()]);

  for (const id of allIds) {
    const generated = generatedMap.get(id);
    const user = userMap.get(id);

    if (generated && user) {
      // If the generated rule forbids overriding, it always wins.
      // Otherwise the user version wins (userOverrideable === true on generated).
      mergedRules.push(generated.userOverrideable ? user : generated);
    } else if (generated) {
      mergedRules.push(generated);
    } else if (user) {
      mergedRules.push(user);
    }
  }

  // Sort by priority descending (higher priority first)
  mergedRules.sort((a, b) => b.priority - a.priority);

  return {
    id: generatedRules.id,
    version: generatedRules.version,
    rules: mergedRules,
  };
}
