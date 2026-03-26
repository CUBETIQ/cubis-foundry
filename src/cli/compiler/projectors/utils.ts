import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface MarkdownDocument {
  raw: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface ProjectionRule {
  format: string;
  outputPattern?: string;
  outputDir?: string;
  settingsPath?: string;
  enabled?: boolean;
}

export function checksum(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function readUtf8(filePath: string): string {
  return readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

export function parseMarkdownDocument(rawMarkdown: string): MarkdownDocument {
  const raw = rawMarkdown.replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { raw, frontmatter: {}, body: raw.trimStart() };
  }

  const parsed = parseYaml(match[1]);
  const frontmatter =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  return {
    raw,
    frontmatter,
    body: raw.slice(match[0].length).trimStart(),
  };
}

export function stringifyMarkdownDocument(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const yaml = stringifyYaml(frontmatter).trimEnd();
  const trimmedBody = body.trim();
  return `---\n${yaml}\n---\n\n${trimmedBody}\n`;
}

export function escapeTomlBasicString(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

export function escapeTomlMultilineString(value: string): string {
  return String(value).replace(/"""/g, '\\"\\"\\"').trim();
}

export function scalar(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string" ? value : fallback;
}

export function bool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function renderOutputPattern(pattern: string, id: string): string {
  return pattern.replaceAll("{id}", id);
}

export function listFilesRecursive(
  rootDir: string,
  predicate: (filePath: string) => boolean,
): string[] {
  const results: string[] = [];

  function walk(currentDir: string): void {
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results.sort();
}

export function isMarkdownFile(filePath: string): boolean {
  return filePath.endsWith(".md");
}

export function idFromMarkdownFile(filePath: string): string {
  return basename(filePath, ".md");
}
