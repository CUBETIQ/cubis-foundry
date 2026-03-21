/**
 * Cubis Foundry MCP Server – route_resolve tool.
 *
 * Resolves workflows and custom agents before skill discovery.
 */

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { z } from "zod";
import type { RouteEntry, RouteManifest } from "../routes/types.js";

export const routeResolveName = "route_resolve";

export const routeResolveDescription =
  "Resolve an explicit workflow command, explicit custom agent, compatibility alias, or free-text intent into one workflow/agent route before skill loading.";

export const routeResolveSchema = z.object({
  intent: z
    .string()
    .min(1)
    .describe(
      "Explicit workflow command (/implement), explicit agent (@reviewer), compatibility alias ($workflow-implement / $agent-reviewer), or free-text user intent",
    ),
});

const ROUTE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "for",
  "help",
  "i",
  "in",
  "is",
  "me",
  "of",
  "on",
  "or",
  "please",
  "the",
  "to",
  "with",
]);

const SKILL_CREATOR_OBJECT_SIGNALS = [
  "skill",
  "skills",
  "skill authoring",
  "skill-authoring",
  "skill creator",
  "skill-creator",
  "skill.md",
  "power.md",
  "frontmatter",
  "metadata",
  "reference",
  "references",
  "sidecar",
  "sidecars",
  "mirror",
  "mirrors",
];

const SKILL_CREATOR_ACTION_SIGNALS = [
  "adapt",
  "author",
  "build",
  "check",
  "create",
  "design",
  "fix",
  "maintain",
  "migrate",
  "normalize",
  "plan",
  "repair",
  "review",
  "scaffold",
  "spec",
  "update",
  "validate",
  "wire",
];

const SKILL_CREATOR_PLAN_SIGNALS = ["design", "plan", "spec"];
const SKILL_CREATOR_REVIEW_SIGNALS = ["audit", "check", "review", "validate"];
const SKILL_CREATOR_ORCHESTRATE_SIGNALS = [
  "all platform",
  "all platforms",
  "cross platform",
  "cross-platform",
  "every platform",
  "generator",
  "mirror",
  "mirrors",
];

const LANGUAGE_SIGNAL_FILES: Array<{ skillId: string; files: string[] }> = [
  { skillId: "typescript-pro", files: ["tsconfig.json", "tsconfig.base.json", "deno.json"] },
  { skillId: "javascript-pro", files: ["package.json"] },
  { skillId: "python-pro", files: ["pyproject.toml", "requirements.txt", "requirements-dev.txt"] },
  { skillId: "golang-pro", files: ["go.mod"] },
  { skillId: "rust-pro", files: ["Cargo.toml"] },
  { skillId: "csharp-pro", files: [".sln", ".csproj"] },
  { skillId: "java-pro", files: ["pom.xml", "build.gradle"] },
  { skillId: "kotlin-pro", files: ["build.gradle.kts", "settings.gradle.kts"] },
  { skillId: "dart-pro", files: ["pubspec.yaml"] },
  { skillId: "php-pro", files: ["composer.json"] },
  { skillId: "ruby-pro", files: ["Gemfile"] },
  { skillId: "swift-pro", files: ["Package.swift"] },
];

const LEGACY_WORKFLOW_ALIASES: Record<string, string> = {
  brainstorm: "plan",
  qa: "test",
  incident: "devops",
  postman: "backend",
};

const LEGACY_AGENT_ALIASES: Record<string, string> = {
  "penetration-tester": "security-auditor",
  "qa-automation-engineer": "test-engineer",
  "product-owner": "product-manager",
  "explorer-agent": "code-archaeologist",
};

const STITCH_REQUIRED_SIGNALS = ["stitch"];
const DESIGN_SYSTEM_SIGNALS = [
  "design system",
  "design-system",
  "design tokens",
  "theme system",
  "token system",
];
const DESIGN_AUDIT_SIGNALS = [
  "design audit",
  "ui audit",
  "ux audit",
  "visual audit",
  "design review",
];
const DESIGN_REFRESH_SIGNALS = [
  "design refresh",
  "refresh design",
  "refresh tokens",
  "design drift",
];
const DESIGN_SCREEN_SIGNALS = [
  "design screen",
  "screen design",
  "ui design",
  "ux design",
  "landing page",
  "redesign",
  "mobile screen",
];
const STITCH_UI_SUPPORTING_SKILLS = [
  "frontend-design-core",
  "frontend-design-style-selector",
  "frontend-design-system",
  "frontend-design-screen-brief",
  "stitch-prompt-enhancement",
  "stitch-design-orchestrator",
  "stitch-design-system",
  "stitch-implementation-handoff",
];
const MOBILE_DESIGN_SUPPORTING_SKILLS = [
  "frontend-design-mobile-patterns",
  "frontend-design-implementation-handoff",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9@/$+-]+/g, " ").trim();
}

