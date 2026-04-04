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

const DELETED_SKILL_IDS = new Set([
  "qa",
  "unit-testing",
  "integration-testing",
  "playwright-interactive",
  "stitch",
  "mcp-core",
  "research-core",
  "rules-core",
]);

const DESIGN_GENERATION_SERVICE_SIGNALS = ["stitch"];
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
  "desktop ui",
  "desktop design",
  "desktop app design",
  "workspace design",
];
const DESIGN_GENERATION_SUPPORTING_SKILLS = [
  "web-ui-design",
  "design-system",
];
const MOBILE_DESIGN_SUPPORTING_SKILLS = [
  "mobile-ui-design",
];
const DESKTOP_DESIGN_SUPPORTING_SKILLS = [
  "desktop-ui-design",
];
const MOBILE_TESTING_SIGNALS = [
  "mobile testing",
  "android testing",
  "flutter testing",
  "emulator testing",
  "simulator testing",
];
const WEB_TESTING_SIGNALS = [
  "web testing",
  "browser testing",
  "playwright testing",
  "website testing",
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

function isDesignGenerationIntent(intent: string): boolean {
  const normalizedIntent = normalize(intent);
  return includesAnyPhrase(normalizedIntent, DESIGN_GENERATION_SERVICE_SIGNALS);
}

function isDesignIntent(intent: string): boolean {
  const normalizedIntent = normalize(intent);
  return (
    includesAnyPhrase(normalizedIntent, DESIGN_SYSTEM_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_AUDIT_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_REFRESH_SIGNALS) ||
    includesAnyPhrase(normalizedIntent, DESIGN_SCREEN_SIGNALS) ||
    (/\bdesign\b/i.test(normalizedIntent) &&
      /\b(desktop|mobile|web|ui|screen|workspace|landing page|redesign)\b/i.test(
        normalizedIntent,
      ))
  );
}

function designSurfaceSkills(intent: string): string[] {
  const normalizedIntent = normalize(intent);
  const needsMobilePatterns = /\b(mobile|flutter|android|ios|tablet|phone)\b/i.test(
    normalizedIntent,
  );
  const needsDesktopPatterns = /\b(desktop|mac|macos|windows|electron|workspace|inspector|sidebar|pane|multi pane|multi-pane)\b/i.test(
    normalizedIntent,
  );

  if (needsDesktopPatterns) {
    return DESKTOP_DESIGN_SUPPORTING_SKILLS;
  }

  if (needsMobilePatterns) {
    return MOBILE_DESIGN_SUPPORTING_SKILLS;
  }

  return ["web-ui-design"];
}

function chooseSkillCreatorRoute(
  intent: string,
  manifest: RouteManifest,
): RouteEntry | null {
  if (!isSkillCreatorIntent(intent)) return null;

  const normalizedIntent = normalize(intent);
  let candidateRouteIds = ["create", "implement", "plan"];
  if (includesAnyPhrase(normalizedIntent, SKILL_CREATOR_REVIEW_SIGNALS)) {
    candidateRouteIds = ["review", "plan", "implement"];
  } else if (includesAnyPhrase(normalizedIntent, SKILL_CREATOR_PLAN_SIGNALS)) {
    candidateRouteIds = ["plan", "implement", "review"];
  } else if (
    includesAnyPhrase(normalizedIntent, SKILL_CREATOR_ORCHESTRATE_SIGNALS)
  ) {
    candidateRouteIds = ["orchestrate", "plan", "implement"];
  }

  for (const routeId of candidateRouteIds) {
    const route = manifest.routes.find(
      (entry) => entry.kind === "workflow" && entry.id === routeId,
    );
    if (route) return route;
  }

  return null;
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
):
  | { route: RouteEntry; matchedBy: string }
  | { invalidExplicitRoute: true; matchedBy: string; explanation: string }
  | null {
  const trimmed = intent.trim();

  if (trimmed.startsWith("/")) {
    const route = manifest.routes.find(
      (entry) =>
        entry.kind === "workflow" &&
        entry.command?.toLowerCase() === trimmed.toLowerCase(),
    );
    if (route) return { route, matchedBy: "explicit-workflow-command" };
    return {
      invalidExplicitRoute: true,
      matchedBy: "invalid-explicit-workflow-command",
      explanation:
        "Explicit workflow command did not match any installed workflow. Do not reroute from free text; ask for a valid workflow or continue without explicit route syntax.",
    };
  }

  if (trimmed.startsWith("@")) {
    const normalizedAgent = trimmed.slice(1).toLowerCase();
    const route = manifest.routes.find(
      (entry) => entry.kind === "agent" && entry.id.toLowerCase() === normalizedAgent,
    );
    if (route) return { route, matchedBy: "explicit-agent" };
    return {
      invalidExplicitRoute: true,
      matchedBy: "invalid-explicit-agent",
      explanation:
        "Explicit agent mention did not match any installed custom agent. Do not reroute from free text; ask for a valid agent or continue without explicit agent syntax.",
    };
  }

  if (trimmed.startsWith("$")) {
    const normalizedAlias = trimmed.toLowerCase();
    const route = manifest.routes.find(
      (entry) =>
        entry.artifacts.codex?.compatibilityAlias?.toLowerCase() === normalizedAlias,
    );
    if (route) return { route, matchedBy: "compatibility-alias" };
    return {
      invalidExplicitRoute: true,
      matchedBy: "invalid-compatibility-alias",
      explanation:
        "Explicit compatibility alias did not match any installed route. Do not reroute from free text; use a valid alias or a canonical workflow or agent name.",
    };
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
  const primarySkills = (overrides.primarySkills || route.primarySkills).filter(
    (skillId) => !DELETED_SKILL_IDS.has(skillId),
  );
  const supportingSkills = (overrides.supportingSkills || route.supportingSkills).filter(
    (skillId) => !DELETED_SKILL_IDS.has(skillId),
  );
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
          : matchedBy === "compatibility-alias"
            ? `Matched compatibility alias ${route.artifacts.codex?.compatibilityAlias}.`
            : matchedBy === "skill-creator-intent"
              ? `Matched workflow '${route.id}' and selected skill-creator as the primary skill hint for skill package work.`
              : `Matched ${route.kind} '${route.id}' from installed route metadata.`),
    artifacts: route.artifacts,
  };
}

