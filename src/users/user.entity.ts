import { Post } from 'src/posts/post.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

/**
 * `users` table — represents a registered author of the blog.
 *
 * Relationship summary:
 *   User --< Post  (one user can write many posts; inverse side is Post.author)
 */
@Entity({ name: 'users' })
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  // Column `name` overrides the default snake_case conversion TypeORM would apply.
  @Column({ name: 'firstname', type: 'varchar', length: 96, nullable: false })
  firstName: string;

  @Column({ name: 'lastname', type: 'varchar', length: 96, nullable: true })
  lastName: string;

  @Column({ name: 'email', type: 'varchar', length: 96, nullable: false, unique: true })
  email: string;

  // Stored as plain text here — hash before persisting in a real implementation.
  @Column({ name: 'password', type: 'varchar', length: 96, nullable: false })
  password: string;

  // Lazy collection — posts are NOT fetched unless explicitly joined or relations option is set.
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
