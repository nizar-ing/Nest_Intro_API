import { Module } from '@nestjs/common';
import { MetaOptionsController } from './meta-options.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaOption } from './meta-option.entity';
import { MetaOptionsService } from './providers/meta-options.service';

/**
 * MetaOptionsModule handles standalone creation of MetaOption rows.
 *
 * In practice, MetaOption rows are usually created automatically via
 * the Post → MetaOption cascade (see Post.metaOptions with cascade: true).
 * This module's POST /meta-options endpoint allows creating them independently,
 * though it requires the consuming client to associate them with a post separately.
 *
 * Note: MetaOptionsService is NOT exported — PostsModule directly injects the
 * MetaOption repository (registered via TypeOrmModule.forFeature in PostsModule)
 * to handle orphan cleanup on post delete.
 */
@Module({
  controllers: [MetaOptionsController],
  imports: [TypeOrmModule.forFeature([MetaOption])],
  providers: [MetaOptionsService],
})
export class MetaOptionsModule {}
