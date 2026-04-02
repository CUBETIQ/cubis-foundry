# Example: Writing an Architecture Decision Record

## Scenario

A team building a multi-tenant SaaS platform needs to decide on the data isolation strategy for tenants. The options are shared database with row-level security, schema-per-tenant, or database-per-tenant. The team has 6 engineers, expects 50-200 tenants in the first year, and needs to balance cost, operational complexity, and data isolation guarantees.

## Prompt

"Write an Architecture Decision Record for our multi-tenant data isolation strategy. We're choosing between shared database with row-level security, schema-per-tenant, and database-per-tenant. We have a small team, expect moderate tenant count, and our enterprise customers require strong data isolation. Use the standard ADR format."

## Expected Output

### ADR-0007: Multi-Tenant Data Isolation Strategy

## Status

Accepted (2025-03-10)

## Context

We are building a multi-tenant SaaS analytics platform on PostgreSQL. The data isolation strategy affects security guarantees, operational complexity, cost, and query performance. Key constraints:

- **Team size**: 6 engineers managing infrastructure and application code. Operational overhead must remain manageable.
- **Tenant count**: 50-200 tenants expected in year one, scaling to 500+ in year two.
- **Enterprise requirements**: Several target customers require contractual guarantees that their data cannot be accessed by other tenants, even in the event of application bugs.
- **Compliance**: SOC 2 Type II certification is planned for Q3. Auditors will evaluate data isolation controls.
- **Cost sensitivity**: The platform runs on AWS. Database costs scale with instance count and storage.

## Decision

We will use a **shared database with schema-per-tenant** isolation. Each tenant gets a dedicated PostgreSQL schema within a single database instance. The application sets the search path to the tenant's schema on each request.

## Alternatives Considered

### Option A: Shared database, shared schema with row-level security (RLS)

- **Pros**: Simplest schema management. Single set of migrations. Lowest infrastructure cost.
- **Cons**: Data isolation depends entirely on RLS policies being correct. A single missed policy exposes all tenant data. Enterprise customers may not accept RLS as sufficient isolation for compliance purposes. Debugging data leaks requires auditing every query path.
- **Rejected because**: The risk of a policy gap is too high for our team size and the contractual isolation requirements from enterprise customers.

### Option B: Schema-per-tenant (selected)

- **Pros**: Strong logical isolation. Each tenant's tables are in a separate schema. Standard PostgreSQL search_path switching. Single database instance to manage. Migrations can be applied per-schema with scripting. Connection pooling works normally.
- **Cons**: Schema count grows linearly with tenants. Migrations must be applied to every schema. Backup and restore is per-database, not per-tenant.
- **Selected because**: It balances isolation strength with operational simplicity. Schema-level isolation satisfies enterprise audit requirements without the infrastructure cost of separate databases.

### Option C: Database-per-tenant

- **Pros**: Strongest isolation. Each tenant is a fully independent database. Backup, restore, and deletion are trivial per tenant.
- **Cons**: Connection pooling requires one pool per database. Migration management scales linearly with tenant count and requires orchestration tooling. Infrastructure cost is highest. Monitoring 200+ database instances with a 6-person team is operationally risky.
- **Rejected because**: The operational overhead exceeds our team capacity at the expected tenant scale.

## Consequences

### Positive

- Enterprise customers can be told their data resides in a dedicated schema, which satisfies audit requirements.
- A single database instance keeps infrastructure costs and monitoring manageable.
- PostgreSQL `search_path` is a well-understood mechanism with minimal performance overhead.

### Negative

- **Migration complexity**: Every schema change must be applied to all tenant schemas. We must build migration tooling that iterates over schemas.
- **Cross-tenant queries are harder**: Admin dashboards that aggregate across tenants require explicit schema references or a separate reporting schema.
- **Noisy neighbor risk**: All tenants share the same database resources (CPU, memory, I/O). A heavy query from one tenant can affect others. We will need to implement query timeouts and resource monitoring.

### Risks

- If tenant count exceeds 1,000, the schema-per-tenant model may hit PostgreSQL catalog performance limits. We should revisit this decision if we approach that threshold.

## Related Decisions

- ADR-0003: PostgreSQL as primary database
- ADR-0005: Connection pooling with PgBouncer

## Key Decisions (Example Meta)

- **Standard ADR sections** — Status, Context, Decision, Alternatives Considered, Consequences.
- **Numbered sequentially** — ADR-0007 follows the project's existing numbering convention.
- **Alternatives documented with explicit rejection reasons** — future readers can understand why options were ruled out.
- **Consequences split into positive, negative, and risks** — avoids bias toward only listing benefits.
- **Related decisions linked** — establishes traceability between architectural choices.
