## SKILL COVERAGE GAPS

Task: Ask specialist(s) for design and risk assessment  
Matched skill: `api-designer` ✓  
Installed?: confirmed  
Fix: keep `api-designer` primary and make `api-patterns` supporting only when implementation detail is needed.

Task: Validate contracts, data model, and failure handling  
Matched skill: `api-designer` ✓  
Installed?: confirmed  
Fix: pair with `database-skills` only when schema/query work is in scope.

Task: Implement backend changes with observability  
Matched skill: `nodejs-best-practices` ✓  
Installed?: confirmed  
Fix: keep `nodejs-best-practices` primary for implementation, not for API contract design.

Task: Update OpenAPI spec, Swagger UI route, and Stoplight route/component  
Matched skill: `api-designer` ✓  
Installed?: confirmed  
Fix: keep documentation contract explicit in workflow output.

Task: Run targeted tests and summarize rollout notes  
Matched skill: `nodejs-best-practices` ✓  
Installed?: confirmed  
Fix: verification remains workflow-driven; no new skill required.

Task: Auth, JWT, OAuth, RBAC, secrets  
Matched skill: `secure-code-guardian` ✓  
Installed?: confirmed  
Fix: invoke only when the request includes auth or sensitive-data signals.

Task: Postman collection or environment work  
Matched skill: `postman` ✓  
Installed?: confirmed  
Fix: map directly in routing table instead of relying on broad backend skill selection.
