import path from "node:path";

export const CORE_OPERATING_IDS = new Set([
  "ask-questions-if-underspecified",
  "clean-code",
  "plan-writing",
  "feature-forge",
  "code-reviewer",
  "systematic-debugging",
  "test-master",
  "lint-and-validate",
  "architecture-designer",
  "api-designer",
  "api-patterns",
  "secure-code-guardian",
  "security-reviewer",
  "parallel-agents",
  "sub-agents",
  "skill-creator",
  "mcp-builder",
  "deep-research",
  "prompt-engineer",
  "agentic-eval",
  "openai-docs",
]);

export const LANGUAGE_IDS = new Set([
  "javascript-pro",
  "typescript-pro",
  "python-pro",
  "golang-pro",
  "java-pro",
  "csharp-pro",
  "kotlin-pro",
  "rust-pro",
  "dart-pro",
  "php-pro",
  "ruby-pro",
  "swift-pro",
  "c-pro",
  "cpp-pro",
]);

export const DATABASE_IDS = new Set([
  "database-skills",
  "database-design",
  "database-optimizer",
  "drizzle-expert",
  "drift-flutter",
  "firebase",
  "postgres",
  "mysql",
  "sqlite",
  "mongodb",
  "redis",
  "supabase",
  "vitess",
  "neki",
]);

export const FRAMEWORK_IDS = new Set([
  "nodejs-best-practices",
  "nextjs-developer",
  "next-best-practices",
  "next-cache-components",
  "next-upgrade",
  "react-expert",
  "react-best-practices",
  "frontend-design",
  "design-system-builder",
  "ux-ui-consistency",
  "tailwind-patterns",
  "fastapi-expert",
  "nestjs-expert",
  "graphql-architect",
  "flutter-expert",
  "flutter-code-reviewer",
  "flutter-security-reviewer",
  "flutter-test-master",
  "flutter-riverpod",
  "riverpod-3",
  "gorouter-restoration",
  "oneup-design",
  "vercel-platform",
  "vercel-runtime",
  "vercel-delivery",
  "vercel-security",
  "vercel-ai",
  "vercel-observability",
  "vercel-storage",
  "terraform-engineer",
  "wrangler",
  "playwright-expert",
  "webapp-testing",
  "web-perf",
  "openapi-docs",
]);

export const VERTICAL_IDS = new Set([
  "app-builder",
  "saas-builder",
  "game-development",
  "mobile-design",
  "geo-fundamentals",
  "seo-fundamentals",
  "ui-ux-pro-max",
]);

export function splitTopLevelCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

export function parseInlineList(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return splitTopLevelCsv(trimmed);
  }
  const inner = trimmed.slice(1, -1);
  return splitTopLevelCsv(inner);
}

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { raw: "", body: markdown };
  return { raw: match[1], body: markdown.slice(match[0].length) };
}

export function getScalar(frontmatterRaw, key) {
  const match = frontmatterRaw.match(
    new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"),
  );
  if (!match) return null;
  return normalizeNullableString(match[1]);
}

function parseValue(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return parseInlineList(trimmed);
  }
  const unquoted = trimmed.replace(/^['"]|['"]$/g, "");
  const normalized = unquoted.toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "null" || normalized === "~") return null;
  return unquoted;
}

export function getMetadataBlock(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const metadata = {};
  let inMetadata = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!inMetadata) {
      if (/^metadata\s*:\s*$/.test(line)) {
        inMetadata = true;
      }
      continue;
    }

    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;

    const keyMatch = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    const rest = keyMatch[2];
    if (rest.trim()) {
      metadata[key] = parseValue(rest);
      continue;
    }

    const values = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (!/^\s+/.test(next) || /^\s+[A-Za-z0-9_-]+\s*:/.test(next)) {
        i = j - 1;
        break;
      }
      const bullet = next.match(/^\s+-\s*(.+)$/);
      if (bullet) {
        values.push(parseValue(bullet[1]));
      }
      if (j === lines.length - 1) {
        i = j;
      }
    }
    metadata[key] = values;
  }

  return metadata;
}

export function getAllTriggerValues(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const values = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const triggerMatch = line.match(/^\s*triggers\s*:\s*(.*)$/);
    if (!triggerMatch) continue;

    const rest = triggerMatch[1].trim();
    if (rest) {
      values.push(...parseInlineList(rest));
      continue;
    }

    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (/^\s*[A-Za-z0-9_-]+\s*:/.test(next)) break;

      const bullet = next.match(/^\s*-\s*(.+)$/);
      if (!bullet) continue;
      values.push(bullet[1].trim().replace(/^['"]|['"]$/g, ""));
    }
  }

  return [...new Set(values.filter(Boolean))];
}

export function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

export function normalizeNullableString(value) {
  if (value == null) return null;
  const normalized = String(value)
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const lower = normalized.toLowerCase();
  if (!normalized || lower === "null" || lower === "~") return null;
  return normalized;
}

export function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeNullableString(item)).filter(Boolean))];
  }
  if (typeof value === "string" && value.trim()) {
    return [...new Set(parseInlineList(value).map((item) => normalizeNullableString(item)).filter(Boolean))];
  }
  return [];
}

