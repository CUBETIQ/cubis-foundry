# Example: GraphQL Schema for Social Content Platform

## Prompt

> Design a GraphQL schema for a social platform with users, posts, comments, and reactions. Support Relay-style pagination, input types for mutations, union types for error handling, and show how to prevent N+1 queries with DataLoader.

## Response

### Schema Definition

```graphql
# ─── Enums ───────────────────────────────────

enum PostVisibility {
  PUBLIC
  FOLLOWERS
  PRIVATE
}

enum ReactionType {
  LIKE
  LOVE
  LAUGH
  SURPRISE
  SAD
}

# ─── Core Types ──────────────────────────────

type User {
  id: ID!
  username: String!
  displayName: String!
  avatarUrl: String
  bio: String
  followerCount: Int!
  followingCount: Int!
  isFollowedByViewer: Boolean!
  posts(first: Int, after: String): PostConnection!
}

type Post {
  id: ID!
  author: User!
  content: String!
  visibility: PostVisibility!
  media: [MediaAttachment!]!
  tags: [Tag!]!
  reactionCounts: [ReactionCount!]!
  viewerReaction: ReactionType
  commentCount: Int!
  comments(first: Int, after: String): CommentConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Comment {
  id: ID!
  author: User!
  post: Post!
  body: String!
  reactionCounts: [ReactionCount!]!
  createdAt: DateTime!
}

type MediaAttachment {
  id: ID!
  url: String!
  mimeType: String!
  width: Int
  height: Int
  altText: String
}

type Tag {
  id: ID!
  name: String!
  postCount: Int!
}

type ReactionCount {
  type: ReactionType!
  count: Int!
}

# ─── Relay Connection Types ──────────────────

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  cursor: String!
  node: Post!
}

type CommentConnection {
  edges: [CommentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CommentEdge {
  cursor: String!
  node: Comment!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# ─── Input Types ─────────────────────────────

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

input CreateCommentInput {
  postId: ID!
  body: String!
}

# ─── Error Types ─────────────────────────────

type ValidationError {
  field: String!
  message: String!
}

type AuthorizationError {
  message: String!
}

type NotFoundError {
  entityType: String!
  entityId: ID!
}

# ─── Result Union Types ─────────────────────

union CreatePostResult = Post | ValidationError | AuthorizationError
union UpdatePostResult = Post | ValidationError | NotFoundError | AuthorizationError
union CreateCommentResult = Comment | ValidationError | NotFoundError | AuthorizationError
union ReactResult = Post | NotFoundError | AuthorizationError

# ─── Queries ─────────────────────────────────

type Query {
  viewer: User
  user(username: String!): User
  post(id: ID!): Post
  feed(first: Int = 20, after: String): PostConnection!
  search(query: String!, first: Int = 20, after: String): PostConnection!
  trending(first: Int = 10): [Tag!]!
}

# ─── Mutations ───────────────────────────────

type Mutation {
  createPost(input: CreatePostInput!): CreatePostResult!
  updatePost(id: ID!, input: UpdatePostInput!): UpdatePostResult!
  deletePost(id: ID!): Boolean!
  createComment(input: CreateCommentInput!): CreateCommentResult!
  react(postId: ID!, type: ReactionType!): ReactResult!
  removeReaction(postId: ID!): ReactResult!
  follow(userId: ID!): User!
  unfollow(userId: ID!): User!
}

# ─── Subscriptions ───────────────────────────

type Subscription {
  onNewComment(postId: ID!): Comment!
  onNewReaction(postId: ID!): ReactionCount!
  onNewFollower: User!
}

scalar DateTime
```

### DataLoader Architecture

DataLoaders are instantiated per-request to prevent cross-request caching:

```typescript
import DataLoader from 'dataloader';

function createLoaders(db: Database) {
  return {
    userById: new DataLoader<string, User>(async (ids) => {
      const users = await db.users.findByIds(ids);
      const userMap = new Map(users.map(u => [u.id, u]));
      return ids.map(id => userMap.get(id) ?? new Error(`User ${id} not found`));
    }),

    postsByAuthor: new DataLoader<string, Post[]>(async (authorIds) => {
      const posts = await db.posts.findByAuthorIds(authorIds);
      const grouped = groupBy(posts, 'authorId');
      return authorIds.map(id => grouped[id] ?? []);
    }),

    reactionCountsByPost: new DataLoader<string, ReactionCount[]>(async (postIds) => {
      const counts = await db.reactions.countByPostIds(postIds);
      const grouped = groupBy(counts, 'postId');
      return postIds.map(id => grouped[id] ?? []);
    }),

    commentCountByPost: new DataLoader<string, number>(async (postIds) => {
      const counts = await db.comments.countByPostIds(postIds);
      const countMap = new Map(counts.map(c => [c.postId, c.count]));
      return postIds.map(id => countMap.get(id) ?? 0);
    }),

    viewerReactionByPost: new DataLoader<string, ReactionType | null>(async (postIds) => {
      // Uses viewer context from request
      const reactions = await db.reactions.findByViewerAndPostIds(postIds);
      const reactionMap = new Map(reactions.map(r => [r.postId, r.type]));
      return postIds.map(id => reactionMap.get(id) ?? null);
    }),
  };
}
```

### Resolver with Visibility Enforcement

```typescript
const resolvers = {
  Query: {
    feed: async (_parent, { first, after }, ctx) => {
      // Feed only includes posts the viewer is authorized to see
      const viewerId = ctx.viewer?.id;
      return ctx.db.posts.findFeed({
        viewerId,
        first,
        after,
        visibilityFilter: viewerId
          ? ['PUBLIC', 'FOLLOWERS'] // Include FOLLOWERS posts from people viewer follows
          : ['PUBLIC'],             // Anonymous users see only PUBLIC
      });
    },
  },

  Post: {
    author: (post, _args, ctx) => ctx.loaders.userById.load(post.authorId),
    reactionCounts: (post, _args, ctx) => ctx.loaders.reactionCountsByPost.load(post.id),
    commentCount: (post, _args, ctx) => ctx.loaders.commentCountByPost.load(post.id),
    viewerReaction: (post, _args, ctx) => ctx.loaders.viewerReactionByPost.load(post.id),
  },

  Mutation: {
    createPost: async (_parent, { input }, ctx) => {
      if (!ctx.viewer) return { __typename: 'AuthorizationError', message: 'Authentication required.' };

      const errors = validateCreatePost(input);
      if (errors.length > 0) return { __typename: 'ValidationError', ...errors[0] };

      const post = await ctx.db.posts.create({ ...input, authorId: ctx.viewer.id });
      return { __typename: 'Post', ...post };
    },
  },

  CreatePostResult: {
    __resolveType: (obj) => obj.__typename,
  },
};
```

### N+1 Query Prevention

Without DataLoader, rendering a feed of 20 posts generates:

| Query | Count |
|-------|-------|
| Fetch 20 posts | 1 |
| Fetch author for each post | 20 |
| Fetch reaction counts for each | 20 |
| Fetch comment counts for each | 20 |
| **Total** | **61 queries** |

With DataLoader, all 20 author lookups are batched into a single `WHERE id IN (...)` query:

| Query | Count |
|-------|-------|
| Fetch 20 posts | 1 |
| Batch fetch authors | 1 |
| Batch fetch reaction counts | 1 |
| Batch fetch comment counts | 1 |
| **Total** | **4 queries** |
