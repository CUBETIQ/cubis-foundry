# Future Tools

This directory is reserved for tools that are planned but not yet implemented.

## Roadmap

- **workflow_list** – List available workflows
- **workflow_run** – Execute a workflow by name
- **config_validate** – Validate cbx workspace configuration
- **skill_install** – Install skills to a workspace
- **skill_diff** – Compare skill versions across roots

## Contributing

When adding a new tool:

1. Create `toolName.ts` in `../` (parent `tools/` directory)
2. Export name, description, schema, and handler
3. Add a `ToolRegistryEntry` in `../registry.ts` (this auto-registers the tool)
4. Add tests in a `toolName.test.ts` file
5. Run `npm run generate:mcp-manifest` to update the build-time manifest
