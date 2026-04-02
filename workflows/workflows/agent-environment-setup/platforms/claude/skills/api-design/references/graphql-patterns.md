# GraphQL Patterns

## Schema Design Principles

### Think in Graphs, Not Endpoints

GraphQL represents data as a graph of types connected by relationships. Design the schema to model domain relationships naturally:

```graphql
type User {
  id: ID!
  posts(first: Int, after: String): PostConnection!
  followers(first: Int, after: String): UserConnection!
  following(first: Int, after: String): UserConnection!
}

type Post {
  id: ID!
  author: User!
  comments(first: Int, after: String): CommentConnection!
  reactions: [Reaction!]!
}
```

### Design for Client Use Cases

Structure types around how clients query data, not how the database stores it:

```graphql
# Bad: mirrors database tables
type Product {
  id: ID!
  name: String!
  category_id: Int!        # Exposes FK, forces client to make second query
  price_cents: Int!        # Internal format, not client-friendly
}

# Good: models the domain for client consumption
type Product {
  id: ID!
  name: String!
  category: Category!      # Navigable relationship
  price: Money!            # Semantic type with currency
}

type Money {
  amount: Float!
  currency: String!
  formatted: String!       # "$49.99" — client does not need to format
}
```

## Type Design

### Nullable vs. Non-Null

```graphql
type User {
  id: ID!            # Always present (non-null)
  email: String!     # Always present (non-null)
  bio: String        # Optional (nullable)
  avatarUrl: String  # Optional (nullable)
}
```

Rules:
- Mark fields as non-null (`!`) only when you guarantee they always have a value.
- Collection fields should be non-null with nullable items: `tags: [String!]!` (list is always present, items are never null, but list can be empty).
- Do not over-use non-null. If a field can fail to resolve (e.g., from an external service), it should be nullable.

### Enums

```graphql
enum PostVisibility {
  PUBLIC
  FOLLOWERS
  PRIVATE
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

Use UPPER_SNAKE_CASE for enum values. Enums are safer than strings because the schema validates them at query time.

### Custom Scalars

```graphql
scalar DateTime    # ISO 8601: "2025-03-14T10:30:00Z"
scalar URL         # Validated URL string
scalar Email       # Validated email string
scalar JSON        # Arbitrary JSON (use sparingly)
```

Custom scalars provide validation and documentation beyond raw String/Int types.

## Connection-Based Pagination (Relay)

### Structure

```graphql
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int            # Optional: can be expensive to compute
}

type PostEdge {
  cursor: String!            # Opaque cursor for this edge
  node: Post!                # The actual data
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Query Usage

```graphql
query {
  user(id: "123") {
    posts(first: 10, after: "cursor_abc") {
      edges {
        cursor
        node {
          id
          title
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

### Arguments

| Argument | Type | Purpose |
|----------|------|---------|
| `first` | Int | Forward pagination: return first N items |
| `after` | String | Forward pagination: after this cursor |
| `last` | Int | Backward pagination: return last N items |
| `before` | String | Backward pagination: before this cursor |

Implement `first`/`after` at minimum. Add `last`/`before` only if backward pagination is needed.

## Mutations

### Input Types

Always use dedicated input types for mutations:

```graphql
input CreatePostInput {
  content: String!
  visibility: PostVisibility!
  mediaIds: [ID!]
  tagIds: [ID!]
}

input UpdatePostInput {
  content: String
  visibility: PostVisibility
  tagIds: [ID!]
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostResult!
  updatePost(id: ID!, input: UpdatePostInput!): UpdatePostResult!
}
```

Benefits:
- Input types can be reused across mutations.
- Adding fields to an input type is backward compatible.
- Cleaner mutation signatures.

### Result Types (Union-Based Errors)

```graphql
union CreatePostResult = Post | ValidationError | AuthorizationError

type ValidationError {
  field: String!
  message: String!
}

type AuthorizationError {
  message: String!
}
```

The client handles results with inline fragments:

```graphql
mutation {
  createPost(input: { content: "Hello", visibility: PUBLIC }) {
    ... on Post {
      id
      content
    }
    ... on ValidationError {
      field
      message
    }
    ... on AuthorizationError {
      message
    }
  }
}
```

Advantages over throwing errors:
- Type-safe error handling at the schema level.
- Clients see all possible outcomes in the schema.
- Partial success is expressible (some mutations succeed, some fail).

## DataLoader

### The N+1 Problem

```graphql
query {
  posts(first: 20) {        # 1 query: fetch 20 posts
    edges {
      node {
        author {             # 20 queries: fetch author for each post
          name
        }
        comments {           # 20 queries: fetch comments for each post
          totalCount
        }
      }
    }
  }
}
# Total: 1 + 20 + 20 = 41 queries
```

### DataLoader Solution

DataLoader batches and deduplicates loader calls within a single tick:

```typescript
const userLoader = new DataLoader<string, User>(async (userIds) => {
  // One query: SELECT * FROM users WHERE id IN (id1, id2, ..., id20)
  const users = await db.users.findByIds(userIds);
  // Return in the same order as the input IDs
  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id) ?? new Error(`User ${id} not found`));
});

