import { describe, it, expect } from "vitest";
import { loadRules, mergeRules, isUserOverridden, compileRules } from "./index.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { RuleSet } from "./smart-rule.js";

const FIXTURES = join(import.meta.dirname, "__fixtures__");

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_RULESET_YAML = `
id: test-ruleset
version: "1.0.0"
rules:
  - id: no-any-type
    scope: file
    condition: file.endsWith('.ts')
    action: error
    priority: 10
    message: "Avoid using the 'any' type"
    userOverrideable: true

  - id: prefer-const
    scope: file
    condition: file.endsWith('.js')
    action: warn
    priority: 5
    message: "Prefer const over let"
    userOverrideable: false
`;

const USER_OVERRIDE_RULESET_YAML = `
id: user-ruleset
version: "1.0.0"
rules:
  - id: no-any-type
    scope: project
    condition: project === 'cli'
    action: warn
    priority: 20
    message: "My custom no-any rule"
    userOverrideable: true
`;

beforeAll(async () => {
  await mkdir(FIXTURES, { recursive: true });
  await writeFile(join(FIXTURES, "valid-ruleset.yaml"), VALID_RULESET_YAML);
  await writeFile(join(FIXTURES, "user-override.yaml"), USER_OVERRIDE_RULESET_YAML);
});

afterAll(async () => {
  await rm(FIXTURES, { recursive: true, force: true });
});

// ─── loadRules ────────────────────────────────────────────────────────────────

describe("loadRules", () => {
  it("parses valid YAML and returns a RuleSet", async () => {
    const ruleset = await loadRules(join(FIXTURES, "valid-ruleset.yaml"));
    expect(ruleset.id).toBe("test-ruleset");
    expect(ruleset.version).toBe("1.0.0");
    expect(ruleset.rules).toHaveLength(2);
  });

  it("parses each rule with correct fields", async () => {
    const ruleset = await loadRules(join(FIXTURES, "valid-ruleset.yaml"));
    const rule = ruleset.rules[0];
    expect(rule.id).toBe("no-any-type");
    expect(rule.scope).toBe("file");
    expect(rule.condition).toBe("file.endsWith('.ts')");
    expect(rule.action).toBe("error");
    expect(rule.priority).toBe(10);
    expect(rule.userOverrideable).toBe(true);
  });
});

// ─── mergeRules ───────────────────────────────────────────────────────────────

describe("mergeRules", () => {
  const generated: RuleSet = {
    id: "gen",
    version: "1.0.0",
    rules: [
      {
        id: "rule-a",
        scope: "file",
        condition: "file.endsWith('.ts')",
        action: "error",
        priority: 10,
        message: "Generated rule A",
        userOverrideable: true,
      },
      {
        id: "rule-b",
        scope: "project",
        condition: "project === 'cli'",
        action: "warn",
        priority: 5,
        message: "Generated rule B",
        userOverrideable: false,
      },
      {
        id: "rule-c",
        scope: "global",
        condition: "true",
        action: "suggest",
        priority: 1,
        message: "Generated rule C",
        userOverrideable: true,
      },
    ],
  };

  it("user rule wins when userOverrideable is true", () => {
    const user: RuleSet = {
      id: "user",
      version: "1.0.0",
      rules: [
        {
          id: "rule-a",
          scope: "project",
          condition: "project === 'web'",
          action: "warn",
          priority: 50,
          message: "User override of rule A",
          userOverrideable: true,
        },
      ],
    };

    const merged = mergeRules(user, generated);
    const ruleA = merged.rules.find((r) => r.id === "rule-a")!;
    expect(ruleA.message).toBe("User override of rule A");
    expect(ruleA.scope).toBe("project");
  });

  it("generated rule wins when userOverrideable is false", () => {
    const user: RuleSet = {
      id: "user",
      version: "1.0.0",
      rules: [
        {
          id: "rule-b",
          scope: "project",
          condition: "project === 'web'",
          action: "warn",
          priority: 50,
          message: "User tries to override rule B",
          userOverrideable: true,
        },
      ],
    };

    const merged = mergeRules(user, generated);
    const ruleB = merged.rules.find((r) => r.id === "rule-b")!;
    expect(ruleB.message).toBe("Generated rule B");
    expect(ruleB.userOverrideable).toBe(false);
  });

  it("returns all rules (generated-only + user-only + merged)", () => {
    const user: RuleSet = {
      id: "user",
      version: "1.0.0",
      rules: [
        {
          id: "rule-a",
          scope: "file",
          condition: "file.endsWith('.ts')",
          action: "error",
          priority: 10,
          message: "User rule A",
          userOverrideable: true,
        },
        {
          id: "rule-d", // unique to user
          scope: "global",
          condition: "true",
          action: "suggest",
          priority: 2,
          message: "User-only rule D",
          userOverrideable: true,
        },
      ],
    };

    const merged = mergeRules(user, generated);
    const ids = merged.rules.map((r) => r.id);
    expect(ids).toContain("rule-a");
    expect(ids).toContain("rule-b");
    expect(ids).toContain("rule-c");
    expect(ids).toContain("rule-d");
  });

  it("sorts merged rules by priority descending", () => {
    const merged = mergeRules(null, generated);
    const priorities = merged.rules.map((r) => r.priority);
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i + 1]);
    }
  });

  it("handles null userRules gracefully", () => {
    const merged = mergeRules(null, generated);
    expect(merged.rules).toHaveLength(3);
    expect(merged.id).toBe("gen");
  });
});

