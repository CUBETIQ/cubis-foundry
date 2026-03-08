#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import {
  CLUSTER_REWRITE_PRIORITIES,
  CURRENT_SKILL_REWRITE_SPECS,
  DISCOVERY_QUERIES,
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
const CORPUS_MD_PATH = path.join(ROOT, "docs", "agent-skills", "public-skill-corpus.md");
const GAP_MD_PATH = path.join(ROOT, "docs", "agent-skills", "public-skill-gap-matrix.md");
const REWRITE_SPECS_MD_PATH = path.join(ROOT, "docs", "agent-skills", "rewrite-specs.md");

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
  return [...text.matchAll(pattern)].length;
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
    github: null,
    readmeSignals: null,
    fetchStatus: "ok",
    fetchNotes: [],
  };

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
    };
  } catch (error) {
    snapshot.fetchStatus = "partial";
    snapshot.fetchNotes.push(`repo metadata unavailable: ${error.message}`);
  }

  try {
    const readme = await fetchText(readmeApiUrl);
    snapshot.readmeSignals = readmeSignals(readme);
  } catch (error) {
    snapshot.fetchStatus = snapshot.fetchStatus === "ok" ? "partial" : "error";
    snapshot.fetchNotes.push(`readme unavailable: ${error.message}`);
    snapshot.readmeSignals = readmeSignals("");
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

function inferRepoSummary(repos) {
  const repoCount = repos.length;
  const byClass = formatCountMap(repos, (repo) => repo.repoClass);
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

async function main() {
  const skillCatalog = JSON.parse(await fs.readFile(SKILL_CATALOG_PATH, "utf8"));
  const currentSkills = skillCatalog.skills.filter((skill) => skill.kind === "skill");

  const repoSnapshots = [];
  for (const seed of PUBLIC_REPO_SEEDS) {
    repoSnapshots.push(await fetchRepoSnapshot(seed));
  }

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
  skillRows.sort((a, b) => clusterOrder(a.cluster) - clusterOrder(b.cluster) || skillSortKey(a).localeCompare(skillSortKey(b)));

  const corpus = {
    $schema: "cubis-foundry-public-skill-repo-corpus-v1",
    generatedAt: new Date().toISOString(),
    discoveryQueries: DISCOVERY_QUERIES,
    summary: inferRepoSummary(repoSnapshots),
    repos: repoSnapshots,
  };

  const gapMatrix = {
    $schema: "cubis-foundry-public-skill-gap-matrix-v1",
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

  const corpusMarkdown = `# Public Skill Corpus

Generated: ${corpus.generatedAt}

## Summary

- Repos reviewed: ${corpus.summary.repoCount}
- Repo classes: ${corpus.summary.classCounts.map((item) => `\`${item.key}\` (${item.count})`).join(", ")}
- Source groups: ${corpus.summary.sourceGroupCounts.map((item) => `\`${item.key}\` (${item.count})`).join(", ")}
- Strongest taxonomy signals: ${corpus.summary.taxonomySignals.slice(0, 10).map((item) => `\`${item.signal}\` (${item.count})`).join(", ")}

## Discovery Queries

${DISCOVERY_QUERIES.map((query) => `- \`${query}\``).join("\n")}

## Repo Table

| Repo | Class | Platforms | Stars | Updated | Use for |
| --- | --- | --- | ---: | --- | --- |
${repoSnapshots
  .map((repo) => {
    const stars = repo.github?.stars ?? 0;
    const updated = shortDate(repo.github?.updatedAt);
    return `| [${repo.id}](${repo.url}) | ${repo.repoClass} | ${(repo.platformTargets || []).join(", ")} | ${stars} | ${updated} | ${(repo.useFor || []).join(", ")} |`;
  })
  .join("\n")}

## Notes

${repoSnapshots
  .map((repo) => `### ${repo.id}\n- Class: \`${repo.repoClass}\`\n- Signals: ${(repo.taxonomySignals || []).join(", ")}\n- Notes: ${repo.manualNotes}\n- README signals: skill.md=${yesNo(repo.readmeSignals?.mentionsSkillMd)}, references=${yesNo(repo.readmeSignals?.mentionsReferencesDir)}, scripts=${yesNo(repo.readmeSignals?.mentionsScriptsDir)}, install=${yesNo(repo.readmeSignals?.mentionsInstall)}, marketplace=${yesNo(repo.readmeSignals?.mentionsMarketplace)}\n`)
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
      `| \`${skill.id}\` | ${skill.cluster} | ${skill.action} | ${yesNo(skill.packaging.hasReferences)} | ${yesNo(skill.packaging.hasScripts)} | ${yesNo(skill.packaging.hasTemplates)} | ${renderRepoLinks(skill.benchmarkRepoIds.slice(0, 4))} |`,
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

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(CORPUS_JSON_PATH, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
  await fs.writeFile(GAP_JSON_PATH, `${JSON.stringify(gapMatrix, null, 2)}\n`, "utf8");
  await fs.writeFile(CORPUS_MD_PATH, corpusMarkdown, "utf8");
  await fs.writeFile(GAP_MD_PATH, gapMarkdown, "utf8");
  await fs.writeFile(REWRITE_SPECS_MD_PATH, rewriteSpecsMarkdown, "utf8");

  console.log(
    JSON.stringify(
      {
        corpusJson: CORPUS_JSON_PATH,
        gapJson: GAP_JSON_PATH,
        corpusMarkdown: CORPUS_MD_PATH,
        gapMarkdown: GAP_MD_PATH,
        rewriteSpecsMarkdown: REWRITE_SPECS_MD_PATH,
        repoCount: repoSnapshots.length,
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
