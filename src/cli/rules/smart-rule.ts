import { z } from "zod";

// ─── Rule & RuleSet schemas ─────────────────────────────────────────────────

export const RuleSchema = z.object({
  id: z.string().min(1),
  scope: z.enum(["global", "project", "file", "prompt"]),
  condition: z.string().min(1),
  action: z.enum(["warn", "error", "suggest"]),
  priority: z.number().int(),
  message: z.string().min(1),
  userOverrideable: z.boolean(),
});

export type Rule = z.infer<typeof RuleSchema>;

export const RuleSetSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  rules: z.array(RuleSchema),
});

export type RuleSet = z.infer<typeof RuleSetSchema>;

/** Parsed + validated rule ready for execution */
export interface CompiledRule extends Rule {
  /** True when the condition matches the given context */
  matches: boolean;
}
