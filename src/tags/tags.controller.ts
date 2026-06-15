import { Body, Controller, Delete, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TagsService } from './providers/tags.service';
import { CreateTagDto } from './dtos/create-tag.dto';
import { Tag } from './tag.entity';

/**
 * Handles all HTTP traffic under the /tags route prefix.
 *
 * Route summary:
 *   POST   /tags              → create a new tag
 *   DELETE /tags?id=<n>       → hard-delete (permanently removes the row)
 *   DELETE /tags/soft-delete?id=<n> → soft-delete (sets deleteDate, row stays in DB)
 *
 * Hard-delete vs Soft-delete:
 *   Use hard-delete when you want the tag gone permanently.
 *   Use soft-delete to preserve historical data / allow recovery via restore().
 */
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  public create(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(createTagDto);
  }

  // id is passed as a query param: DELETE /tags?id=5
  @Delete()
  public delete(@Query('id', ParseIntPipe) id: number) {
    return this.tagsService.delete(id);
  }

  // id is passed as a query param: DELETE /tags/soft-delete?id=5
  @Delete('soft-delete')
  public softDelete(@Query('id', ParseIntPipe) id: number) {
    return this.tagsService.softRemove(id);
  }
}
