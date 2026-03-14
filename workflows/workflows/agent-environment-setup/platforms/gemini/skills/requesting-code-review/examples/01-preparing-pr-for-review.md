# Example: Preparing a Feature PR for Review

## Scenario

A developer has completed a new search feature for an e-commerce application. The change touches the API layer, database queries, and frontend components. The developer needs to prepare a review request that gives reviewers full context and directs their attention effectively.

## User Prompt

> I just finished building product search for our e-commerce app. Here is what I changed:
>
> - Added a `/api/products/search` endpoint that accepts query, category, price range, and sort parameters
> - Created a PostgreSQL full-text search index on product name and description
> - Added a search bar component in the header with autocomplete
> - Added debounced API calls from the frontend (300ms)
> - Changed the product list page to support search results view
>
> Total: ~350 lines across 8 files. The autocomplete uses a new dependency (`downshift`). I am not sure if the full-text search index approach is the right long-term solution versus Elasticsearch, but it works for our current catalog size (5,000 products).
>
> Help me prepare this for code review.

## Expected Response

### PR Title

Add product search with full-text search and autocomplete

### PR Description

#### What

Adds product search functionality with server-side full-text search and client-side autocomplete. Users can search by product name and description, filter by category and price range, and sort results by relevance, price, or date.

#### Why

Product search is the #1 requested feature from user feedback (Issue #89). Currently users must browse categories manually, which does not scale as the catalog grows.

#### How

- **Backend**: New `/api/products/search` endpoint using PostgreSQL `tsvector` full-text search with GIN index on `products.name` and `products.description`. Supports filtering by category and price range, with relevance-ranked results.
- **Frontend**: Search bar component in the header using `downshift` for accessible autocomplete. API calls are debounced at 300ms to avoid excessive requests during typing.
- **Database**: Migration adds a `search_vector` column and GIN index. Migration is backward-compatible (additive only).

#### Testing

- Unit tests for search query builder (edge cases: empty query, special characters, SQL injection attempts)
- Integration test for the search endpoint with seeded test data
- Manual testing of autocomplete UX in Chrome and Firefox
- **Not tested**: Safari autocomplete behavior, search performance at scale beyond 5,000 products

#### Known Limitations

- Full-text search is PostgreSQL-specific. If we migrate databases, this will need rework.
- The `tsvector` approach works for our current catalog size (~5,000 products) but may need to be replaced with Elasticsearch or Typesense as the catalog grows past 50,000.
- Autocomplete does not yet support search history or popular searches.

#### Risk Areas

1. **Database migration** (medium risk) — adds a GIN index that may lock the products table during creation on large datasets. Current production table is small, so this should be fast.
2. **New dependency: downshift** (low risk) — well-maintained React library for accessible autocomplete. 2MB gzipped, tree-shakeable.

### Review Guidance

- **Primary focus**: Please review the search query builder for correctness and SQL injection safety. I am using parameterized queries but want a second set of eyes.
- **Secondary focus**: Is the `downshift` dependency justified, or should we build a simpler autocomplete without a library?
- **Architecture question**: I chose PostgreSQL full-text search over Elasticsearch for simplicity. Does this trade-off make sense given our current scale?
- **Depth**: Standard review. No auth or payment changes.

### Reviewer Recommendation

- **Primary**: Someone with PostgreSQL and backend API experience
- **Secondary**: Someone with React component and accessibility experience
- **Urgency**: Normal — no deadline pressure, but this unblocks the catalog team

## Why This Response Works

- The PR description follows a clear What/Why/How structure that gives reviewers full context before they read code.
- Known limitations and the Elasticsearch trade-off are stated upfront, preventing reviewers from raising issues the author already considered.
- The testing section explicitly states what was not tested, directing reviewer attention.
- Risk areas are ranked and explained, so reviewers calibrate depth accordingly.
- Review guidance specifies exactly what feedback the author needs, avoiding wasted effort on areas that are already settled.
- The reviewer recommendation matches expertise to the areas that need review.
