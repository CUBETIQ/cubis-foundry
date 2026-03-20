---
name: django-drf
description: "Use when building Django 5.1+ REST APIs with Django REST Framework 3.15+, covering serializers, viewsets, permissions, filtering, pagination, and async support."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Django model, view, or DRF serializer to work on"
---

# Django DRF

## Purpose

Use when building Django 5.1+ REST APIs with Django REST Framework 3.15+, covering serializers, viewsets, permissions, filtering, pagination, and async support.

## When to Use

- Building or extending Django REST Framework APIs with ModelSerializers and ViewSets.
- Designing custom permission classes, throttling rules, and authentication backends.
- Implementing filtering, search, ordering, and cursor-based pagination.
- Reviewing DRF code for serializer validation gaps, N+1 queries, and permission bypass risks.

## Instructions

1. **Confirm the Django and DRF version baseline first** because Django 5.1 async views, DRF 3.15 serializer improvements, and deprecated features differ significantly from older releases.
2. **Define models with explicit field types, validators, and `Meta` options before writing serializers** because serializers derive field behavior from models and missing constraints surface as silent data corruption.
3. **Use ModelSerializer for standard CRUD and plain Serializer only for non-model or cross-model payloads** because ModelSerializer auto-generates fields, validators, and `create`/`update` methods that are tedious and error-prone to replicate.
4. **Nest related data with nested serializers or `SerializerMethodField` and control depth explicitly** because `depth = N` auto-nesting exposes unpredictable schema shapes and triggers uncontrolled joins.
5. **Register endpoints through a DefaultRouter with ModelViewSet or targeted ViewSet mixins** because routers generate consistent URL patterns and reduce the surface area for routing typos and method mismatches.
6. **Override `get_queryset()` in ViewSets to scope data by the authenticated user or tenant** because the default `queryset` class attribute returns all rows and is the most common authorization bypass in DRF projects.
7. **Write custom permission classes for any rule beyond `IsAuthenticated`** because inline `if` checks in view methods are untestable, easy to forget on new actions, and invisible to DRF's schema introspection.
8. **Apply `select_related` and `prefetch_related` in `get_queryset()` for every endpoint returning related objects** because DRF serializers trigger lazy loads per row and N+1 queries are the leading performance problem in DRF APIs.
9. **Use `django-filter` `FilterSet` classes for query-parameter filtering instead of manual `request.query_params` parsing** because FilterSet integrates with DRF schema generation, validates filter values, and prevents injection of arbitrary lookups.
10. **Choose pagination style at the project level and override per-viewset only when necessary** because inconsistent pagination across endpoints confuses API consumers and complicates frontend integration.
11. **Wrap multi-step writes in `transaction.atomic()` and use `serializer.save()` inside the block** because partial writes without transactions leave the database in states that no serializer validation can prevent.
12. **Write `APITestCase` tests with `APIClient` and factory-generated data for every endpoint** because DRF content negotiation, authentication, and permission classes introduce integration-layer bugs that model-level tests do not catch.
13. **Use `@action` decorator for custom ViewSet endpoints instead of standalone `APIView` classes** because `@action` inherits the ViewSet's permission, throttle, and queryset configuration automatically.
14. **Implement throttling on write endpoints and authentication endpoints** because unthrottled endpoints are trivially abused for credential stuffing and data scraping.
15. **Use async views and async-compatible ORM queries where available in Django 5.1+** because async views eliminate thread-pool exhaustion under high concurrency for I/O-bound endpoints.
16. **Run `manage.py check --deploy` and `manage.py showmigrations` as verification checkpoints** because these commands surface missing migrations, insecure settings, and deployment configuration gaps before code review.

## Output Format

Provide implementation guidance, code examples, management commands, and settings snippets as appropriate to the task. Include migration operations when schema changes are involved.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/serializers-viewsets.md` | You need serializer design, nested serializer patterns, ViewSet mixins, or router configuration guidance. |
| `references/permissions.md` | You need custom permission classes, object-level permissions, or authentication backend configuration. |
| `references/filtering-pagination.md` | You need django-filter setup, search/ordering backends, cursor pagination, or query-parameter validation. |
| `references/testing.md` | You need APITestCase patterns, APIClient usage, factory_boy integration, or test database strategies. |
| `references/async-support.md` | You need Django 5.1 async views, async ORM queries, ASGI configuration, or async middleware patterns. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me build a DRF viewset with nested serializers for a blog post with comments"
- "Review my custom DRF permission class for object-level authorization"

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