function tokenize(value: string): string[] {
  const seen = new Set<string>();
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !ROUTE_STOP_WORDS.has(token))
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });
}

function countTokenMatches(haystack: string, tokens: string[]): number {
  let matches = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) matches += 1;
  }
  return matches;
}

function includesAnyPhrase(normalizedIntent: string, phrases: string[]): boolean {
  return phrases.some((phrase) => normalizedIntent.includes(phrase));
}

function isSkillCreatorIntent(intent: string): boolean {
  const normalizedIntent = normalize(intent);
  const hasObjectSignal = includesAnyPhrase(
    normalizedIntent,
    SKILL_CREATOR_OBJECT_SIGNALS,
  );
  if (!hasObjectSignal) return false;

  return includesAnyPhrase(normalizedIntent, SKILL_CREATOR_ACTION_SIGNALS);
}

function isStitchUiIntent(intent: string): boolean {
  const normalizedIntent = normalize(intent);
  return includesAnyPhrase(normalizedIntent, STITCH_REQUIRED_SIGNALS);
}

function isDesignIntent(intent: string): boolean {
  const normalizedIntent = normalize(intent);
  return (
    includesAnyPhrase(normalizedIntent, DESIGN_SYSTEM_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_AUDIT_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_REFRESH_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_SCREEN_SIGNALS)
  );
}

function chooseSkillCreatorRoute(
  intent: string,
  manifest: RouteManifest,
): RouteEntry | null {
  if (!isSkillCreatorIntent(intent)) return null;

  const normalizedIntent = normalize(intent);
  let preferredRouteId = "create";
  if (includesAnyPhrase(normalizedIntent, SKILL_CREATOR_REVIEW_SIGNALS)) {
    preferredRouteId = "review";
  } else if (includesAnyPhrase(normalizedIntent, SKILL_CREATOR_PLAN_SIGNALS)) {
    preferredRouteId = "plan";
  } else if (
    includesAnyPhrase(normalizedIntent, SKILL_CREATOR_ORCHESTRATE_SIGNALS)
  ) {
    preferredRouteId = "orchestrate";
  }

  return (
    manifest.routes.find(
      (entry) => entry.kind === "workflow" && entry.id === preferredRouteId,
    ) || null
  );
}

function buildSearchText(route: RouteEntry): string {
  return normalize(
    [
      route.kind,
      route.id,
      route.command || "",
      route.displayName,
      route.description,
      route.primaryAgent,
      ...route.supportingAgents,
      ...route.triggers,
      ...route.primarySkills,
      ...route.supportingSkills,
      route.artifacts.codex?.compatibilityAlias || "",
      route.artifacts.antigravity?.commandFile || "",
      route.artifacts.copilot?.promptFile || "",
      route.artifacts.claude?.workflowFile || "",
      route.artifacts.claude?.agentFile || "",
    ].join(" "),
  );
}

function findExplicitRoute(
  intent: string,
  manifest: RouteManifest,
): { route: RouteEntry; matchedBy: string } | null {
  const trimmed = intent.trim();

  if (trimmed.startsWith("/")) {
    const route = manifest.routes.find(
      (entry) =>
        entry.kind === "workflow" &&
        entry.command?.toLowerCase() === trimmed.toLowerCase(),
    );
    if (route) return { route, matchedBy: "explicit-workflow-command" };

    const legacyWorkflowId = LEGACY_WORKFLOW_ALIASES[trimmed.slice(1).toLowerCase()];
    if (legacyWorkflowId) {
      const legacyRoute = manifest.routes.find(
        (entry) => entry.kind === "workflow" && entry.id === legacyWorkflowId,
      );
      if (legacyRoute) return { route: legacyRoute, matchedBy: "legacy-workflow-alias" };
    }
  }

  if (trimmed.startsWith("@")) {
    const normalizedAgent = trimmed.slice(1).toLowerCase();
    const route = manifest.routes.find(
      (entry) => entry.kind === "agent" && entry.id.toLowerCase() === normalizedAgent,
    );
    if (route) return { route, matchedBy: "explicit-agent" };

    const legacyAgentId = LEGACY_AGENT_ALIASES[normalizedAgent];
    if (legacyAgentId) {
      const legacyRoute = manifest.routes.find(
        (entry) => entry.kind === "agent" && entry.id.toLowerCase() === legacyAgentId,
      );
      if (legacyRoute) return { route: legacyRoute, matchedBy: "legacy-agent-alias" };
    }
  }

  if (trimmed.startsWith("$")) {
    const normalizedAlias = trimmed.toLowerCase();
    const route = manifest.routes.find(
      (entry) =>
        entry.artifacts.codex?.compatibilityAlias?.toLowerCase() === normalizedAlias,
    );
    if (route) return { route, matchedBy: "compatibility-alias" };
  }

  return null;
}

