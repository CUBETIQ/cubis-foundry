# Django DRF Skill Assertions

## Eval 1: ViewSet with Nested Serializers

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Uses ModelSerializer | contains | `ModelSerializer` | ModelSerializer auto-generates fields and validators from the Django model, reducing boilerplate and drift. |
| 2 | Uses select_related | contains | `select_related` | ForeignKey traversals without select_related cause one query per row, degrading response time linearly. |
| 3 | Uses prefetch_related | contains | `prefetch_related` | Reverse and many-to-many relationships require prefetch_related to batch into a single query. |
| 4 | Uses ModelViewSet | contains | `ModelViewSet` | ModelViewSet provides the full CRUD action set with consistent method routing and permission integration. |
| 5 | Registers with router | contains | `router.register` | Router registration generates URL patterns automatically, ensuring consistency and reducing routing errors. |

## Eval 2: Custom Permission Class

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Extends BasePermission | contains | `BasePermission` | All custom DRF permissions must extend BasePermission to integrate with the framework's permission pipeline. |
| 2 | Implements has_object_permission | contains | `has_object_permission` | Object-level authorization requires this method; has_permission alone only checks view-level access. |
| 3 | Overrides get_queryset | contains | `get_queryset` | Queryset scoping is the first line of defense; it prevents unauthorized objects from being visible at all. |
| 4 | Uses APITestCase | contains | `APITestCase` | APITestCase provides DRF-specific assertions and an APIClient that handles content negotiation correctly. |
| 5 | Sets permission_classes | contains | `permission_classes` | The ViewSet must declare permission_classes to wire in the custom permission; DRF does not auto-discover permissions. |
