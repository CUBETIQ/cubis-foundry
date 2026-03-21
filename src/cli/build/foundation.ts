import path from "node:path";

export const FOUNDATION_DOCS_DIR = path.join("docs", "foundation");
export const FOUNDATION_ADR_DIR = path.join(FOUNDATION_DOCS_DIR, "adr");
export const FOUNDATION_MEMORY_DIR = path.join(FOUNDATION_DOCS_DIR, "memory");
export const FOUNDATION_DESIGN_DIR = path.join(FOUNDATION_DOCS_DIR, "design");

export const ARCHITECTURE_BUILD_PLATFORM_CAPABILITIES = {
  antigravity:
    "You are generating repo-shared foundation docs for Antigravity. Use the Gemini-family CLI surface available in this environment and optimize the docs for `.agents/rules/GEMINI.md` plus command-driven workflows.",
  codex: "You can read, write, and execute shell commands. Use `codex exec` mode.",
  claude:
    "You can read, write files, and run bash commands. Use non-interactive mode.",
  gemini:
    "You can read, write files, and run commands within your sandbox. Follow Gemini CLI conventions.",
  copilot:
    "You can read, write files, and use terminal commands. Follow Copilot agent conventions.",
} as const;

export function buildProductBuildSkeleton() {
  return [
    "# Product",
    "",
    "This file is managed by `cbx build architecture`.",
    "",
    "<!-- cbx:product:foundation:start version=1 profile=uninitialized -->",
    "Replace this managed section by running `cbx build architecture --platform <antigravity|codex|claude|gemini|copilot>`.",
    "<!-- cbx:product:foundation:end -->",
    "",
  ].join("\n");
}

export function buildArchitectureBuildSkeleton() {
  return [
    "# Architecture",
    "",
    "This file is managed by `cbx build architecture`.",
    "",
    "<!-- cbx:architecture:doc:start version=1 profile=uninitialized -->",
    "Replace this managed section by running `cbx build architecture --platform <antigravity|codex|claude|gemini|copilot>`.",
    "<!-- cbx:architecture:doc:end -->",
    "",
  ].join("\n");
}

export function buildTechBuildSkeleton() {
  return [
    "# TECH.md",
    "",
    "This file is managed by `cbx build architecture`.",
    "",
    "<!-- cbx:architecture:tech:start version=1 snapshot=uninitialized -->",
    "Replace this managed section by running `cbx build architecture --platform <antigravity|codex|claude|gemini|copilot>`.",
    "<!-- cbx:architecture:tech:end -->",
    "",
  ].join("\n");
}

export function buildMemoryBuildSkeleton() {
  return [
    "# Memory",
    "",
    "This file is managed by `cbx build architecture` as the durable AI entrypoint for the project.",
    "",
    "<!-- cbx:memory:index:start version=1 profile=uninitialized -->",
    "Replace this managed section by running `cbx build architecture --platform <antigravity|codex|claude|gemini|copilot>`.",
    "<!-- cbx:memory:index:end -->",
    "",
  ].join("\n");
}

export function buildDesignBuildSkeleton() {
  return [
    "# Design",
    "",
    "This file is managed by `cbx build architecture` as the durable design-system backbone for UI, Stitch, and mobile work.",
    "",
    "<!-- cbx:design:foundation:start version=1 profile=uninitialized -->",
    "Replace this managed section by running `cbx build architecture --platform <antigravity|codex|claude|gemini|copilot>`.",
    "<!-- cbx:design:foundation:end -->",
    "",
  ].join("\n");
}

export function buildMemoryTopicSkeleton(title: string, topicId: string) {
  return [
    `# ${title}`,
    "",
    "This file is managed by `cbx build architecture`.",
    "",
    `<!-- cbx:memory:topic:start version=1 topic=${topicId} profile=uninitialized -->`,
    "Replace this managed section by running `cbx build architecture`.",
    "<!-- cbx:memory:topic:end -->",
    "",
  ].join("\n");
}

export function buildAdrReadme() {
  return [
    "# Architecture Decision Records",
    "",
    "Use this directory for durable decisions that future contributors and agents need to preserve.",
    "",
    "## When to add an ADR",
    "",
    "- Architecture style or boundary changes",
    "- Data model or persistence strategy changes",
    "- Deployment or scaling model changes",
    "- Design-system ownership or shared UX pattern changes",
    "",
    "## Suggested format",
    "",
    "1. Context",
    "2. Decision",
    "3. Consequences",
    "4. Validation",
    "",
    "Start with `0000-template.md` and create numbered follow-up ADRs for accepted decisions.",
    "",
  ].join("\n");
}

export function buildAdrTemplate() {
  return [
    "# ADR 0000: Title",
    "",
    "## Status",
    "",
    "Proposed",
    "",
    "## Context",
    "",
    "- What problem or pressure led to this decision?",
    "",
    "## Decision",
    "",
    "- What is the chosen direction?",
    "",
    "## Consequences",
    "",
    "- What tradeoffs, benefits, or costs follow from this choice?",
    "",
    "## Validation",
    "",
    "- How will the team know this decision is working?",
    "",
  ].join("\n");
}