function resolveByIntent(
  intent: string,
  manifest: RouteManifest,
): { route: RouteEntry; matchedBy: string; score: number } | null {
  const normalizedIntent = normalize(intent);
  const tokens = tokenize(intent);

  let best:
    | { route: RouteEntry; matchedBy: string; score: number; tokenMatches: number }
    | null = null;

  for (const route of manifest.routes) {
    const searchText = buildSearchText(route);
    const phraseMatch =
      normalizedIntent.length > 0 && searchText.includes(normalizedIntent);
    const tokenMatches = countTokenMatches(searchText, tokens);
    const triggerMatches = route.triggers.reduce((sum, trigger) => {
      return sum + (normalizedIntent.includes(normalize(trigger)) ? 1 : 0);
    }, 0);
    const score =
      (phraseMatch ? 500 : 0) +
      triggerMatches * 120 +
      tokenMatches * 40 +
      (route.kind === "workflow" ? 10 : 0);

    if (score <= 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && route.id.localeCompare(best.route.id) < 0)
    ) {
      best = {
        route,
        matchedBy: triggerMatches > 0 ? "trigger-match" : "intent-match",
        score,
        tokenMatches,
      };
    }
  }

  if (!best) return null;
  if (best.score < 80 && best.tokenMatches < 2) return null;
  return best;
}

function buildResolvedPayload(
  input: string,
  route: RouteEntry,
  matchedBy: string,
  detectedLanguageSkill: string | null,
  overrides: Partial<{
    primarySkillHint: string | null;
    primarySkills: string[];
    supportingSkills: string[];
    explanation: string;
  }> = {},
) {
  const primarySkills = overrides.primarySkills || route.primarySkills;
  const supportingSkills = overrides.supportingSkills || route.supportingSkills;
  const primarySkillHint =
    overrides.primarySkillHint !== undefined
      ? overrides.primarySkillHint
      : isSkillCreatorIntent(input)
        ? "skill-creator"
        : primarySkills[0] || null;
  return {
    input,
    resolved: true,
    kind: route.kind,
    id: route.id,
    command: route.command,
    agent: route.primaryAgent,
    primarySkillHint,
    primarySkills,
    supportingSkills,
    detectedLanguageSkill,
    fallbackSkillSearchRecommended: false,
    matchedBy,
    explanation:
      overrides.explanation ??
      (matchedBy === "explicit-workflow-command"
        ? `Matched explicit workflow command ${route.command}.`
        : matchedBy === "explicit-agent"
          ? `Matched explicit agent @${route.id}.`
          : matchedBy === "legacy-workflow-alias"
            ? `Matched legacy workflow alias and routed to canonical workflow '${route.id}'.`
            : matchedBy === "legacy-agent-alias"
              ? `Matched legacy agent alias and routed to canonical agent @${route.id}.`
              : matchedBy === "compatibility-alias"
                ? `Matched compatibility alias ${route.artifacts.codex?.compatibilityAlias}.`
                : matchedBy === "skill-creator-intent"
                  ? `Matched workflow '${route.id}' and selected skill-creator as the primary skill hint for skill package work.`
                  : `Matched ${route.kind} '${route.id}' from installed route metadata.`),
    artifacts: route.artifacts,
  };
}

function chooseStitchUiRoute(manifest: RouteManifest): RouteEntry | null {
  return (
    manifest.routes.find(
      (entry) =>
        entry.kind === "workflow" &&
        (entry.id === "design-screen" || entry.command === "/design-screen"),
    ) || null
  );
}

function chooseDesignRoute(intent: string, manifest: RouteManifest): RouteEntry | null {
  const normalizedIntent = normalize(intent);
  let preferredWorkflowId = "design-screen";
  if (includesAnyPhrase(normalizedIntent, DESIGN_SYSTEM_SIGNALS)) {
    preferredWorkflowId = "design-system";
  } else if (includesAnyPhrase(normalizedIntent, DESIGN_AUDIT_SIGNALS)) {
    preferredWorkflowId = "design-audit";
  } else if (includesAnyPhrase(normalizedIntent, DESIGN_REFRESH_SIGNALS)) {
    preferredWorkflowId = "design-refresh";
  }

  return (
    manifest.routes.find(
      (entry) => entry.kind === "workflow" && entry.id === preferredWorkflowId,
    ) || null
  );
}

