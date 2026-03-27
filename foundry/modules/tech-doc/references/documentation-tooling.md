# Documentation Tooling

Load this when choosing documentation platforms, setting up CI/CD validation, configuring linting, or integrating link checking into build pipelines.

## Documentation platforms

| Platform | Type | Best for | Pricing |
|---|---|---|---|
| Docusaurus | Static site generator | Developer portals, versioned docs | Free (open source) |
| GitBook | Hosted/self-hosted | Team knowledge bases | Free for OSS, paid for teams |
| Mintlify | Hosted | API-first documentation | Free tier, paid for custom domains |
| Nextra | Static (Next.js) | Documentation alongside Next.js apps | Free (open source) |
| Starlight | Static (Astro) | Content-heavy docs with fast builds | Free (open source) |
| Confluence | Hosted wiki | Enterprise knowledge management | Paid (Atlassian) |
| Notion | Hosted workspace | Internal team documentation | Free tier, paid for teams |

### Selection criteria

1. **Co-location with code**: Can docs live in the same repo as source code? (Docusaurus, Nextra, Starlight: yes. Confluence, Notion: no.)
2. **Git-based workflow**: Can engineers submit docs via pull requests? (Static generators: yes. Hosted platforms: varies.)
3. **Search**: Built-in full-text search or Algolia integration. (Docusaurus, GitBook, Mintlify: yes.)
4. **API doc generation**: Can it consume OpenAPI specs? (Docusaurus with plugin, Mintlify, Redoc: yes.)
5. **Versioning**: Can it serve docs for multiple product versions? (Docusaurus: built-in. Nextra, Starlight: manual.)

## Markdown linting

### markdownlint

```bash
npm install -g markdownlint-cli2
markdownlint-cli2 "docs/**/*.md"
```

```json
// .markdownlint.json
{
  "default": true,
  "MD013": { "line_length": 120 },
  "MD033": false,
  "MD041": false
}
```

Key rules:

| Rule | Description | Why it matters |
|---|---|---|
| MD009 | No trailing spaces | Causes unintended line breaks in some renderers |
| MD013 | Line length | Improves readability in code review diffs |
| MD024 | No duplicate headings | Breaks anchor links and navigation |
| MD032 | Lists surrounded by blank lines | Prevents rendering glitches |
| MD040 | Fenced code blocks need language | Enables syntax highlighting |

### Vale prose linter

```bash
brew install vale
vale docs/
```

```yaml
# .vale.ini
StylesPath = .vale/styles
MinAlertLevel = warning

[docs/*.md]
BasedOnStyles = Vale, write-good

# Custom rules
[docs/*.md]
Vale.Spelling = NO
write-good.Weasel = YES
write-good.Passive = YES
write-good.TooWordy = YES
```

- Vale catches weasel words, passive voice, and wordy phrases.
- Create custom rules for company-specific terminology.
- Integrate into CI to enforce writing quality standards on pull requests.

## Link checking

### lychee (fast, Rust-based)

```bash
# Install
brew install lychee

# Check all markdown files
lychee --verbose docs/**/*.md

# CI configuration
lychee --no-progress --format json docs/**/*.md > link-report.json
```

### GitHub Action for link checking

```yaml
name: Link Check
on:
  pull_request:
    paths: ['docs/**']
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday check

jobs:
  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check links
        uses: lycheeverse/lychee-action@v2
        with:
          args: --verbose --no-progress docs/**/*.md
          fail: true
```

## API documentation tools

### Redoc (static rendering)

```bash
npx @redocly/cli build-docs openapi.yaml --output docs/api/index.html
```

- Generates a single HTML page from an OpenAPI spec.
- No server required — serve as a static file.
- Supports nested schemas, code samples, and authentication docs.

### Spectral (OpenAPI linting)

```bash
npx @stoplight/spectral-cli lint openapi.yaml
```

```yaml
# .spectral.yaml
extends: ["spectral:oas"]
rules:
  operation-operationId: error
  operation-description: warn
  info-contact: warn
  oas3-api-servers: error
```

- Enforces OpenAPI best practices: operation IDs, descriptions, server URLs.
- Catches missing examples, undocumented responses, and schema issues.
- Run in CI to block merges of incomplete API specs.

## Search integration

### Algolia DocSearch

```javascript
// docusaurus.config.js
themeConfig: {
  algolia: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_ONLY_API_KEY',
    indexName: 'your-docs',
    contextualSearch: true,
  },
},
```

- Algolia DocSearch is free for open-source documentation.
- For internal docs, use Algolia's paid plan or self-hosted Meilisearch.
- Index is automatically updated when documentation deploys.

### Pagefind (zero-dependency search)

```bash
# Build search index from static site output
npx pagefind --site build/
```

- No external service required — search index is generated at build time.
- Works with any static site generator.
- Search runs entirely in the browser with a ~100KB WASM bundle.

## CI/CD pipeline template

```yaml
name: Documentation Pipeline
on:
  pull_request:
    paths: ['docs/**', 'openapi/**']
  push:
    branches: [main]
    paths: ['docs/**', 'openapi/**']

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx markdownlint-cli2 "docs/**/*.md"
      - run: npx @stoplight/spectral-cli lint openapi/*.yaml

  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: lycheeverse/lychee-action@v2
        with:
          args: docs/**/*.md
          fail: true

  build:
    runs-on: ubuntu-latest
    needs: [lint, link-check]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: docs-site
          path: build/

  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: docs-site
          path: build/
      - run: aws s3 sync build/ s3://docs-bucket/ --delete
```

## Versioned documentation

```javascript
// docusaurus.config.js
module.exports = {
  docs: {
    lastVersion: 'current',
    versions: {
      current: { label: 'v3.x', path: '' },
      '2.0': { label: 'v2.x', path: 'v2', banner: 'unmaintained' },
    },
  },
};
```

```bash
# Snapshot the current docs as a new version
npx docusaurus docs:version 3.0
```

- Version documentation when API breaking changes ship.
- Use banners to warn users on outdated version pages.
- Keep only the last 2-3 versions to avoid maintenance burden.
