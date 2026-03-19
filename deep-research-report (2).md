# MultimodalText and Agent-Friendly Repo Standards for Multimodal AI Projects

## MultimodalText as a concrete data structure

In modern “agentic” toolchains, **MultimodalText** usually means *one logical message composed of ordered parts*, where each part is typed (text, image, etc.) and may carry metadata needed for downstream tools (dimensions, identifiers, provenance, safety flags). A widely observed example is the JSON emitted by **ChatGPT user data exports**, where a message can have `content_type: "multimodal_text"` and a `parts` array that may include an `image_asset_pointer` object containing fields such as `asset_pointer`, `size_bytes`, `width`, `height`, and a nested `metadata` object (including image-generation metadata when applicable). citeturn22view0

Your sample payload lines up with that pattern: an image part is represented by a pointer (`asset_pointer='sediment://...'`) plus dimensions and size. While `file-service://...` appears in some exports and examples, `sediment://...` appears in community parsing code and datasets as an alternate scheme for referenced image assets—suggesting parsers should be tolerant to multiple pointer prefixes and treat them as opaque identifiers unless you control the backend that resolves them. citeturn22view0turn4search0turn4search2

Across major LLM APIs, the same underlying idea repeats: **a multimodal “message” is an ordered list of typed content items**.

- **entity["company","OpenAI","ai research company"]**: the Images & Vision guide describes composing a single request with multiple images by adding multiple images to a `content` array, and notes images can be provided by URL, Base64 data URL, or a file ID (and that images count toward tokens/billing). citeturn8search8  
- **entity["company","Anthropic","ai safety company"]**: the Messages docs describe sending text-and-image content together; images can be provided via `base64`, `url`, or `file` source types, where `file` references an upload via the Files API. citeturn8search1turn8search13  
- **entity["company","Google","technology company"]**: the Gemini API docs describe multimodal prompts as a `parts` array containing multiple `Part` objects (e.g., one text part and one image part), and explain that multiple images can be included in a single prompt. citeturn8search10turn8search2  

**Design implication:** if you want MultimodalText to survive tool changes (agent framework swaps, vendor switches), model it as a vendor-neutral envelope:

- `parts[]` is **ordered** (because “text before image” vs “image before text” can change meaning). This is consistent with the “content/parts array” approach in multiple ecosystems. citeturn8search8turn8search10turn8search1  
- image references should be treated as either **(a)** resolvable URLs, **(b)** embedded Base64 blobs, or **(c)** file IDs/pointers stored elsewhere (Files API / internal asset stores). That matches the core “URL/Base64/file reference” triad described in OpenAI and Anthropic docs, and the “inline data vs file references” options in Gemini. citeturn8search8turn8search1turn8search2  

## Instruction files and the move toward AGENTS.md unification

The strongest trend in “coding agents in-repos” is **file-based, version-controlled guidance** that the agent reads automatically—effectively a “developer handbook for machines.” The key friction (which your first image illustrates) is **fragmentation**: separate rule files per tool (`CLAUDE.md`, `GEMINI.md`, `.clinerules/`, `.cursor/rules`, etc.), plus per-package variants. That fragmentation is a known motivation for adopting a single cross-tool instruction surface.

**AGENTS.md** emerged specifically to reduce that fragmentation: it’s positioned as “a README for agents,” separate from `README.md` (human quickstart) and intended to hold the pragmatic details that help an agent operate (setup commands, tests, conventions). citeturn10view0turn0search6

The AGENTS.md site also explicitly endorses **nested AGENTS.md files in monorepos** where “the nearest one wins,” and even suggests symlink-based migration from legacy filenames (e.g., rename `AGENT.md` → `AGENTS.md`, then symlink back for compatibility). citeturn10view0

Tool support has converged quickly:

