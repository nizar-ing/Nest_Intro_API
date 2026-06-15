import { Post } from 'src/posts/post.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * `meta-options` table — stores arbitrary key/value metadata for a single post.
 *
 * Relationship:
 *   MetaOption --o Post (OneToOne, inverse side).
 *   The FK column `post_id` lives on THIS table (defined by @JoinColumn here).
 *   The owning/cascade side is Post.metaOptions — saving a Post with a nested
 *   metaOptions object will INSERT this row automatically.
 *
 * Deletion note:
 *   Because @JoinColumn is on MetaOption (not Post), deleting a Post does NOT
 *   cascade-delete the MetaOption automatically. PostsService.delete() handles
 *   this manually by calling metaOptionsRepository.delete(post.metaOptions.id).
 */
@Entity({ name: 'meta-options' })
export class MetaOption {
  @PrimaryGeneratedColumn()
  id: number;

  // Stored as a PostgreSQL JSON column; the value must be a valid JSON string.
  @Column({ type: 'json', nullable: false })
  metaValue: string;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  // @JoinColumn places the FK (`post_id`) on this table, making MetaOption the DB owner.
  @OneToOne(() => Post, (post) => post.metaOptions)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
