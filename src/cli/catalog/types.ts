export type RuntimeId =
  | "codex"
  | "claude"
  | "copilot"
  | "gemini"
  | "antigravity";

export type ModuleKind =
  | "capability"
  | "skill"
  | "rule-pack"
  | "workflow"
  | "specialist"
  | "compat-alias";

export type Stability = "experimental" | "beta" | "stable" | "deprecated";
export type CapabilityType = "stack" | "tool" | "pattern";
export type ModuleOutputType =
  | "skill"
  | "rules"
  | "workflow"
  | "specialist"
  | "contextDoc";

export interface ModuleOutput {
  type: ModuleOutputType;
  path: string;
  platforms: RuntimeId[];
}

export interface CapabilityContract {
  type: CapabilityType;
  domains: string[];
  outputs: ModuleOutput[];
}

export interface TestSpec {
  id: string;
  description: string;
  coverage?: string[];
}

export interface Module {
  id: string;
  kind: ModuleKind;
  label: string;
  description: string;
  dependencies: string[];
  profiles: string[];
  stability: Stability;
  capability?: CapabilityContract;
  tests?: TestSpec[];
  routeHints?: string[];
}

export interface Runtime {
  id: RuntimeId;
  label: string;
  since: string;
}

export interface InstallProfile {
  id: string;
  label: string;
  description: string;
  modules: string[];
}

export interface InstallComponent {
  id: string;
  label: string;
  description: string;
}

export interface BuildOutputs {
  runtimeAssets: string;
  cliDist: string;
  docs: string;
}

export interface PackageManifest {
  schemaVersion: 1;
  version: string;
  name: string;
  description: string;
  supportedRuntimes: Runtime[];
  installProfiles: InstallProfile[];
  installComponents: InstallComponent[];
  buildOutputs: BuildOutputs;
}

export interface AdapterRulesConfig {
  mergeStrategy: "layered" | "replace" | "merge";
  userOverride: "honor" | "ignore" | "warn";
  conflictResolution: "user-first" | "generated-first" | "error";
  generate?: {
    type: string;
    source: string;
    output: string;
  };
}

export interface AdapterSkillsConfig {
  projection?: {
    type: string;
    transforms: unknown[];
  };
  capabilityProjection?: Array<{
    capability: string;
    output: string;
    template?: string;
  }>;
}

export interface AdapterWorkflowsConfig {
  projection: unknown[];
}

export interface AdapterSpecialistsConfig {
  projection: unknown[];
}

export interface ContextDocTemplate {
  id: string;
  source: string;
  output: string;
  triggers: string[];
}

export interface AdapterContextDocsConfig {
  enabled: boolean;
  outputDir: string;
  managedSections: boolean;
  markers: {
    prefix: string;
    suffix: string;
  };
  templates: ContextDocTemplate[];
}

export interface Adapter {
  platform: RuntimeId;
  label: string;
  rules: AdapterRulesConfig;
  skills: AdapterSkillsConfig;
  workflows: AdapterWorkflowsConfig;
  specialists: AdapterSpecialistsConfig;
  contextDocs: AdapterContextDocsConfig;
}

export interface Catalog {
  package: PackageManifest;
  modules: Map<string, Module>;
  adapters: Map<RuntimeId, Adapter>;
  schemaVersion: number;
}