function buildUnresolvedPayload(
  input: string,
  detectedLanguageSkill: string | null,
  options: Partial<{
    fallbackSkillSearchRecommended: boolean;
    matchedBy: string;
    explanation: string;
  }> = {},
) {
  return {
    input,
    resolved: false,
    kind: null,
    id: null,
    command: null,
    agent: null,
    primarySkillHint: null,
    primarySkills: [],
    supportingSkills: [],
    detectedLanguageSkill,
    fallbackSkillSearchRecommended:
      options.fallbackSkillSearchRecommended ?? true,
    matchedBy: options.matchedBy ?? "none",
    explanation:
      options.explanation ??
      "No workflow or custom agent matched the current intent. Inspect locally first, then use one narrow skill_search only if the domain is still unclear.",
    artifacts: null,
  };
}

function chooseDesignGenerationRoute(manifest: RouteManifest): RouteEntry | null {
  return (
    manifest.routes.find(
      (entry) =>
        entry.kind === "workflow" &&
        (entry.id === "design-screen" || entry.command === "/design-screen"),
    ) || null
  );
}

function chooseTestingRoute(intent: string, manifest: RouteManifest): RouteEntry | null {
  const normalizedIntent = normalize(intent);
  const wantsMobileTesting =
    includesAnyPhrase(normalizedIntent, MOBILE_TESTING_SIGNALS) ||
    (/\b(android|flutter|emulator|adb|ios|iphone|ipad|simulator|simctl)\b/.test(normalizedIntent) && /\b(test|verify|validation)\b/.test(normalizedIntent));
  if (wantsMobileTesting) {
    return (
      manifest.routes.find(
        (entry) => entry.kind === "workflow" && entry.id === "mobile-testing",
      ) || null
    );
  }

  const wantsWebTesting =
    includesAnyPhrase(normalizedIntent, WEB_TESTING_SIGNALS) ||
    (/\b(playwright|browser|web|website|page|pages)\b/.test(normalizedIntent) && /\b(test|verify|validation)\b/.test(normalizedIntent));
  if (wantsWebTesting) {
    return (
      manifest.routes.find(
        (entry) => entry.kind === "workflow" && entry.id === "web-testing",
      ) || null
    );
  }

  return null;
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
    if ("invalidExplicitRoute" in explicit) {
      const payload = buildUnresolvedPayload(intent, detectedLanguageSkill, {
        fallbackSkillSearchRecommended: false,
        matchedBy: explicit.matchedBy,
        explanation: explicit.explanation,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    }
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

  const testingRoute = chooseTestingRoute(intent, routeManifest);
  if (testingRoute) {
    const isWebTestingRoute = testingRoute.id === "web-testing";
    const isIosIntent = /\b(ios|iphone|ipad|simulator|simctl)\b/i.test(intent);
    const mobilePrimarySkill = isIosIntent
      ? "ios-simulator-testing"
      : "android-emulator-testing";
    const mobilePrimarySkills = isIosIntent
      ? ["ios-simulator-testing", "android-emulator-testing"]
      : ["android-emulator-testing", "ios-simulator-testing"];
    const payload = buildResolvedPayload(
      intent,
      testingRoute,
      "testing-runtime-intent",
      detectedLanguageSkill,
      {
        primarySkillHint: isWebTestingRoute ? "web-testing" : mobilePrimarySkill,
        primarySkills: isWebTestingRoute ? ["web-testing"] : mobilePrimarySkills,
        supportingSkills: testingRoute.supportingSkills,
        explanation: isWebTestingRoute
          ? "Matched browser testing intent and routed to /web-testing so Playwright MCP execution, evidence capture, and reporting stay on the canonical web-testing runtime path."
          : isIosIntent
            ? "Matched iOS simulator testing intent and routed to /mobile-testing so the CLI-first iOS testing path stays primary while Android coverage remains available when needed."
            : "Matched mobile testing intent and routed to /mobile-testing so the CLI-first Android testing path stays primary while iOS simulator coverage remains available when needed.",
      },
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  }

  if (isDesignGenerationIntent(intent)) {
    const designGenerationRoute = chooseDesignGenerationRoute(routeManifest);
    if (designGenerationRoute) {
      const needsMobilePatterns = /\b(mobile|flutter|android|ios)\b/i.test(intent);
      const payload = buildResolvedPayload(
        intent,
        designGenerationRoute,
        "design-generation-intent",
        detectedLanguageSkill,
        {
          primarySkillHint: "design",
          primarySkills: [
            "design",
            ...(needsMobilePatterns ? MOBILE_DESIGN_SUPPORTING_SKILLS : []),
            ...DESIGN_GENERATION_SUPPORTING_SKILLS,
          ],
          supportingSkills: designGenerationRoute.supportingSkills,
          explanation:
            "Matched design-generation intent and routed to /design-screen so the design engine resolves canonical design state, builds the screen brief, and only then runs the Stitch MCP sequence.",
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
      const primarySkills = ["design"];
      primarySkills.push(...designSurfaceSkills(intent));

      const payload = buildResolvedPayload(
        intent,
        designRoute,
        "design-intent",
        detectedLanguageSkill,
        {
          primarySkillHint: "design",
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

  const payload = buildUnresolvedPayload(intent, detectedLanguageSkill);

  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}
