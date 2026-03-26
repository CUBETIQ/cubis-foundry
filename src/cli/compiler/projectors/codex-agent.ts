import {
  escapeTomlBasicString,
  escapeTomlMultilineString,
  parseMarkdownDocument,
  scalar,
} from "./utils.js";

interface CodexAgentConfig {
  model: string;
  effort: "low" | "medium" | "high";
  sandbox: "read-only" | "workspace-write";
}

const CODEX_AGENT_CONFIG: Record<string, CodexAgentConfig> = {
  orchestrator: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  planner: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  reviewer: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  debugger: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  tester: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  researcher: {
    model: "gpt-5.4",
    effort: "high",
    sandbox: "read-only",
  },
  implementer: {
    model: "gpt-5.4-mini",
    effort: "medium",
    sandbox: "workspace-write",
  },
  explorer: {
    model: "gpt-5.4-mini",
    effort: "medium",
    sandbox: "read-only",
  },
};

export function projectCodexAgent(markdown: string, fallbackId: string): string {
  const document = parseMarkdownDocument(markdown);
  const name = scalar(document.frontmatter.name, fallbackId);
  const description = scalar(document.frontmatter.description, fallbackId);
  const config = CODEX_AGENT_CONFIG[fallbackId] ?? {
    model: "gpt-5.4-mini",
    effort: "medium" as const,
    sandbox: "read-only" as const,
  };

  return [
    `name = "${escapeTomlBasicString(name)}"`,
    `description = "${escapeTomlBasicString(description)}"`,
    `model = "${config.model}"`,
    `model_reasoning_effort = "${config.effort}"`,
    `sandbox_mode = "${config.sandbox}"`,
    'developer_instructions = """',
    escapeTomlMultilineString(document.body),
    '"""',
    "",
  ].join("\n");
}
