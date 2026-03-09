#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import {
  CLUSTER_REWRITE_PRIORITIES,
  CURRENT_SKILL_REWRITE_SPECS,
  DIRECT_SOURCE_REPO_IDS,
  DIRECT_WEB_SOURCES,
  DISCOVERY_QUERIES,
  GITHUB_DISCOVERY_QUERIES,
  NEW_SKILL_CANDIDATES,
  PUBLIC_REPO_SEEDS,
} from "./lib/public-skill-research-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILL_CATALOG_PATH = path.join(
  ROOT,
  "workflows",
  "skills",
  "generated",
  "skill-catalog.json",
);
const OUTPUT_DIR = path.join(ROOT, "docs", "agent-skills", "generated");
const CORPUS_JSON_PATH = path.join(OUTPUT_DIR, "public-skill-repo-corpus.json");
const GAP_JSON_PATH = path.join(OUTPUT_DIR, "public-skill-gap-matrix.json");
const SOURCE_LEDGER_JSON_PATH = path.join(OUTPUT_DIR, "public-source-ledger.json");
const CORPUS_MD_PATH = path.join(ROOT, "docs", "agent-skills", "public-skill-corpus.md");
const GAP_MD_PATH = path.join(ROOT, "docs", "agent-skills", "public-skill-gap-matrix.md");
const REWRITE_SPECS_MD_PATH = path.join(ROOT, "docs", "agent-skills", "rewrite-specs.md");
const SOURCE_LEDGER_MD_PATH = path.join(ROOT, "docs", "agent-skills", "public-source-ledger.md");
const SOURCE_CONTRIBUTION_MD_PATH = path.join(
  ROOT,
  "docs",
  "agent-skills",
  "public-source-contribution-map.md",
);
const DATABASE_BENCHMARK_MD_PATH = path.join(
  ROOT,
  "docs",
  "agent-skills",
  "database-wave-benchmarks.md",
);
const AGENT_BUILDER_BENCHMARK_MD_PATH = path.join(
  ROOT,
  "docs",
  "agent-skills",
  "agent-builder-wave-benchmarks.md",
);

