import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';

/**
 * `tags` table — reusable labels that can be attached to many posts.
 *
 * Soft-delete pattern:
 *   @DeleteDateColumn adds a nullable `deleteDate` column.
 *   When tagsRepository.softDelete(id) is called, TypeORM sets deleteDate to NOW()
 *   instead of removing the row. All subsequent queries automatically exclude rows
 *   where deleteDate IS NOT NULL (TypeORM adds a WHERE clause behind the scenes).
 *   Use tagsRepository.restore(id) or withDeleted() to access soft-deleted rows.
 *
 * Relationship:
 *   Tag >--< Post (ManyToMany, inverse side — the join table is defined on Post via @JoinTable).
 *   onDelete: 'CASCADE' removes the join-table row when the tag is hard-deleted.
 */
@Entity({ name: 'tags' })
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 256, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 256, nullable: false, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  schema?: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  featuredImageUrl?: string;

  // Inverse side of Post.tags — @JoinTable lives on Post, so Post is the owner.
  @ManyToMany(() => Post, (post) => post.tags, { onDelete: 'CASCADE' })
  posts: Post[];

  // TypeORM populates these automatically; no manual assignment needed.
  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  // Populated by softDelete(); NULL means the tag is active.
  @DeleteDateColumn()
  deleteDate: Date;
}