// In the resolver:
Post: {
  author: (post, _args, ctx) => ctx.loaders.userLoader.load(post.authorId),
}
```

Result: 41 queries become 3 queries (posts, batch authors, batch comment counts).

### DataLoader Rules

1. **Create per-request.** DataLoaders cache results. Creating a shared loader across requests would serve stale data.
2. **One loader per entity type.** `userLoader`, `postLoader`, `commentCountLoader`.
3. **Return in order.** The batch function must return results in the same order as the input IDs.
4. **Handle missing entities.** Return `Error` instances for IDs that do not exist (not `null`).
5. **Avoid side effects.** Loaders are for reading. Do not use them for writes.

## Authorization

### Field-Level Authorization

```typescript
Post: {
  email: (post, _args, ctx) => {
    // Only the post author can see their email on the post object
    if (ctx.viewer?.id !== post.authorId) return null;
    return post.email;
  },
}
```

### Type-Level Authorization

```typescript
Query: {
  adminDashboard: (_parent, _args, ctx) => {
    if (!ctx.viewer?.isAdmin) {
      throw new GraphQLError('Forbidden', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    return getAdminDashboard();
  },
}
```

### Visibility-Based Authorization

```typescript
Post: {
  // Resolver checks visibility rules
  __resolveReference: async (post, ctx) => {
    const fullPost = await ctx.loaders.postLoader.load(post.id);
    if (fullPost.visibility === 'PRIVATE' && fullPost.authorId !== ctx.viewer?.id) {
      return null; // Post is invisible to this viewer
    }
    if (fullPost.visibility === 'FOLLOWERS') {
      const isFollowing = await ctx.loaders.followingLoader.load({
        followerId: ctx.viewer?.id,
        followeeId: fullPost.authorId,
      });
      if (!isFollowing) return null;
    }
    return fullPost;
  },
}
```

## Subscriptions

```graphql
type Subscription {
  onNewComment(postId: ID!): Comment!
  onPostReaction(postId: ID!): ReactionCount!
  onNewFollower: User!
}
```

Implementation considerations:
- Use WebSocket transport (graphql-ws protocol).
- Authenticate on connection init, not per subscription.
- Implement per-user subscription limits (prevent resource exhaustion).
- Use Redis Pub/Sub or Kafka for multi-instance event distribution.
- Set idle timeout to clean up unused subscriptions.

## Performance

### Query Complexity Limiting

Prevent expensive queries from consuming excessive resources:

```typescript
const complexityConfig = {
  maximumComplexity: 1000,
  defaultComplexity: 1,
  scalarCost: 0,
  objectCost: 1,
  listFactor: 10, // Multiply by first/last argument
};

// This query has complexity: 1 (user) + 10 * (1 (post) + 10 * 1 (comment)) = 111
query {
  user(id: "123") {          # cost: 1
    posts(first: 10) {       # cost: 10 * (1 + children)
      node {
        comments(first: 10) { # cost: 10 * 1
          node { body }
        }
      }
    }
  }
}
```

### Query Depth Limiting

```typescript
const depthLimit = 7; // Reject queries deeper than 7 levels
```

Prevents deeply nested queries that can cause exponential data fetching.

### Persisted Queries

For production, use persisted queries (also called automatic persisted queries):

1. During build: extract all queries into a manifest with hashes.
2. Client sends hash instead of full query string.
3. Server looks up query by hash.

Benefits: smaller payloads, no query parsing, prevents arbitrary queries from unknown clients.