// ─── isUserOverridden ────────────────────────────────────────────────────────

describe("isUserOverridden", () => {
  const userRules: RuleSet = {
    id: "user",
    version: "1.0.0",
    rules: [
      {
        id: "override-me",
        scope: "file",
        condition: "file.endsWith('.ts')",
        action: "error",
        priority: 10,
        message: "User override",
        userOverrideable: true,
      },
    ],
  };

  it("returns true when the rule id exists in user rules", () => {
    expect(isUserOverridden("override-me", userRules)).toBe(true);
  });

  it("returns false when the rule id does not exist in user rules", () => {
    expect(isUserOverridden("non-existent", userRules)).toBe(false);
  });

  it("returns false when userRules is null", () => {
    expect(isUserOverridden("any-rule", null)).toBe(false);
  });
});

// ─── compileRules ─────────────────────────────────────────────────────────────

describe("compileRules", () => {
  const ruleset: RuleSet = {
    id: "compile-test",
    version: "1.0.0",
    rules: [
      {
        id: "ts-rule",
        scope: "file",
        condition: "file.endsWith('.ts')",
        action: "error",
        priority: 10,
        message: "TS rule matched",
        userOverrideable: true,
      },
      {
        id: "cli-rule",
        scope: "project",
        condition: "project === 'cli'",
        action: "warn",
        priority: 5,
        message: "CLI rule matched",
        userOverrideable: true,
      },
      {
        id: "src-rule",
        scope: "file",
        condition: "file.includes('src/')",
        action: "suggest",
        priority: 8,
        message: "Src file matched",
        userOverrideable: true,
      },
      {
        id: "never-match",
        scope: "global",
        condition: "false",
        action: "error",
        priority: 20,
        message: "Never matches",
        userOverrideable: true,
      },
    ],
  };

  it("returns rules whose condition evaluates to true", () => {
    const matches = compileRules(ruleset, { file: "index.ts" });
    expect(matches.map((r) => r.id)).toContain("ts-rule");
  });

  it("returns empty array when no rules match", () => {
    const matches = compileRules(ruleset, { file: "README.md" });
    expect(matches).toHaveLength(0);
  });

  it("matches on project context", () => {
    const matches = compileRules(ruleset, { project: "cli" });
    expect(matches.map((r) => r.id)).toContain("cli-rule");
  });

  it("matches on combined conditions", () => {
    const matches = compileRules(ruleset, {
      file: "src/index.ts",
      project: "cli",
    });
    expect(matches.map((r) => r.id)).toContain("ts-rule");
    expect(matches.map((r) => r.id)).toContain("cli-rule");
    expect(matches.map((r) => r.id)).toContain("src-rule");
  });

  it("returns matches sorted by priority descending", () => {
    const matches = compileRules(ruleset, {
      file: "src/index.ts",
      project: "cli",
    });
    const priorities = matches.map((r) => r.priority);
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i + 1]);
    }
  });

  it("supports logical AND conditions", () => {
    const rules: RuleSet = {
      id: "and-test",
      version: "1.0.0",
      rules: [
        {
          id: "and-rule",
          scope: "file",
          condition: "file && file.includes('src/')",
          action: "warn",
          priority: 1,
          message: "AND matched",
          userOverrideable: true,
        },
      ],
    };
    const matches = compileRules(rules, { file: "src/app.ts" });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("and-rule");
  });
});
