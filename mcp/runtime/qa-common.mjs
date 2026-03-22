import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function resolveHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

export function resolveConfigPath(scope = "auto", cwd = process.cwd()) {
  if (scope === "global") {
    return {
      path: path.join(resolveHomeDir(), ".cbx", "cbx_config.json"),
      scope: "global",
    };
  }
  if (scope === "project") {
    return {
      path: path.join(cwd, "cbx_config.json"),
      scope: "project",
    };
  }
  const projectPath = path.join(cwd, "cbx_config.json");
  if (existsSync(projectPath)) {
    return {
      path: projectPath,
      scope: "project",
    };
  }
  return {
    path: path.join(resolveHomeDir(), ".cbx", "cbx_config.json"),
    scope: "global",
  };
}

export async function readEffectiveConfig(scope = "auto", cwd = process.cwd()) {
  const resolved = resolveConfigPath(scope, cwd);
  if (!existsSync(resolved.path)) {
    return null;
  }
  const raw = await readFile(resolved.path, "utf8");
  return {
    path: resolved.path,
    scope: resolved.scope,
    config: JSON.parse(raw),
  };
}

export function splitTopLevelItems(value) {
  const items = [];
  let current = [];
  let braceDepth = 0;
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      current.push(line);
      continue;
    }
    const startsItem = /^- /.test(trimmed) && braceDepth === 0;
    if (startsItem && current.length > 0) {
      items.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
    if (trimmed.includes("[") || trimmed.includes("{")) {
      braceDepth += 1;
    }
    if (trimmed.includes("]") || trimmed.includes("}")) {
      braceDepth = Math.max(0, braceDepth - 1);
    }
  }
  if (current.length > 0) {
    items.push(current.join("\n"));
  }
  return items.filter((item) => item.trim());
}

function stripQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  return stripQuotes(trimmed);
}

export function parseSimpleYaml(content) {
  const lines = content.replace(/\t/g, "  ").split(/\r?\n/);
  const result = {};
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.replace(/\s+#.*$/, "");
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }
    const keyMatch = /^([A-Za-z0-9_]+):(?:\s*(.*))?$/.exec(trimmed);
    if (!keyMatch) {
      index += 1;
      continue;
    }
    const [, key, inlineValue] = keyMatch;
    if (inlineValue) {
      result[key] = parseScalar(inlineValue);
      index += 1;
      continue;
    }

    const childLines = [];
    index += 1;
    while (index < lines.length) {
      const candidate = lines[index];
      if (!candidate.trim()) {
        childLines.push(candidate);
        index += 1;
        continue;
      }
      const indent = candidate.match(/^ */)?.[0]?.length ?? 0;
      if (indent < 2) {
        break;
      }
      childLines.push(candidate.slice(2));
      index += 1;
    }

    if (childLines.some((lineText) => lineText.trim().startsWith("- "))) {
      const items = splitTopLevelItems(childLines.join("\n"));
      result[key] = items.map((item) => {
        const normalized = item
          .split(/\r?\n/)
          .map((lineText) =>
            lineText.trim().startsWith("- ")
              ? lineText.replace(/^\s*-\s*/, "")
              : lineText,
          )
          .join("\n");
        if (!normalized.includes(":")) {
          return parseScalar(normalized);
        }
        const object = {};
        for (const itemLine of normalized.split(/\r?\n/)) {
          const trimmedItemLine = itemLine.trim();
          if (!trimmedItemLine) continue;
          const itemMatch = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(trimmedItemLine);
          if (!itemMatch) continue;
          object[itemMatch[1]] = parseScalar(itemMatch[2]);
        }
        return object;
      });
    } else {
      result[key] = childLines.map((lineText) => stripQuotes(lineText.trim())).join("\n");
    }
  }

  return result;
}

export async function loadCharter(charterPath) {
  const raw = await readFile(charterPath, "utf8");
  return parseSimpleYaml(raw);
}

export async function ensureArtifactDirs(rootDir, extra = []) {
  const directories = { root: rootDir };
  for (const name of extra) {
    directories[name] = path.join(rootDir, name);
  }
  await mkdir(rootDir, { recursive: true });
  for (const value of Object.values(directories)) {
    await mkdir(value, { recursive: true });
  }
  return directories;
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function parseToolText(result) {
  const text =
    result?.content?.find?.((item) => item.type === "text")?.text?.trim() || null;
  if (!text) {
    return { text: null, json: null };
  }
  try {
    return {
      text,
      json: JSON.parse(text),
    };
  } catch {
    return {
      text,
      json: null,
    };
  }
}

export function findFirstArray(payload, keys) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }
  return [];
}

export function normalizeToolName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