async function fileExists(target: string) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function detectLanguageSkillHint() {
  const cwd = process.cwd();
  const candidates: string[] = await fs.readdir(cwd).catch(() => []);
  const has = (fileName: string) => candidates.includes(fileName);

  for (const entry of LANGUAGE_SIGNAL_FILES) {
    for (const fileName of entry.files) {
      if (fileName === ".sln" || fileName === ".csproj") {
        if (candidates.some((item) => item.endsWith(fileName))) {
          return "csharp-pro";
        }
        continue;
      }
      if (has(fileName) || (await fileExists(path.join(cwd, fileName)))) {
        if (entry.skillId === "javascript-pro") {
          const tsSignals = ["tsconfig.json", "tsconfig.base.json", "deno.json"];
          if (tsSignals.some((signal) => has(signal))) {
            return "typescript-pro";
          }
        }
        return entry.skillId;
      }
    }
  }
  return null;
}

export async function handleRouteResolve(
  args: z.infer<typeof routeResolveSchema>,
  routeManifest: RouteManifest,
) {
  const { intent } = args;
  const detectedLanguageSkill = await detectLanguageSkillHint();
  const explicit = findExplicitRoute(intent, routeManifest);
  if (explicit) {
    const payload = buildResolvedPayload(
      intent,
      explicit.route,
      explicit.matchedBy,
      detectedLanguageSkill,
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }

  const skillCreatorRoute = chooseSkillCreatorRoute(intent, routeManifest);
  if (skillCreatorRoute) {
    const payload = buildResolvedPayload(
      intent,
      skillCreatorRoute,
      "skill-creator-intent",
      detectedLanguageSkill,
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }

  if (isStitchUiIntent(intent)) {
    const stitchRoute = chooseStitchUiRoute(routeManifest);
    if (stitchRoute) {
      const needsMobilePatterns = /\b(mobile|flutter|android|ios)\b/i.test(intent);
      const payload = buildResolvedPayload(
        intent,
        stitchRoute,
        "stitch-ui-intent",
        detectedLanguageSkill,
        {
          primarySkillHint: "frontend-design",
          primarySkills: [
            "frontend-design",
            ...(needsMobilePatterns ? MOBILE_DESIGN_SUPPORTING_SKILLS : []),
            ...STITCH_UI_SUPPORTING_SKILLS,
          ],
          supportingSkills: stitchRoute.supportingSkills,
          explanation:
            "Matched Stitch UI intent and routed to /design-screen so the design engine resolves canonical design state, builds the screen brief, and only then runs the Stitch sequence.",
        },
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    }
  }

  if (isDesignIntent(intent)) {
    const designRoute = chooseDesignRoute(intent, routeManifest);
    if (designRoute) {
      const needsMobilePatterns = /\b(mobile|flutter|android|ios)\b/i.test(intent);
      const primarySkills = [
        "frontend-design",
        "frontend-design-core",
      ];
      if (designRoute.id === "design-system") {
        primarySkills.push("frontend-design-style-selector", "frontend-design-system");
      } else if (designRoute.id === "design-audit") {
        primarySkills.push("frontend-design-style-selector");
      } else if (designRoute.id === "design-refresh") {
        primarySkills.push(
          "frontend-design-style-selector",
          "frontend-design-system",
          "frontend-design-screen-brief",
        );
      } else {
        primarySkills.push(
          "frontend-design-style-selector",
          "frontend-design-screen-brief",
        );
      }
      if (needsMobilePatterns) {
        primarySkills.push(...MOBILE_DESIGN_SUPPORTING_SKILLS);
      }

      const payload = buildResolvedPayload(
        intent,
        designRoute,
        "design-intent",
        detectedLanguageSkill,
        {
          primarySkillHint: "frontend-design",
          primarySkills,
          supportingSkills: designRoute.supportingSkills,
          explanation:
            "Matched design intent and routed through the design engine so canonical design state, overlays, and screen briefs resolve before implementation or generation.",
        },
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    }
  }

  const inferred = resolveByIntent(intent, routeManifest);
  if (inferred) {
    const payload = buildResolvedPayload(
      intent,
      inferred.route,
      inferred.matchedBy,
      detectedLanguageSkill,
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }

  const payload = {
    input: intent,
    resolved: false,
    kind: null,
    id: null,
    command: null,
    agent: null,
    primarySkillHint: null,
    primarySkills: [],
    supportingSkills: [],
    detectedLanguageSkill,
    fallbackSkillSearchRecommended: true,
    matchedBy: "none",
    explanation:
      "No workflow or custom agent matched the current intent. Inspect locally first, then use one narrow skill_search only if the domain is still unclear.",
    artifacts: null,
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}
