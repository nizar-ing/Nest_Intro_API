/**
 * Controls the layout/template type rendered by the front-end for a given post.
 * Stored as a PostgreSQL ENUM column on the `posts` table.
 */
export enum PostType {
  POST   = 'post',
  PAGE   = 'page',
  STORY  = 'story',
  SERIES = 'series',
}