- **entity["organization","Codex","openai coding agent"]** (OpenAI): Codex reads AGENTS.md “before doing any work,” builds an instruction chain from global scope → project root → current directory, and supports `AGENTS.override.md` (one-file-per-directory, closest overrides earliest). It also enforces a size cap (32 KiB by default) and recommends splitting guidance into nested files when needed. citeturn9view0  
- **entity["organization","GitHub Copilot","ai coding assistant"]**: GitHub Docs define repo-wide instructions via `.github/copilot-instructions.md`, path-scoped `NAME.instructions.md` files in `.github/instructions/` with `applyTo` frontmatter, and separately document `AGENTS.md` as “agent instructions,” again with nearest-in-tree precedence. citeturn16view0  
- **entity["organization","Visual Studio Code","code editor by microsoft"]**: VS Code documentation recommends starting with `.github/copilot-instructions.md` for broad standards, adding `.instructions.md` for selective rules, and using `AGENTS.md` when you want a single set of instructions recognized across multiple agents (with optional nested AGENTS.md support). It also supports `CLAUDE.md` for compatibility. citeturn17view0  
- **entity["organization","Claude Code","agentic coding tool"]**: Claude Code reads `CLAUDE.md` at the start of every session to apply coding standards, architecture decisions, constraints, and checklists. citeturn12view0  
- **entity["organization","Gemini CLI","terminal ai agent"]**: Gemini CLI uses a hierarchical context-file system around `GEMINI.md` (global + workspace + just-in-time discovery), supports modular imports (`@file.md`), and can be configured to treat `AGENTS.md` as a context filename via settings (`context.fileName`). citeturn11view0  
- **entity["organization","Cline","open source coding agent"]**: Cline supports `.clinerules/` and can also detect other rule types (including `AGENTS.md` as a “standard format” for cross-tool compatibility). It supports conditional rule activation via YAML frontmatter (`paths:` globs). citeturn15view0  
- **entity["organization","Roo Code","coding agent for vs code"]**: Roo Code documents workspace and global rules directories under `.roo/rules/` and `~/.roo/rules/`, plus mode-specific rule directories, with explicit load order and precedence (global first, then project). It also mentions legacy fallback compatibility with `.roorules` and `.clinerules` in certain cases. citeturn19view0  

image_group{"layout":"carousel","aspect_ratio":"1:1","query":["AGENTS.md logo","Claude Code logo","Gemini CLI logo","GitHub Copilot logo"],"num_per_query":1}

**Practical unification strategy (aligned with your first image):**

- Make **`AGENTS.md` the canonical** repo guidance (human-readable Markdown, cross-tool). citeturn10view0turn9view0turn17view0  
- For tools that still require a proprietary filename, prefer **symlinks or thin wrappers** (e.g., `CLAUDE.md` → `AGENTS.md`, `GEMINI.md` → `AGENTS.md`), and/or configure the tool to read `AGENTS.md` directly where supported (e.g., Gemini CLI `context.fileName`). citeturn10view0turn11view0turn12view0  
- Use **nested instruction files** for monorepos or multi-service repos rather than letting a single root file grow past tool-specific size limits. citeturn9view0turn10view0turn17view0  

## Skills as reusable “micro-playbooks” for agents

Beyond always-on “repo rules,” multiple ecosystems now ship **skills**: portable bundles that teach an agent a repeatable workflow and (sometimes) include scripts or reference material.

In **Anthropic’s Skills** framing, a skill is explicitly “packaged as a simple folder,” with a required `SKILL.md` that includes YAML frontmatter, plus optional `scripts/`, `references/`, and `assets/`. Anthropic recommends “progressive disclosure”: frontmatter is always loaded, the body loads when relevant, and linked files are explored only as needed—optimizing context/token use. citeturn2view0

In **Gemini CLI**, a skill is also a directory containing `SKILL.md`; the docs show a canonical path `.gemini/skills/<skill-name>/SKILL.md`, with required YAML frontmatter (`name`, `description`) and an example of bundling executable scripts under `scripts/`. Gemini CLI auto-discovers skills in `.gemini/skills` and explicitly notes `.agents/skills` as a generic alternative. citeturn21view0

In **Roo Code**, skills follow the Agent Skills format and emphasize **cross-agent locations**: Roo-specific skill directories (`.roo/skills/`, `~/.roo/skills/`) and cross-agent directories (`.agents/skills/`, `~/.agents/skills/`). Roo also supports mode-targeting via directories like `skills-code/`, `skills-architect/`, etc. citeturn19view1

**Cross-ecosystem convergence that matters for your folder design:**

