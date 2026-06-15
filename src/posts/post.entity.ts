import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PostType } from './enums/post-type.enum';
import { PostStatus } from './enums/post-status.enum';
import { MetaOption } from '../meta-options/meta-option.entity';
import { User } from 'src/users/user.entity';
import { Tag } from '../tags/tag.entity';

/**
 * `posts` table — central entity of the blog.
 *
 * Relationship summary:
 *   Post >--  User        (ManyToOne: many posts share one author)
 *   Post --o  MetaOption  (OneToOne: one optional meta-options row per post)
 *   Post >--< Tag         (ManyToMany: a post can carry multiple tags)
 */
@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'title', type: 'varchar', length: 512, nullable: false })
  title: string;

  @Column({ name: 'post-type', type: 'enum', enum: PostType, nullable: false, default: PostType.POST })
  postType: PostType;

  @Column({ name: 'slug', type: 'varchar', length: 256, nullable: false, unique: true })
  slug: string;

  @Column({ name: 'post-status', type: 'enum', enum: PostStatus, nullable: false, default: PostStatus.DRAFT })
  status: PostStatus;

  @Column({ name: 'content', type: 'text', nullable: true })
  content?: string;

  // Stores JSON-LD or schema.org markup as a serialised JSON string.
  @Column({ name: 'schema', type: 'text', nullable: true })
  schema?: string;

  @Column({ name: 'featured-image-url', type: 'varchar', length: 1024, nullable: true })
  featuredImageUrl?: string;

  @Column({ name: 'publish-on', type: 'timestamp', nullable: true })
  publishOn?: Date;

  /**
   * cascade: true — when we save a Post with a nested metaOptions object,
   * TypeORM will automatically INSERT/UPDATE the MetaOption row as well.
   *
   * eager: true — metaOptions is always JOIN-loaded whenever a Post is fetched,
   * without needing to specify { relations: { metaOptions: true } } each time.
   *
   * ⚠️  TypeORM does NOT cascade DELETE through a OneToOne by default.
   * PostsService.delete() handles the MetaOption deletion manually.
   */
  @OneToOne(() => MetaOption, (metaOption) => metaOption.post, { cascade: true, eager: true })
  metaOptions?: MetaOption;

  /**
   * @JoinTable() must be placed on the owning side of a ManyToMany relationship.
   * TypeORM creates a join table `posts_tags_tags` (or similar) to store the pairs.
   * Tags are NOT eagerly loaded — use { relations: { tags: true } } when needed.
   */
  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable()
  tags?: Tag[];

  // The FK column `authorId` lives on the `posts` table (owning side of the ManyToOne).
  @ManyToOne(() => User, (user) => user.posts)
  author: User;
}
