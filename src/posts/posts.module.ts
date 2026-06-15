import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './providers/posts.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { MetaOption } from '../meta-options/meta-option.entity';
import { TagsModule } from '../tags/tags.module';

/**
 * PostsModule owns the posts domain and orchestrates its cross-module dependencies.
 *
 * Why MetaOption is registered here (not only in MetaOptionsModule):
 *   PostsService must manually delete orphaned MetaOption rows after deleting a post
 *   (TypeORM's OneToOne cascade does not cover DELETE in this direction).
 *   Registering MetaOption here gives PostsService its own MetaOption repository.
 *
 * Imported modules:
 *   UsersModule  — exposes UsersService so PostsService can look up post authors.
 *   TagsModule   — exposes TagsService so PostsService can resolve tag IDs to entities.
 */
@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [
    UsersModule,
    TagsModule,
    TypeOrmModule.forFeature([Post, MetaOption]),
  ],
})
export class PostsModule {}