- `SKILL.md` + YAML frontmatter is a repeated pattern (Anthropic + Gemini CLI + Roo Code’s Agent Skills alignment). citeturn2view0turn21view0turn19view1  
- A shared “cross-agent” directory (`.agents/skills/`) is becoming a portability layer (Gemini CLI explicitly; Roo Code explicitly). citeturn21view0turn19view1  
- Skills are most effective when they bundle *just enough code to execute the workflow* (scripts) plus *just enough guidance to choose when to invoke it* (descriptions geared toward user phrasing). citeturn21view0turn2view0turn19view1  

## Folder structure best practices for an agentic multimodal codebase

Your second image (“Generative AI Project Structure”) matches a concrete open-source template that has been widely shared and forked—showing a practical separation between configuration, LLM clients, prompt/policy utilities, data caches, examples, and notebooks. citeturn23view0

That template’s core move is to treat a GenAI project as a **system** made of composable modules:

- `config/` for model + prompt templates + logging settings (keeps behavior out of code). citeturn23view0  
- `src/llm/` for provider clients (example: dedicated clients for different providers), plus shared token/rate-limit utilities. citeturn23view0  
- `src/prompt_engineering/` for templates / few-shot / chaining logic. citeturn23view0  
- `data/` with subfolders for cache, outputs, embeddings—acknowledging that agent systems generate intermediate artifacts that should be organized and often excluded from version control. citeturn23view0  

To make this robust for multimodal + agent workflows, add two additional best-practice layers:

**Use a packaging-friendly `src/` layout (Python)**  
If your project is Python, the Python Packaging User Guide’s `src/` layout is recommended because it reduces accidental imports from the working directory and encourages tests to validate “installed” behavior rather than “local path” behavior. citeturn7search0turn7search21  
Pytest’s own good-practices documentation similarly illustrates separating `src/` and `tests/` as a clean layout for larger projects. citeturn7search10

**Keep configuration and secrets out of code**  
If your agent needs API keys, endpoints, feature flags, or deployment-specific toggles, Twelve-Factor’s “Config” principle argues for strict separation: config varies by deploy, code does not. citeturn7search1

**A recommended repo tree for “MultimodalText + Agents + Skills”**

```text
repo/
  README.md                     # For humans
  AGENTS.md                     # Canonical agent instructions (cross-tool)

  # Optional compatibility shims (when required by a tool)
  CLAUDE.md                     # Symlink or minimal wrapper → AGENTS.md
  GEMINI.md                     # Symlink OR configure Gemini CLI to read AGENTS.md

  .github/
    copilot-instructions.md     # Optional: Copilot-specific always-on guidance
    instructions/               # Optional: path-scoped *.instructions.md (applyTo globs)

  .agents/
    skills/                     # Cross-agent skills (Gemini CLI + Roo Code compatible)
      multimodal-ingest/
        SKILL.md
        scripts/
          validate_manifest.py
          preprocess_images.py

  # If you adopt tool-specific rule systems, keep them minimal and machine-generated
  .clinerules/                  # Optional: only if you actively use Cline
  .roo/                         # Optional: only if you actively use Roo’s rules/modes

  config/
    model_config.yaml
    prompt_templates.yaml
    logging_config.yaml

  src/
    multimodaltext/
      __init__.py
      types.py                  # MultimodalText schema/types
      io/
        asset_store.py          # Pointer/file resolution (file-id / url / base64)
        chat_export_parser.py   # If you parse ChatGPT exports
      llm/
        providers/
          openai_client.py
          anthropic_client.py
          gemini_client.py
        routing.py              # Model/tool selection, fallback logic
      prompts/
      agents/
        planner.py
        tools.py
      evals/
        golden_sets/

  tests/
  data/
    cache/
    outputs/
    embeddings/
    assets/
      images/
      manifests/
  notebooks/
  examples/
  docs/
    multimodaltext.md           # Human + agent readable spec of your MultimodalText envelope
```

This structure intentionally aligns **skills** into `.agents/skills` because Gemini CLI and Roo Code both recognize that location as a standard portability layer. citeturn21view0turn19view1  
It also leaves room for tool-specific ecosystems but treats them as *optional adapters* rather than the canonical source of truth—consistent with the AGENTS.md “one file across many agents” goal. citeturn10view0turn15view0  

## Workflow and documentation patterns that make agents succeed

