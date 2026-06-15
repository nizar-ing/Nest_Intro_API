/**
 * Represents the editorial lifecycle stage of a post.
 * Stored as a PostgreSQL ENUM column on the `posts` table.
 *
 * Typical flow: DRAFT → REVIEW → SCHEDULED → PUBLISHED
 */
export enum PostStatus {
  DRAFT     = 'draft',
  SCHEDULED = 'scheduled',
  REVIEW    = 'review',
  PUBLISHED = 'published',
}
