# Workspace Default Policy

Resolve workspace ID in this order:

1. User-provided workspace ID in the request
2. `postman_get_status` default workspace
3. Auto-detected workspace when only one exists
4. Explicit user selection when multiple workspaces exist

## Persist Selected Workspace

```bash
cbx workflows config --scope global --workspace-id <workspace-id>
```

Clear workspace default:

```bash
cbx workflows config --scope global --clear-workspace-id
```
