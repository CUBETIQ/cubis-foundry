import {
  escapeTomlBasicString,
  parseMarkdownDocument,
  scalar,
} from "./utils.js";

export function projectGeminiCommand(markdown: string, fallbackId: string): string {
  const document = parseMarkdownDocument(markdown);
  const description = scalar(document.frontmatter.description, fallbackId);

  return [
    `description = "${escapeTomlBasicString(description)}"`,
    "prompt = '''",
    document.body.trim(),
    "'''",
    "",
  ].join("\n");
}
