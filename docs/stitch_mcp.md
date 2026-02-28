````md
# Stitch MCP Guide with Codex

Connect **Google Stitch** to **OpenAI Codex** using **MCP (Model Context Protocol)**, so Codex can pull real Stitch screen artifacts (code/images/metadata) instead of guessing UI.

---

## What this does

- Runs a local MCP server: `stitch-mcp proxy`
- Registers it in Codex via `~/.codex/config.toml` (or `.codex/config.toml`)
- Authenticates using `STITCH_API_KEY` (API-key mode, no OAuth)

---

## Prerequisites

- Node.js (for `npx`)
- Codex (CLI and/or IDE extension)
- A Stitch API key

---

## 1) Set your Stitch API key (recommended)

### macOS / Linux

```bash
export STITCH_API_KEY="YOUR_STITCH_API_KEY"
```
````

### Windows (PowerShell)

```powershell
$env:STITCH_API_KEY="YOUR_STITCH_API_KEY"
```

> Tip: Put it in your shell profile (`~/.zshrc`, `~/.bashrc`, etc.) so it persists.

---

## 2) Configure Codex to use Stitch MCP

Codex MCP config file locations:

- **User-level**: `~/.codex/config.toml`
- **Project-level**: `.codex/config.toml` (use if you only want this for one repo)

Add this to your config:

```toml
[mcp_servers.stitch]
command = "npx"
args = ["-y", "@_davideast/stitch-mcp", "proxy"]

# Prefer forwarding env vars (keeps secrets out of the file)
env_vars = ["STITCH_API_KEY"]
```

✅ This forwards `STITCH_API_KEY` from your terminal environment into the MCP server.

---

## 3) Verify the MCP server is available in Codex

Depending on your Codex version, try one of these:

```bash
codex mcp --help
```

If your build supports listing:

```bash
codex mcp list
```

If you use the Codex UI/TUI, open the MCP panel/command (often `/mcp`) to confirm the `stitch` server is active.

---

## 4) Use Stitch in your Codex prompt

Examples you can paste into Codex:

### A) Implement a Stitch screen in Flutter

- Use the **stitch** MCP tools to list projects/screens.
- Pick the screen named `<SCREEN_NAME>`.
- Fetch screen artifacts (code + image if available).
- Implement it in **Flutter** using my existing project style.
- Keep layout, spacing, and typography consistent with Stitch.

### B) Implement in React (Tailwind)

- Use **stitch** MCP tools to find `<SCREEN_NAME>`.
- Pull the latest screen code + snapshot.
- Generate a **React + Tailwind** component that matches it exactly.
- Keep components clean and reusable.

### C) Update an existing screen

- Use Stitch MCP to re-fetch `<SCREEN_NAME>` artifacts.
- Compare with my local implementation.
- Patch only the differences and keep my existing architecture.

---

## Troubleshooting

### API key not being used

- Make sure `STITCH_API_KEY` is set in the **same terminal session** that launches Codex.
- Ensure your config includes:

  ```toml
  env_vars = ["STITCH_API_KEY"]
  ```

### Node / npx issues

Check:

```bash
node -v
npx -v
```

### Proxy health check (optional)

Run the proxy directly to see errors:

```bash
npx -y @_davideast/stitch-mcp proxy
```

If there’s a built-in doctor command in your installed version, run:

```bash
npx -y @_davideast/stitch-mcp doctor --verbose
```

---

## Security notes

- Do **not** hardcode API keys in files that could be committed.
- Prefer `env_vars = ["STITCH_API_KEY"]` and store keys in your shell env or a secrets manager.

---

## References (docs)

```text
OpenAI Codex MCP docs:
https://developers.openai.com/codex/mcp/

stitch-mcp repository:
https://github.com/davideast/stitch-mcp
```

```

```
