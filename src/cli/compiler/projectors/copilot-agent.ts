import {
  parseMarkdownDocument,
  stringifyMarkdownDocument,
} from "./utils.js";

const COPILOT_ALLOWED_AGENT_KEYS = new Set([
  "agents",
  "name",
  "description",
  "tools",
  "target",
  "infer",
  "mcp-servers",
  "metadata",
  "model",
  "handoffs",
  "argument-hint",
]);

export function projectCopilotAgent(markdown: string): string {
  const document = parseMarkdownDocument(markdown);
  const filteredFrontmatter = Object.fromEntries(
    Object.entries(document.frontmatter).filter(([key]) =>
      COPILOT_ALLOWED_AGENT_KEYS.has(key),
    ),
  );

  return stringifyMarkdownDocument(filteredFrontmatter, document.body);
}
