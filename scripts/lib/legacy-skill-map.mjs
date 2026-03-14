function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const LEGACY_SKILL_ID_MAP = Object.freeze({
  "agentic-eval": "llm-eval",
  "api-designer": "api-design",
  "api-patterns": "api-design",
  "architecture-designer": "system-design",
  "auth-architect": "owasp-security-review",
  "c-pro": "rust-best-practices",
  "changelog-generator": "tech-doc",
  "ci-cd-pipelines": "ci-cd-pipeline",
  "cpp-pro": "rust-best-practices",
  "csharp-pro": "csharp-best-practices",
  "dart-pro": "expo-app",
  "database-optimizer": "database-design",
  "database-skills": "database-design",
  "debugging-strategies": "systematic-debugging",
  "deep-research": "architecture-doc",
  "design-system-builder": "frontend-design",
  "devops-engineer": "ci-cd-pipeline",
  "docker-kubernetes": "kubernetes-deploy",
  "documentation-templates": "tech-doc",
  "drizzle-expert": "drizzle-orm",
  "error-ux-observability": "observability",
  "fastapi-expert": "fastapi",
  firebase: "database-design",
  "flutter-design-system": "expo-app",
  "flutter-drift": "expo-app",
  "flutter-feature": "expo-app",
  "flutter-go-router": "expo-app",
  "flutter-offline-sync": "expo-app",
  "flutter-repository": "expo-app",
  "flutter-riverpod": "expo-app",
  "flutter-state-machine": "expo-app",
  "flutter-testing": "expo-app",
  "frontend-code-review": "code-review",
  "game-development": "frontend-design",
  "geo-fundamentals": "tech-doc",
  "golang-pro": "golang-best-practices",
  "graphql-architect": "api-design",
  "i18n-localization": "frontend-design",
  "java-pro": "java-best-practices",
  "javascript-pro": "javascript-best-practices",
  "kotlin-pro": "kotlin-best-practices",
  "legacy-modernizer": "system-design",
  "mcp-builder": "mcp-server-builder",
  "microservices-architect": "microservices-design",
  "mobile-design": "react-native",
  mongodb: "database-design",
  mysql: "database-design",
  neki: "database-design",
  "nestjs-expert": "nestjs",
  "nextjs-developer": "nextjs",
  "nodejs-best-practices": "javascript-best-practices",
  "openai-docs": "tech-doc",
  "performance-profiling": "performance-testing",
  "php-pro": "php-best-practices",
  "playwright-e2e": "playwright-interactive",
  postgres: "database-design",
  "prompt-engineer": "prompt-engineering",
  "python-pro": "python-best-practices",
  "react-best-practices": "react",
  "react-expert": "react",
  redis: "database-design",
  "ruby-pro": "php-best-practices",
  "rust-pro": "rust-best-practices",
  "security-engineer": "owasp-security-review",
  "seo-fundamentals": "tech-doc",
  "serverless-patterns": "ci-cd-pipeline",
  "spec-miner": "sadd",
  sqlite: "database-design",
  "sre-engineer": "observability",
  "static-analysis": "code-review",
  "stripe-best-practices": "stripe-integration",
  supabase: "database-design",
  "swift-pro": "swift-best-practices",
  "tailwind-patterns": "frontend-design",
  "testing-patterns": "unit-testing",
  "typescript-pro": "typescript-best-practices",
  vitess: "database-design",
  "vulnerability-scanner": "owasp-security-review",
  "web-perf": "performance-testing",
  "webapp-testing": "integration-testing",
});

const LEGACY_SKILL_ID_ENTRIES = Object.entries(LEGACY_SKILL_ID_MAP).sort(
  ([a], [b]) => b.length - a.length || a.localeCompare(b),
);

export function normalizeSkillId(skillId) {
  const raw = String(skillId || "").trim();
  if (!raw) return raw;
  return LEGACY_SKILL_ID_MAP[raw.toLowerCase()] || raw;
}

export function normalizeSkillIds(skillIds = []) {
  const seen = new Set();
  const normalized = [];
  for (const skillId of skillIds) {
    const mapped = normalizeSkillId(skillId);
    const key = String(mapped || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    normalized.push(mapped);
  }
  return normalized;
}

export function rewriteLegacySkillIds(markdown) {
  let next = String(markdown || "");
  for (const [legacyId, canonicalId] of LEGACY_SKILL_ID_ENTRIES) {
    const pattern = new RegExp(
      `(?<![A-Za-z0-9_-])${escapeRegExp(legacyId)}(?![A-Za-z0-9_-])`,
      "g",
    );
    next = next.replace(pattern, (match, offset, source) => {
      const previousChar = offset > 0 ? source[offset - 1] : "";
      const trailing = source.slice(offset + match.length);
      if (
        previousChar === "/" ||
        trailing.startsWith("/") ||
        trailing.startsWith(".md")
      ) {
        return match;
      }
      return canonicalId;
    });
  }
  return next;
}
