# Example: Building a Developer Documentation Site

## Scenario

A platform team is building a comprehensive developer portal for their internal API platform. The platform serves 15 microservices consumed by 8 product teams. The portal needs to include getting-started guides, API references auto-generated from OpenAPI specs, architecture overviews, SDK documentation, and a searchable knowledge base. The team wants the documentation to live alongside code and deploy automatically.

## Prompt

"We need a comprehensive developer documentation site for our internal API platform. It should include getting-started guides, auto-generated API references from OpenAPI specs, architecture overview pages, and a searchable knowledge base. We want it in Git, auto-deployed, and easy for any engineer to contribute to. Design the structure and tooling."

## Expected Output

### Site Architecture

```
docs-portal/
  docusaurus.config.js          # Site configuration
  sidebars.js                   # Navigation structure
  docs/
    getting-started/
      index.md                  # Overview and prerequisites
      quickstart.md             # 5-minute first API call
      authentication.md         # How to obtain and use tokens
      environments.md           # Dev, staging, production URLs
    api-reference/
      user-service.md           # Auto-generated from OpenAPI
      order-service.md
      inventory-service.md
      _category_.json           # Sidebar configuration
    guides/
      pagination.md             # Cross-API pagination patterns
      error-handling.md         # Standard error format and retry logic
      webhooks.md               # Setting up and verifying webhooks
      rate-limiting.md          # Understanding and handling rate limits
    architecture/
      overview.md               # System context diagram
      service-map.md            # Container diagram with all services
      data-flow.md              # Key data flows across services
    sdks/
      javascript.md             # JS/TS SDK installation and usage
      python.md                 # Python SDK installation and usage
    changelog/
      index.md                  # Latest changes across all services
  static/
    openapi/
      user-service.yaml         # OpenAPI spec files
      order-service.yaml
    diagrams/                   # Rendered architecture diagrams
  scripts/
    generate-api-docs.sh        # OpenAPI -> Markdown conversion
    check-links.sh              # Dead link detection
```

### Getting Started Guide Structure

```markdown
# Getting Started

## Prerequisites

- API key (request from the Platform team via #platform-support Slack channel)
- HTTP client (curl, Postman, or your application's HTTP library)

## Step 1: Get Your API Key

1. Go to https://portal.internal.example.com/api-keys
2. Click "Create API Key"
3. Select the scopes your application needs
4. Copy the key — it will not be shown again

## Step 2: Make Your First API Call

```bash
curl -X GET https://api.staging.example.com/v1/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected response:**
```json
{ "status": "healthy", "version": "2.4.1" }
```

## Step 3: Explore the API Reference

Browse the [API Reference](/docs/api-reference) to find endpoints for your use case.
Each endpoint includes request/response examples you can copy and modify.

## Next Steps

- [Authentication deep dive](/docs/getting-started/authentication)
- [Error handling patterns](/docs/guides/error-handling)
- [SDK quickstart (JavaScript)](/docs/sdks/javascript)
```

### OpenAPI Auto-Generation Pipeline

```yaml
# .github/workflows/docs-deploy.yml
name: Deploy Documentation
on:
  push:
    branches: [main]
    paths: ['docs-portal/**', 'services/*/openapi.yaml']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Collect OpenAPI specs from services
        run: |
          for spec in services/*/openapi.yaml; do
            service=$(basename $(dirname "$spec"))
            cp "$spec" docs-portal/static/openapi/"$service".yaml
          done

      - name: Generate API reference pages
        run: bash docs-portal/scripts/generate-api-docs.sh

      - name: Install dependencies
        run: cd docs-portal && npm ci

      - name: Build site
        run: cd docs-portal && npm run build

      - name: Check links
        run: bash docs-portal/scripts/check-links.sh

      - name: Deploy to internal CDN
        run: |
          aws s3 sync docs-portal/build/ s3://docs-portal-bucket/ --delete
          aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

### OpenAPI to Markdown Conversion Script

```bash
#!/bin/bash
# scripts/generate-api-docs.sh

for spec in static/openapi/*.yaml; do
  service=$(basename "$spec" .yaml)
  echo "Generating docs for $service..."

  npx @redocly/cli build-docs "$spec" \
    --output "docs/api-reference/$service.html" \
    --title "$service API Reference"

  # Also generate a markdown summary for Docusaurus sidebar
  npx openapi-to-md "$spec" > "docs/api-reference/$service.md"
done
```

### Docusaurus Configuration

```javascript
// docusaurus.config.js
module.exports = {
  title: 'Platform Developer Portal',
  url: 'https://docs.internal.example.com',
  baseUrl: '/',
  themeConfig: {
    navbar: {
      title: 'Developer Portal',
      items: [
        { type: 'doc', docId: 'getting-started/index', label: 'Getting Started' },
        { type: 'doc', docId: 'api-reference/user-service', label: 'API Reference' },
        { type: 'doc', docId: 'guides/pagination', label: 'Guides' },
        { type: 'doc', docId: 'architecture/overview', label: 'Architecture' },
      ],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'platform-docs',
    },
  },
  markdown: { mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],
  plugins: [
    ['docusaurus-plugin-openapi-docs', {
      id: 'openapi',
      docsPluginId: 'classic',
      config: {
        userService: { specPath: 'static/openapi/user-service.yaml', outputDir: 'docs/api-reference/user-service' },
        orderService: { specPath: 'static/openapi/order-service.yaml', outputDir: 'docs/api-reference/order-service' },
      },
    }],
  ],
};
```

### Contribution Guide for Engineers

```markdown
# Contributing to Documentation

## Quick edits

1. Click "Edit this page" at the bottom of any docs page.
2. Make your change in the GitHub editor.
3. Submit a pull request. The docs team will review within 1 business day.

## Adding a new guide

1. Create a new `.md` file in `docs-portal/docs/guides/`.
2. Add frontmatter with title, description, and author.
3. Add the page to `sidebars.js` in the appropriate section.
4. Submit a pull request.

## Updating an API reference

API references are auto-generated from OpenAPI specs. To update:

1. Edit the OpenAPI spec in `services/<service-name>/openapi.yaml`.
2. The CI pipeline regenerates the docs page on merge to main.
3. Do not edit generated Markdown files directly — they will be overwritten.
```

## Key Decisions

- **Docusaurus** — React-based static site generator with built-in search, versioning, and Mermaid support. Widely adopted for developer documentation.
- **OpenAPI as source of truth** — API docs are generated from specs, not written manually. Specs live alongside service code so they stay synchronized.
- **Getting-started guide as entry point** — new consumers follow a progressive path: get key, make first call, explore reference. Reduces time-to-first-API-call.
- **Cross-cutting guides separated from API reference** — pagination, error handling, and webhooks apply to all services. Documenting them once avoids duplication.
- **Algolia search** — enables full-text search across all documentation. Critical when the portal grows beyond 50 pages.
- **Contribution guide** — lowers the barrier for any engineer to contribute, preventing documentation from becoming a single team's bottleneck.