function formatCountMap(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

function countMatches(text, pattern) {
  return [...String(text || "").matchAll(pattern)].length;
}

function readmeSignals(readme) {
  const text = String(readme || "");
  return {
    mentionsSkillMd: /SKILL\.md/i.test(text),
    mentionsReferencesDir: /references\//i.test(text),
    mentionsScriptsDir: /scripts\//i.test(text),
    mentionsTemplatesDir: /templates\//i.test(text),
    mentionsInstall: /\binstall\b/i.test(text),
    mentionsMarketplace: /\bmarketplace\b/i.test(text),
    mentionsRegistry: /\bregistry\b/i.test(text),
    mentionsMcp: /\bmcp\b/i.test(text),
    mentionsCategories: /\bcategor(y|ies)\b/i.test(text),
    mentionsAwesome: /\bawesome\b/i.test(text),
    mentionsCollection: /\bcollection\b/i.test(text),
    skillWordCount: countMatches(text, /\bskills?\b/gi),
  };
}

function shortDate(value) {
  if (!value) return "n/a";
  return String(value).slice(0, 10);
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeRepoIdFromUrl(url) {
  const match = String(url || "").match(/github\.com\/([^/\s]+\/[^/\s#?]+)/i);
  if (!match) return null;
  const raw = match[1]
    .replace(/\.git$/i, "")
    .replace(/\/(issues|pulls|tree|blob|wiki).*/i, "");
  const parts = raw.split("/");
  if (parts.length !== 2) return null;
  return `${parts[0]}/${parts[1]}`;
}

function extractRepoLinks(text) {
  const matches = [...String(text || "").matchAll(/https:\/\/github\.com\/[^\s)"]+/gi)];
  return unique(matches.map((match) => normalizeRepoIdFromUrl(match[0])));
}

async function fetchJson(url, accept = "application/vnd.github+json") {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "cubis-foundry-public-skill-research",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchText(url, accept = "application/vnd.github.raw+json") {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "cubis-foundry-public-skill-research",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function fetchRepoSnapshot(seed) {
  const repoApiUrl = `https://api.github.com/repos/${seed.id}`;
  const readmeApiUrl = `https://api.github.com/repos/${seed.id}/readme`;
  const snapshot = {
    ...seed,
    sourceKind: "repo",
    github: null,
    readmeSignals: null,
    linkedRepoIds: [],
    fetchStatus: "ok",
    fetchNotes: [],
  };

  let readmeText = "";

  try {
    const repo = await fetchJson(repoApiUrl);
    snapshot.github = {
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      createdAt: repo.created_at,
      homepage: repo.homepage,
      archived: repo.archived,
      defaultBranch: repo.default_branch,
      license: repo.license?.spdx_id || repo.license?.name || null,
      topics: repo.topics || [],
      isFork: Boolean(repo.fork),
    };
  } catch (error) {
    snapshot.fetchStatus = "partial";
    snapshot.fetchNotes.push(`repo metadata unavailable: ${error.message}`);
  }

  try {
    readmeText = await fetchText(readmeApiUrl);
    snapshot.readmeSignals = readmeSignals(readmeText);
    snapshot.linkedRepoIds = extractRepoLinks(readmeText);
  } catch (error) {
    snapshot.fetchStatus = snapshot.fetchStatus === "ok" ? "partial" : "error";
    snapshot.fetchNotes.push(`readme unavailable: ${error.message}`);
    snapshot.readmeSignals = readmeSignals("");
  }

  return snapshot;
}

function pageSignals(text) {
  const content = String(text || "");
  const title = content.match(/<title>([^<]+)<\/title>/i)?.[1] || null;
  const description =
    content.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ||
    content.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ||
    null;
  return {
    title,
    description,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    mentionsMcp: /\bmcp\b/i.test(content),
    mentionsPrompt: /\bprompt\b/i.test(content),
    mentionsEval: /\beval/i.test(content),
    mentionsOpenAi: /\bopenai\b/i.test(content),
    mentionsSkill: /\bskill/i.test(content),
  };
}

async function fetchPageSnapshot(seed) {
  const snapshot = {
    ...seed,
    github: null,
    readmeSignals: null,
    fetchStatus: "ok",
    fetchNotes: [],
    pageSignals: null,
  };

  try {
    const text = await fetch(seed.url, {
      headers: { "User-Agent": "cubis-foundry-public-skill-research" },
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return response.text();
    });
    snapshot.pageSignals = pageSignals(text);
  } catch (error) {
    snapshot.fetchStatus = "error";
    snapshot.fetchNotes.push(`page unavailable: ${error.message}`);
    snapshot.pageSignals = pageSignals("");
  }

  return snapshot;
}

async function collectLocalPackaging(skillPath) {
  const skillDir = path.join(ROOT, path.dirname(skillPath));
  const refsDir = path.join(skillDir, "references");
  const scriptsDir = path.join(skillDir, "scripts");
  const templatesDir = path.join(skillDir, "templates");
  const assetsDir = path.join(skillDir, "assets");
  const steeringDir = path.join(skillDir, "steering");

  async function safeChildrenCount(target) {
    try {
      const entries = await fs.readdir(target, { withFileTypes: true });
      return entries.filter((entry) => !entry.name.startsWith(".")).length;
    } catch {
      return 0;
    }
  }

  return {
    hasReferences: await fs
      .stat(refsDir)
      .then(() => true)
      .catch(() => false),
    hasScripts: await fs
      .stat(scriptsDir)
      .then(() => true)
      .catch(() => false),
    hasTemplates: await fs
      .stat(templatesDir)
      .then(() => true)
      .catch(() => false),
    hasAssets: await fs
      .stat(assetsDir)
      .then(() => true)
      .catch(() => false),
    hasSteering: await fs
      .stat(steeringDir)
      .then(() => true)
      .catch(() => false),
    referenceFiles: await safeChildrenCount(refsDir),
    scriptFiles: await safeChildrenCount(scriptsDir),
    templateFiles: await safeChildrenCount(templatesDir),
  };
}

function repoDiscoveryScore(item) {
  const haystack = `${item.fullName || ""} ${item.description || ""} ${(item.topics || []).join(" ")}`.toLowerCase();
  let score = 0;
  if (haystack.includes("skill")) score += 4;
  if (haystack.includes("agent")) score += 3;
  if (haystack.includes("mcp")) score += 3;
  if (haystack.includes("prompt")) score += 2;
  if (haystack.includes("eval")) score += 2;
  if (haystack.includes("database")) score += 2;
  if (haystack.includes("firebase")) score += 2;
  if (haystack.includes("supabase")) score += 2;
  if (haystack.includes("drizzle")) score += 2;
  if (haystack.includes("awesome")) score += 1;
  if (haystack.includes("marketplace")) score += 1;
  if (item.isFork) score -= 3;
  if (item.archived) score -= 2;
  return score;
}

function classifyDiscoveredRepo(item, awesomeLinkedIds) {
  const haystack = `${item.fullName || ""} ${item.description || ""} ${(item.topics || []).join(" ")}`.toLowerCase();
  const repoClass = haystack.includes("awesome")
    ? "awesome-list"
    : haystack.includes("marketplace")
      ? "marketplace"
      : haystack.includes("registry")
        ? "installer-registry"
        : "public-implementation";
  const sourceGroup = awesomeLinkedIds.has((item.fullName || "").toLowerCase())
    ? "awesome-outbound"
    : "github-discovery";
  const platformTargets = [];
  if (haystack.includes("claude")) platformTargets.push("claude");
  if (haystack.includes("copilot")) platformTargets.push("copilot");
  if (haystack.includes("openai") || haystack.includes("codex")) platformTargets.push("codex");
  if (haystack.includes("gemini") || haystack.includes("google")) platformTargets.push("gemini");
  if (platformTargets.length === 0) platformTargets.push("multi-agent");
  const taxonomySignals = unique(
    ["coding", "automation"]
      .concat(haystack.includes("database") ? ["databases"] : [])
      .concat(haystack.includes("mcp") ? ["mcp"] : [])
      .concat(haystack.includes("prompt") ? ["prompting"] : [])
      .concat(haystack.includes("eval") ? ["evaluation"] : [])
      .concat(haystack.includes("research") ? ["research"] : []),
  );
  return {
    id: item.fullName,
    url: item.htmlUrl,
    sourceKind: "repo",
    repoClass,
    sourceGroup,
    platformTargets,
    useFor: ["discovery", "taxonomy", "candidate-ranking"],
    taxonomySignals,
    manualNotes:
      "Discovered automatically from GitHub topic/search and awesome-list outbound links. Review before using for canonical wording.",
    github: {
      fullName: item.fullName,
      description: item.description,
      stars: item.stars,
      forks: item.forks,
      updatedAt: item.updatedAt,
      archived: item.archived,
      topics: item.topics,
      isFork: item.isFork,
    },
    readmeSignals: null,
    linkedRepoIds: [],
    fetchStatus: "ok",
    fetchNotes: [],
    discoveryScore: repoDiscoveryScore(item),
  };
}

async function searchGithubRepos(query, perPage = 100) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;
  const data = await fetchJson(url);
  return (data.items || []).map((item) => ({
    fullName: item.full_name,
    description: item.description,
    stars: item.stargazers_count,
    forks: item.forks_count,
    updatedAt: item.updated_at,
    archived: item.archived,
    isFork: item.fork,
    htmlUrl: item.html_url,
    topics: item.topics || [],
  }));
}

async function collectDiscoveredRepos(directRepoSnapshots) {
  const awesomeLinkedIds = new Set();
  for (const snapshot of directRepoSnapshots) {
    for (const repoId of snapshot.linkedRepoIds || []) {
      awesomeLinkedIds.add(String(repoId).toLowerCase());
    }
  }

  const byId = new Map();
  for (const query of GITHUB_DISCOVERY_QUERIES) {
    const items = await searchGithubRepos(query, query === "topic:agent-skills" ? 100 : 40);
    for (const item of items) {
      const key = String(item.fullName || "").toLowerCase();
      if (!key || DIRECT_SOURCE_REPO_IDS.map((value) => value.toLowerCase()).includes(key)) {
        continue;
      }
      const existing = byId.get(key);
      if (!existing || (existing.stars || 0) < (item.stars || 0)) {
        byId.set(key, item);
      }
    }
  }

  const discovered = [...byId.values()]
    .filter((item) => repoDiscoveryScore(item) >= 4)
    .sort((a, b) => repoDiscoveryScore(b) - repoDiscoveryScore(a) || (b.stars || 0) - (a.stars || 0))
    .slice(0, 100)
    .map((item) => classifyDiscoveredRepo(item, awesomeLinkedIds));

  return discovered;
}

function inferRepoSummary(repos) {
  const repoCount = repos.length;
  const byClass = formatCountMap(repos, (repo) => repo.repoClass || repo.sourceKind);
  const bySourceGroup = formatCountMap(repos, (repo) => repo.sourceGroup);
  const taxonomyCounts = new Map();
  for (const repo of repos) {
    for (const signal of repo.taxonomySignals || []) {
      taxonomyCounts.set(signal, (taxonomyCounts.get(signal) || 0) + 1);
    }
  }
  const taxonomySignals = [...taxonomyCounts.entries()]
    .map(([signal, count]) => ({ signal, count }))
    .sort((a, b) => b.count - a.count || a.signal.localeCompare(b.signal));

  const platformCounts = new Map();
  for (const repo of repos) {
    for (const platform of repo.platformTargets || []) {
      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
    }
  }
  const platformTargets = [...platformCounts.entries()]
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count || a.platform.localeCompare(b.platform));

  return {
    repoCount,
    classCounts: byClass,
    sourceGroupCounts: bySourceGroup,
    taxonomySignals,
    platformTargets,
  };
}

function skillSortKey(item) {
  return `${item.cluster}:${item.id}`;
}

function clusterOrder(cluster) {
  const priority = CLUSTER_REWRITE_PRIORITIES.find((item) => item.cluster === cluster);
  return priority?.priority || 999;
}

function renderRepoLinks(ids) {
  return ids.map((id) => `\`${id}\``).join(", ");
}

function renderSourceLinks(ids) {
  return ids.map((id) => `\`${id}\``).join(", ");
}

async function main() {
  const skillCatalog = JSON.parse(await fs.readFile(SKILL_CATALOG_PATH, "utf8"));
  const currentSkills = skillCatalog.skills.filter((skill) => skill.kind === "skill");

  const directRepoSnapshots = [];
  for (const seed of PUBLIC_REPO_SEEDS) {
    directRepoSnapshots.push(await fetchRepoSnapshot(seed));
  }

  const directPageSnapshots = [];
  for (const seed of DIRECT_WEB_SOURCES) {
    directPageSnapshots.push(await fetchPageSnapshot(seed));
  }

  const discoveredRepos = await collectDiscoveredRepos(directRepoSnapshots);
  const sourceLedger = {
    $schema: "cubis-foundry-public-source-ledger-v1",
    generatedAt: new Date().toISOString(),
    discoveryQueries: DISCOVERY_QUERIES,
    githubDiscoveryQueries: GITHUB_DISCOVERY_QUERIES,
    directSources: [...directRepoSnapshots, ...directPageSnapshots],
    discoveredRepos,
    summary: {
      directSourceCount: directRepoSnapshots.length + directPageSnapshots.length,
      discoveredRepoCount: discoveredRepos.length,
    },
  };

  const corpusRepos = [...directRepoSnapshots, ...discoveredRepos];
  const corpus = {
    $schema: "cubis-foundry-public-skill-repo-corpus-v2",
    generatedAt: sourceLedger.generatedAt,
    discoveryQueries: DISCOVERY_QUERIES,
    githubDiscoveryQueries: GITHUB_DISCOVERY_QUERIES,
    summary: inferRepoSummary(corpusRepos),
    repos: corpusRepos,
  };

  const skillRows = [];
  for (const skill of currentSkills) {
    const spec = CURRENT_SKILL_REWRITE_SPECS[skill.id];
    if (!spec) {
      throw new Error(`Missing rewrite spec for current skill '${skill.id}'`);
    }
    const packaging = await collectLocalPackaging(skill.path);
    skillRows.push({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      layer: skill.layer,
      tier: skill.tier,
      maturity: skill.maturity,
      description: skill.description,
      cluster: spec.cluster,
      action: spec.action,
      benchmarkRepoIds: spec.benchmarkRepoIds,
      decision: spec.decision,
      keep: spec.keep,
      change: spec.change,
      packagingNext: spec.packagingNext,
      publicSignals: spec.publicSignals,
      packaging,
      path: skill.path,
    });
  }
  skillRows.sort(
    (a, b) =>
      clusterOrder(a.cluster) - clusterOrder(b.cluster) ||
      skillSortKey(a).localeCompare(skillSortKey(b)),
  );

  const gapMatrix = {
    $schema: "cubis-foundry-public-skill-gap-matrix-v2",
    generatedAt: corpus.generatedAt,
    summary: {
      currentSkillCount: skillRows.length,
      newCandidateCount: NEW_SKILL_CANDIDATES.length,
      actionCounts: formatCountMap(skillRows, (item) => item.action),
      clusterCounts: formatCountMap(skillRows, (item) => item.cluster),
    },
    clusterPriorities: CLUSTER_REWRITE_PRIORITIES,
    currentSkills: skillRows,
    newCandidateSkills: NEW_SKILL_CANDIDATES,
  };

  const sourceLedgerMarkdown = `# Public Source Ledger

Generated: ${sourceLedger.generatedAt}

## Summary

- Direct sources read: ${sourceLedger.summary.directSourceCount}
- Discovered repos retained: ${sourceLedger.summary.discoveredRepoCount}
- GitHub discovery queries: ${GITHUB_DISCOVERY_QUERIES.length}

## Direct Sources

| Source | Kind | Group | Use for | Notes |
| --- | --- | --- | --- | --- |
${[...directRepoSnapshots, ...directPageSnapshots]
  .map(
    (source) =>
      `| [${source.id}](${source.url}) | ${source.sourceKind} | ${source.sourceGroup} | ${(source.useFor || []).join(", ")} | ${source.manualNotes} |`,
  )
  .join("\n")}

## Top 100 Discovered Repos

| Repo | Class | Stars | Updated | Platforms | Score |
| --- | --- | ---: | --- | --- | ---: |
${discoveredRepos
  .map(
    (repo) =>
      `| [${repo.id}](${repo.url}) | ${repo.repoClass} | ${repo.github?.stars ?? 0} | ${shortDate(repo.github?.updatedAt)} | ${(repo.platformTargets || []).join(", ")} | ${repo.discoveryScore ?? 0} |`,
  )
  .join("\n")}
`;

  const corpusMarkdown = `# Public Skill Corpus

Generated: ${corpus.generatedAt}

## Summary

- Repos reviewed: ${corpus.summary.repoCount}
- Repo classes: ${corpus.summary.classCounts.map((item) => `\`${item.key}\` (${item.count})`).join(", ")}
- Source groups: ${corpus.summary.sourceGroupCounts.map((item) => `\`${item.key}\` (${item.count})`).join(", ")}
- Strongest taxonomy signals: ${corpus.summary.taxonomySignals.slice(0, 12).map((item) => `\`${item.signal}\` (${item.count})`).join(", ")}

## Discovery Queries

${DISCOVERY_QUERIES.map((query) => `- \`${query}\``).join("\n")}

## Repo Table

| Repo | Class | Platforms | Stars | Updated | Use for |
| --- | --- | --- | ---: | --- | --- |
${corpusRepos
  .map((repo) => {
    const stars = repo.github?.stars ?? 0;
    const updated = shortDate(repo.github?.updatedAt);
    return `| [${repo.id}](${repo.url}) | ${repo.repoClass} | ${(repo.platformTargets || []).join(", ")} | ${stars} | ${updated} | ${(repo.useFor || []).join(", ")} |`;
  })
  .join("\n")}
`;

  const sourceContributionMarkdown = `# Public Source Contribution Map

Generated: ${corpus.generatedAt}

## Direct Sources

${[...directRepoSnapshots, ...directPageSnapshots]
  .map((source) => {
    const pageNotes = source.pageSignals
      ? `- Page signals: skill=${yesNo(source.pageSignals.mentionsSkill)}, mcp=${yesNo(source.pageSignals.mentionsMcp)}, eval=${yesNo(source.pageSignals.mentionsEval)}, prompt=${yesNo(source.pageSignals.mentionsPrompt)}`
      : `- README signals: skill.md=${yesNo(source.readmeSignals?.mentionsSkillMd)}, references=${yesNo(source.readmeSignals?.mentionsReferencesDir)}, scripts=${yesNo(source.readmeSignals?.mentionsScriptsDir)}, install=${yesNo(source.readmeSignals?.mentionsInstall)}`;
    return `### ${source.id}
- Source: [${source.url}](${source.url})
- Kind: \`${source.sourceKind}\`
- Use for: ${(source.useFor || []).join(", ")}
- Manual notes: ${source.manualNotes}
${pageNotes}
- Fetch status: \`${source.fetchStatus}\`
`;
  })
  .join("\n")}

## Mapped Current Skills

| Skill | Cluster | Benchmarks |
| --- | --- | --- |
${skillRows
  .map((skill) => `| \`${skill.id}\` | ${skill.cluster} | ${renderSourceLinks(skill.benchmarkRepoIds)} |`)
  .join("\n")}
`;

  const gapMarkdown = `# Public Skill Gap Matrix

Generated: ${gapMatrix.generatedAt}

## Summary

- Current skills reviewed: ${gapMatrix.summary.currentSkillCount}
- New candidate skills: ${gapMatrix.summary.newCandidateCount}
- Actions: ${gapMatrix.summary.actionCounts.map((item) => `\`${item.key}\` (${item.count})`).join(", ")}
- Clusters: ${gapMatrix.summary.clusterCounts.map((item) => `\`${item.key}\` (${item.count})`).join(", ")}

## Current Skills

| Skill | Cluster | Action | Refs | Scripts | Templates | Benchmarks |
| --- | --- | --- | --- | --- | --- | --- |
${skillRows
  .map(
    (skill) =>
      `| \`${skill.id}\` | ${skill.cluster} | ${skill.action} | ${yesNo(skill.packaging.hasReferences)} | ${yesNo(skill.packaging.hasScripts)} | ${yesNo(skill.packaging.hasTemplates)} | ${renderRepoLinks(skill.benchmarkRepoIds.slice(0, 5))} |`,
  )
  .join("\n")}

## New Candidate Skills

| Skill | Cluster | Priority | Benchmark repos |
| --- | --- | --- | --- |
${NEW_SKILL_CANDIDATES.map(
  (candidate) =>
    `| \`${candidate.id}\` | ${candidate.cluster} | ${candidate.priority} | ${renderRepoLinks(candidate.benchmarkRepoIds)} |`,
).join("\n")}
`;

  const rewriteSpecsMarkdown = `# Rewrite Specs

Generated: ${gapMatrix.generatedAt}

${CLUSTER_REWRITE_PRIORITIES.map((clusterSpec) => {
  const clusterSkills = skillRows.filter((skill) => skill.cluster === clusterSpec.cluster);
  const clusterCandidates = NEW_SKILL_CANDIDATES.filter(
    (candidate) => candidate.cluster === clusterSpec.cluster,
  );
  return `## ${clusterSpec.cluster}

- Priority: ${clusterSpec.priority}
- Rationale: ${clusterSpec.rationale}

${clusterSkills
  .map(
    (skill) => `### ${skill.id}
- Action: \`${skill.action}\`
- Benchmarks: ${renderRepoLinks(skill.benchmarkRepoIds)}
- Keep: ${skill.keep}
- Change: ${skill.change}
- Packaging next: ${skill.packagingNext}
- Current packaging: references=${yesNo(skill.packaging.hasReferences)}, scripts=${yesNo(skill.packaging.hasScripts)}, templates=${yesNo(skill.packaging.hasTemplates)}
- Public signals: ${skill.publicSignals.join(" ")}
`,
  )
  .join("\n")}
${clusterCandidates.length > 0 ? `### Candidate additions
${clusterCandidates
  .map(
    (candidate) => `- \`${candidate.id}\` (${candidate.priority}): ${candidate.rationale} Benchmarks: ${renderRepoLinks(candidate.benchmarkRepoIds)}.`,
  )
  .join("\n")}` : ""}
`;
}).join("\n")}
`;

  const databaseRows = skillRows.filter((skill) => skill.cluster === "architecture-databases");
  const databaseCandidates = NEW_SKILL_CANDIDATES.filter(
    (candidate) => candidate.cluster === "architecture-databases",
  );
  const databaseBenchmarkMarkdown = `# Database Wave Benchmarks

Generated: ${gapMatrix.generatedAt}

## Current Canonicals

${databaseRows
  .map(
    (skill) => `### ${skill.id}
- Benchmarks: ${renderRepoLinks(skill.benchmarkRepoIds)}
- Decision: ${skill.decision}
- Packaging next: ${skill.packagingNext}
`,
  )
  .join("\n")}

## Candidate Follow-ons

${databaseCandidates
  .map(
    (candidate) => `- \`${candidate.id}\`: ${candidate.rationale} Benchmarks: ${renderRepoLinks(candidate.benchmarkRepoIds)}.`,
  )
  .join("\n")}
`;

  const agentBuilderRows = skillRows.filter((skill) => skill.cluster === "agent-builder");
  const agentBuilderBenchmarkMarkdown = `# Agent Builder Wave Benchmarks

Generated: ${gapMatrix.generatedAt}

${agentBuilderRows
  .map(
    (skill) => `### ${skill.id}
- Benchmarks: ${renderRepoLinks(skill.benchmarkRepoIds)}
- Decision: ${skill.decision}
- Packaging next: ${skill.packagingNext}
`,
  )
  .join("\n")}
`;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(CORPUS_JSON_PATH, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
  await fs.writeFile(GAP_JSON_PATH, `${JSON.stringify(gapMatrix, null, 2)}\n`, "utf8");
  await fs.writeFile(SOURCE_LEDGER_JSON_PATH, `${JSON.stringify(sourceLedger, null, 2)}\n`, "utf8");
  await fs.writeFile(CORPUS_MD_PATH, corpusMarkdown, "utf8");
  await fs.writeFile(GAP_MD_PATH, gapMarkdown, "utf8");
  await fs.writeFile(REWRITE_SPECS_MD_PATH, rewriteSpecsMarkdown, "utf8");
  await fs.writeFile(SOURCE_LEDGER_MD_PATH, sourceLedgerMarkdown, "utf8");
  await fs.writeFile(SOURCE_CONTRIBUTION_MD_PATH, sourceContributionMarkdown, "utf8");
  await fs.writeFile(DATABASE_BENCHMARK_MD_PATH, databaseBenchmarkMarkdown, "utf8");
  await fs.writeFile(AGENT_BUILDER_BENCHMARK_MD_PATH, agentBuilderBenchmarkMarkdown, "utf8");

  console.log(
    JSON.stringify(
      {
        sourceLedgerJson: SOURCE_LEDGER_JSON_PATH,
        corpusJson: CORPUS_JSON_PATH,
        gapJson: GAP_JSON_PATH,
        sourceLedgerMarkdown: SOURCE_LEDGER_MD_PATH,
        sourceContributionMarkdown: SOURCE_CONTRIBUTION_MD_PATH,
        databaseBenchmarkMarkdown: DATABASE_BENCHMARK_MD_PATH,
        agentBuilderBenchmarkMarkdown: AGENT_BUILDER_BENCHMARK_MD_PATH,
        rewriteSpecsMarkdown: REWRITE_SPECS_MD_PATH,
        directSourceCount: sourceLedger.summary.directSourceCount,
        discoveredRepoCount: sourceLedger.summary.discoveredRepoCount,
        currentSkillCount: skillRows.length,
        newCandidateCount: NEW_SKILL_CANDIDATES.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
