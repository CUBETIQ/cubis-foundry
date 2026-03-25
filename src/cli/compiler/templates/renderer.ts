/**
 * A minimal Jinja2-like template renderer supporting:
 * - `{{ variable }}` — simple interpolation
 * - `{{ obj.key }}` — dot notation (1 level deep)
 * - `{% for item in list %}...{% endfor %}` — for loops (properly handles nesting)
 * - `{% if condition %}...{% endif %}` — conditionals
 *
 * Uses a depth-tracking state machine to process innermost for-loop blocks
 * first, avoiding the issue where outer-loop renders pollute inner-loop
 * pattern matching.
 */

export interface RenderContext {
  [key: string]: unknown;
}

// ── Context resolution ──────────────────────────────────────────────────────

/**
 * Resolve a dotted key path (max 1 level deep) in the given scope.
 * e.g. resolveDot("module.label", { module: { label: "Foo" } }) → "Foo"
 */
function resolveDot(path: string, scope: Record<string, unknown>): unknown {
  const dot = path.indexOf(".");
  if (dot === -1) {
    return scope[path];
  }
  const obj = scope[path.slice(0, dot)];
  if (typeof obj === "object" && obj !== null) {
    return (obj as Record<string, unknown>)[path.slice(dot + 1)];
  }
  return undefined;
}

function evalCondition(expr: string, scope: Record<string, unknown>): boolean {
  const trimmed = expr.trim();
  const val = resolveDot(trimmed, scope);
  if (val === undefined || val === null) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") return val.length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

// ── Depth-aware for-loop processor ──────────────────────────────────────────

interface LoopTag {
  type: "for";
  name: string;       // loop variable name, e.g. "item"
  iterable: string;   // expression, e.g. "items" or "module.tags"
  start: number;      // index of "{%" in source
  bodyStart: number;  // index right after "%}"
  endTagStart: number; // index of "{%" of the matching "{% endfor %}"
  end: number;        // index right after "%}" of the "{% endfor %}"
}

/**
 * Find all {% for %}...{% endfor %} blocks in `src` and return them in
 * innermost-first order (so we can replace them from the inside out without
 * outer replacements invalidating inner indices).
 */
function findForBlocks(src: string): LoopTag[] {
  const loops: LoopTag[] = [];
  const stack: number[] = []; // indices into `loops` stack
  let i = 0;

  while (i < src.length) {
    const openIdx = src.indexOf("{%", i);
    if (openIdx === -1) break;

    const tagEnd = src.indexOf("%}", openIdx);
    if (tagEnd === -1) break;

    const rawTag = src.slice(openIdx + 2, tagEnd).trim();

    if (rawTag.startsWith("for ")) {
      // Parse: {% for <name> in <expr> %}
      const match = rawTag.match(/^for\s+(\w+)\s+in\s+([\w.]+)\s*$/);
      if (match) {
        const loopIdx = loops.length;
        loops.push({
          type: "for",
          name: match[1]!,
          iterable: match[2]!,
          start: openIdx,
          bodyStart: tagEnd + 2,
          endTagStart: -1,
          end: -1,
        });
        stack.push(loopIdx);
      }
      i = tagEnd + 2;
    } else if (rawTag === "endfor") {
      if (stack.length > 0) {
        const loopIdx = stack.pop()!;
        loops[loopIdx]!.endTagStart = openIdx;
        loops[loopIdx]!.end = tagEnd + 2;
      }
      i = tagEnd + 2;
    } else {
      i = tagEnd + 2;
    }
  }

  // Sort innermost-first (largest endTagStart = innermost).
  // Filter out unclosed {% for %} blocks (endTagStart === -1) to prevent
  // malformed slices from dropping template content silently.
  return loops
    .filter((l) => l.endTagStart !== -1)
    .sort((a, b) => b.endTagStart - a.endTagStart);
}

// ── Template rendering ───────────────────────────────────────────────────────

/**
 * Recursively render a template body with a given scope.
 *
 * This function processes `{% if %}` recursively, and relies on the
 * depth-aware findForBlocks() to handle nesting correctly.
 */
function renderBody(
  src: string,
  scope: Record<string, unknown>,
): string {
  let result = src;

  // ── For loops (innermost-first to avoid pollution) ──────────────────────
  const loops = findForBlocks(result);
  for (const loop of loops) {
    const iterable = resolveDot(loop.iterable, scope);
    if (!Array.isArray(iterable)) {
      // Replace the entire block with empty string.
      result =
        result.slice(0, loop.start) +
        result.slice(loop.end);
      continue;
    }

    const bodySrc = result.slice(loop.bodyStart, loop.endTagStart);
    const renderedParts = iterable.map((item) =>
      renderBody(bodySrc, { ...scope, [loop.name]: item }),
    );
    const rendered = renderedParts.join("");

    result =
      result.slice(0, loop.start) +
      rendered +
      result.slice(loop.end);
  }

  // ── If conditionals (recursive to handle nesting) ────────────────────────
  const ifRe = /{%\s*if\s+(.+?)\s*%}([\s\S]*?){%\s*endif\s*%}/;
  let ifMatch: RegExpExecArray | null;
  // Use a loop since we replace in-place and need to re-scan.
  while ((ifMatch = ifRe.exec(result)) !== null) {
    const [, expr, body] = ifMatch;
    if (evalCondition(expr, scope)) {
      result =
        result.slice(0, ifMatch.index) +
        renderBody(body, scope) +
        result.slice(ifMatch.index + ifMatch[0].length);
    } else {
      result =
        result.slice(0, ifMatch.index) +
        result.slice(ifMatch.index + ifMatch[0].length);
    }
    // Reset lastIndex so the regex rescans from the beginning.
    ifRe.lastIndex = 0;
  }

  // ── Variable interpolation ───────────────────────────────────────────────
  const varRe = /{{\s*([\w.]+?)\s*}}/g;
  result = result.replace(varRe, (_m, path: string) => {
    const val = resolveDot(path, scope);
    if (val === undefined || val === null) return "";
    return String(val);
  });

  return result;
}

/**
 * Render a template string with the given context object.
 *
 * @param template  Jinja2-like template string.
 * @param context   Plain object providing variable values.
 * @returns Rendered string with all tags replaced.
 */
export function renderTemplate(template: string, context: RenderContext): string {
  return renderBody(template, context as Record<string, unknown>);
}
