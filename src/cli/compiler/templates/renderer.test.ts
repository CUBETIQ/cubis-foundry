import { describe, expect, it } from "vitest";
import { renderTemplate } from "./renderer.js";

describe("renderer", () => {
  describe("variable interpolation", () => {
    it("interpolates a bare variable", () => {
      expect(renderTemplate("Hello, {{ name }}!", { name: "World" })).toBe(
        "Hello, World!",
      );
    });

    it("interpolates obj.key (1 level deep)", () => {
      const ctx = { module: { label: "Context Docs" } };
      expect(renderTemplate("Module: {{ module.label }}", ctx)).toBe(
        "Module: Context Docs",
      );
    });

    it("renders undefined/null as empty string", () => {
      expect(renderTemplate("{{ missing }}", {})).toBe("");
      expect(renderTemplate("{{ nothing }}", { nothing: null })).toBe("");
    });

    it("renders numbers and booleans as strings", () => {
      expect(renderTemplate("{{ count }}", { count: 42 })).toBe("42");
      expect(renderTemplate("{{ flag }}", { flag: true })).toBe("true");
    });

    it("strips whitespace around variable names", () => {
      expect(renderTemplate("{{  name  }}", { name: "trimmed" })).toBe("trimmed");
    });
  });

  describe("for loops", () => {
    it("renders a list of strings", () => {
      const tmpl = "Items: {% for item in items %}{{ item }},{% endfor %}";
      expect(renderTemplate(tmpl, { items: ["a", "b"] })).toBe("Items: a,b,");
    });

    it("renders an empty list as nothing", () => {
      expect(renderTemplate("{% for item in items %}{{ item }}{% endfor %}", { items: [] })).toBe("");
    });

    it("makes loop item available as a plain variable inside the body", () => {
      const tmpl = "{% for item in items %}[{{ item.label }}]{% endfor %}";
      expect(renderTemplate(tmpl, { items: [{ label: "A" }, { label: "B" }] })).toBe("[A][B]");
    });

    it("supports nested for loops", () => {
      const tmpl = "{% for outer in groups %}{{ outer.name }}:{% for inner in outer.items %}{{ inner }}{% endfor %},{% endfor %}";
      const ctx = {
        groups: [
          { name: "G1", items: ["a", "b"] },
          { name: "G2", items: ["c"] },
        ],
      };
      expect(renderTemplate(tmpl, ctx)).toBe("G1:ab,G2:c,");
    });

    it("supports dot-notation list access in for loop", () => {
      const tmpl = "{% for item in module.tags %}{{ item }}{% endfor %}";
      // No separator — items concatenate directly.
      expect(renderTemplate(tmpl, { module: { tags: ["docs", "core"] } })).toBe(
        "docscore",
      );
    });
  });

  describe("if conditionals", () => {
    it("renders block when condition is truthy", () => {
      const tmpl = "{% if enabled %}ON{% endif %}";
      expect(renderTemplate(tmpl, { enabled: true })).toBe("ON");
      expect(renderTemplate(tmpl, { enabled: "yes" })).toBe("ON");
      expect(renderTemplate(tmpl, { enabled: 1 })).toBe("ON");
      expect(renderTemplate(tmpl, { enabled: [] })).toBe(""); // empty array is falsy
    });

    it("renders block when condition is a truthy dot-notation value", () => {
      const tmpl = "{% if module.active %}ACTIVE{% endif %}";
      expect(renderTemplate(tmpl, { module: { active: true } })).toBe("ACTIVE");
      expect(renderTemplate(tmpl, { module: { active: false } })).toBe("");
    });

    it("renders nothing when condition is falsy", () => {
      expect(renderTemplate("{% if flag %}yes{% endif %}", { flag: false })).toBe("");
      expect(renderTemplate("{% if flag %}yes{% endif %}", { flag: undefined })).toBe("");
      expect(renderTemplate("{% if flag %}yes{% endif %}", { flag: "" })).toBe("");
      expect(renderTemplate("{% if flag %}yes{% endif %}", { flag: 0 })).toBe("");
    });
  });

  describe("mixed templates", () => {
    it("handles for loop inside if inside for", () => {
      const tmpl = `{% for mod in modules %}{% if mod.active %}{{ mod.label }}: {% for tag in mod.tags %}[{{ tag }}]{% endfor %}
{% endif %}{% endfor %}`;
      const ctx = {
        modules: [
          { label: "A", active: true, tags: ["x", "y"] },
          { label: "B", active: false, tags: ["z"] },
        ],
      };
      expect(renderTemplate(tmpl, ctx)).toBe("A: [x][y]\n");
    });
  });
});
