import { z } from "zod";

export const RuntimeIdSchema = z.enum([
  "codex",
  "claude",
  "copilot",
  "gemini",
  "antigravity",
]);

export const RuntimeSchema = z.object({
  id: RuntimeIdSchema,
  label: z.string(),
  since: z.string(),
});

export const InstallProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  modules: z.array(z.string()),
});

export const InstallComponentSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
});

export const BuildOutputsSchema = z.object({
  runtimeAssets: z.string(),
  cliDist: z.string(),
  docs: z.string(),
});

export const PackageManifestSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string(),
  description: z.string(),
  supportedRuntimes: z.array(RuntimeSchema),
  installProfiles: z.array(InstallProfileSchema),
  installComponents: z.array(InstallComponentSchema),
  buildOutputs: BuildOutputsSchema,
});

export const ModuleOutputSchema = z.object({
  type: z.enum(["skill", "rules", "workflow", "specialist", "contextDoc"]),
  path: z.string(),
  platforms: z.array(RuntimeIdSchema),
});

export const CapabilityContractSchema = z.object({
  type: z.enum(["stack", "tool", "pattern"]),
  domains: z.array(z.string()),
  outputs: z.array(ModuleOutputSchema),
});

export const TestSpecSchema = z.object({
  id: z.string(),
  description: z.string(),
  coverage: z.array(z.string()).optional(),
});

export const ModuleSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  kind: z.enum([
    "capability",
    "skill",
    "rule-pack",
    "workflow",
    "specialist",
    "compat-alias",
  ]),
  label: z.string(),
  description: z.string().min(10),
  dependencies: z.array(z.string()).default([]),
  profiles: z.array(z.string()).default([]),
  stability: z.enum(["experimental", "beta", "stable", "deprecated"]),
  capability: CapabilityContractSchema.optional(),
  tests: z.array(TestSpecSchema).optional(),
  routeHints: z.array(z.string()).default([]),
});

export const ContextDocTemplateSchema = z.object({
  id: z.string(),
  source: z.string(),
  output: z.string(),
  triggers: z.array(z.string()),
});

export const AdapterSchema = z.object({
  platform: RuntimeIdSchema,
  label: z.string(),
  rules: z.object({
    mergeStrategy: z.enum(["layered", "replace", "merge"]),
    userOverride: z.enum(["honor", "ignore", "warn"]),
    conflictResolution: z.enum(["user-first", "generated-first", "error"]),
    generate: z
      .object({
        type: z.string(),
        source: z.string(),
        output: z.string(),
      })
      .optional(),
  }),
  skills: z.object({
    projection: z
      .object({
        type: z.string(),
        transforms: z.array(z.unknown()),
      })
      .optional(),
    capabilityProjection: z
      .array(
        z.object({
          capability: z.string(),
          output: z.string(),
          template: z.string().optional(),
        }),
      )
      .optional(),
  }),
  workflows: z.object({
    projection: z.array(z.unknown()),
  }),
  specialists: z.object({
    projection: z.array(z.unknown()),
  }),
  contextDocs: z.object({
    enabled: z.boolean(),
    outputDir: z.string(),
    managedSections: z.boolean(),
    markers: z.object({
      prefix: z.string(),
      suffix: z.string(),
    }),
    templates: z.array(ContextDocTemplateSchema),
  }),
});