export function inferTier(id, coreProfileIds, webBackendProfileIds, deprecated) {
  if (deprecated) return "compatibility";
  if (coreProfileIds.has(id)) return "system";
  if (webBackendProfileIds.has(id)) return "curated";
  return "experimental";
}

export function inferCategory({ id, packageId, metadata, deprecated }) {
  if (typeof metadata.category === "string" && metadata.category.trim()) {
    return metadata.category.trim();
  }
  if (deprecated) return "compatibility";
  if (packageId === "database-skills" || DATABASE_IDS.has(id)) return "databases";
  if (LANGUAGE_IDS.has(id)) return "languages";
  if (FRAMEWORK_IDS.has(id)) return "frameworks-runtimes";
  if (VERTICAL_IDS.has(id)) return "vertical-composed";
  if (CORE_OPERATING_IDS.has(id)) return "core-operating";
  return "workflow-specialists";
}

export function inferLayer({ category, metadata, deprecated }) {
  if (typeof metadata.layer === "string" && metadata.layer.trim()) {
    return metadata.layer.trim();
  }
  if (deprecated) return "compatibility";
  return category;
}

export function inferMaturity(metadata, tier, deprecated) {
  if (typeof metadata.maturity === "string" && metadata.maturity.trim()) {
    return metadata.maturity.trim();
  }
  if (deprecated) return "compatibility";
  if (tier === "system") return "stable";
  if (tier === "curated") return "stable";
  return "incubating";
}

export function deriveTags({ id, category, layer, metadata, triggers }) {
  const explicit = normalizeStringArray(metadata.tags);
  const derived = new Set(explicit);
  derived.add(category);
  derived.add(layer);

  const stack = normalizeNullableString(metadata.stack);
  const domain = normalizeNullableString(metadata.domain);
  if (stack) derived.add(stack);
  if (domain) derived.add(domain);

  for (const trigger of triggers.slice(0, 6)) {
    const normalized = normalizeNullableString(trigger);
    if (normalized) derived.add(normalized.toLowerCase());
  }

  if (!explicit.length) {
    derived.add(id);
  }

  return [...derived]
    .map((item) => String(item).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export function deriveDescriptor({
  skillFile,
  skillsRoot,
  coreProfileIds,
  webBackendProfileIds,
}) {
  const raw = skillFile.rawContent;
  const fm = parseFrontmatter(raw);
  const metadata = getMetadataBlock(fm.raw);
  const relativeSkillDir = path
    .relative(skillsRoot, skillFile.skillDir)
    .replaceAll(path.sep, "/");
  const packageId = relativeSkillDir.split("/")[0];
  const id = path.basename(skillFile.skillDir);
  const deprecated = normalizeBoolean(metadata.deprecated);
  const replacedBy = normalizeNullableString(metadata.replaced_by);
  const category = inferCategory({ id, packageId, metadata, deprecated });
  const layer = inferLayer({ category, metadata, deprecated });
  const tier = inferTier(packageId, coreProfileIds, webBackendProfileIds, deprecated);
  const triggers = getAllTriggerValues(fm.raw);
  const aliases = normalizeStringArray(metadata.aliases);
  const canonical = deprecated ? false : metadata.canonical !== false;
  const canonicalId = deprecated && replacedBy ? replacedBy : packageId;

  return {
    id,
    package_id: packageId,
    catalog_id: relativeSkillDir,
    kind: relativeSkillDir === packageId ? "skill" : "subskill",
    path: `workflows/skills/${relativeSkillDir}/SKILL.md`,
    name: getScalar(fm.raw, "name") || id,
    description: getScalar(fm.raw, "description") || "",
    canonical,
    canonical_id: canonicalId,
    deprecated,
    replaced_by: replacedBy,
    aliases,
    category,
    layer,
    maturity: inferMaturity(metadata, tier, deprecated),
    tier,
    tags: deriveTags({ id: packageId, category, layer, metadata, triggers }),
    triggers,
    metadata,
  };
}

export function sortDescriptors(items) {
  return [...items].sort((a, b) => a.catalog_id.localeCompare(b.catalog_id));
}