The most consistent advice across “rules,” “instructions,” and “skills” ecosystems is: **keep guidance scannable, concrete, and current**—and push detail behind links or progressive disclosure so you don’t waste context.

- Cline’s rules docs emphasize scannability (headers), specificity (examples, explicit conventions), “one concern per file,” and keeping rules current; they also warn that rules consume context tokens and should avoid pasting long style guides. citeturn15view0  
- VS Code’s guidance similarly recommends short, self-contained rules, including the “why,” showing preferred/avoided patterns with code examples, and focusing on non-obvious rules that linters won’t enforce automatically. citeturn17view0  
- Anthropic’s Skills guide formalizes the same outcome via progressive disclosure (frontmatter as lightweight selectors, body as full procedure, linked files as deep reference) and explicitly notes that multiple skills should be composable rather than assuming they’re the only skill. citeturn2view0  

To operationalize that in a multimodal agent repo:

**Make “run commands” first-class**  
AGENTS.md is explicitly framed as the place for setup/test commands and conventions that would clutter a README. citeturn10view0  
Codex’s AGENTS.md guide and Cline’s rules guidance both assume agents will execute relevant checks if you spell them out, so a “Commands” section is high-leverage. citeturn10view0turn9view0turn15view0  

**Use directory-scoped overrides instead of mega-files**  
Codex documents a directory walk where files closer to the working directory override earlier guidance, and where the system stops after a byte limit—meaning smaller, scoped files scale better than one giant global instruction file. citeturn9view0  
This maps cleanly to monorepos (frontend vs backend vs api worker) and mirrors the “nested instructions” story on AGENTS.md and VS Code. citeturn10view0turn17view0  

**Treat multimodal artifacts as governed outputs**  
If your agent writes image-derived outputs (captions, OCR, embeddings, audit logs), your repo should define where those outputs go and how they’re validated. The GenAI project template’s explicit `data/cache`, `data/outputs`, `data/embeddings`, plus utilities like caching and rate limiting, reflects the operational reality that agent systems need cost/latency controls and reproducible intermediate artifacts. citeturn23view0  

## A practical starting point: canonical AGENTS.md plus portable SKILL.md bundles

A minimal but high-signal **AGENTS.md** (root) that works across tools generally includes:

- **How to run the project** (install, dev server, tests, lint)  
- **Where things live** (architecture map: `src/`, `config/`, `data/`, key entrypoints)  
- **Non-obvious constraints** (don’t touch legacy folders; required patterns; security boundaries)  
- **Definition of done** (tests green, formatting, update docs)

This matches the AGENTS.md purpose statement (“build steps, tests, conventions”) and the concrete example sections shown on the AGENTS.md site. citeturn10view0

For **skills**, favor the cross-agent location `.agents/skills/<skill>/SKILL.md` plus bundled scripts, because Gemini CLI explicitly supports `.agents/skills` as a generic alternative and Roo Code lists `.agents/skills` as a cross-agent location. citeturn21view0turn19view1

For **tool compatibility**, pick the thinnest adapter that preserves a single source of truth:

- Claude Code requires `CLAUDE.md` to be read at session start, so a symlink or wrapper that points back to `AGENTS.md` can keep content unified. citeturn12view0turn10view0  
- Gemini CLI can either use `GEMINI.md` defaults or be configured to recognize `AGENTS.md` by adding it to `context.fileName`. citeturn11view0  
- GitHub Copilot and VS Code support AGENTS.md directly, while also offering `.github/copilot-instructions.md` and path-scoped `.instructions.md` files for additional layering (useful when you want different guidance for different folders). citeturn16view0turn17view0  

Finally, if you are parsing or generating “MultimodalText” objects from exports, explicitly document in `docs/multimodaltext.md`:

- the **part types you support** (`text`, `image`, `file`, etc.)  
- accepted image reference forms (URL/Base64/File ID/pointer)  
- any normalization rules (e.g., tolerate `file-service://` and `sediment://` prefixes as opaque asset IDs)

That recommendation follows directly from the fact that multimodal message structures are polymorphic in practice (exports and APIs both rely on typed arrays/parts), and—in the export case—community discussion indicates the format exists but is not designed as a clean public schema, so **your own explicit contract** becomes important for reliability. citeturn22view0turn8search8turn8search10turn8search1