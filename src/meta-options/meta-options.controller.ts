import { Body, Controller, Post } from '@nestjs/common';
import { CreatePostMetaOptionsDto } from './dtos/create-post-meta-options.dto';
import { MetaOptionsService } from './providers/meta-options.service';

/**
 * Handles HTTP traffic under the /meta-options route prefix.
 *
 * Route summary:
 *   POST /meta-options → create a standalone MetaOption row
 *
 * In most cases MetaOptions are created automatically through the Post cascade.
 * This endpoint is useful for creating them independently (e.g. admin tooling).
 */
@Controller('meta-options')
export class MetaOptionsController {

  constructor(private readonly metaOptionsService: MetaOptionsService) {}

  @Post()
  public create(@Body() createPostMetaOptionsDto: CreatePostMetaOptionsDto) {
    // `return` was missing — the service result was silently discarded, producing
    // an empty 200 body. NestJS sends 201 by default for POST handlers that return a value.
    return this.metaOptionsService.create(createPostMetaOptionsDto);
  }
}
