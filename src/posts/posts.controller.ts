import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PostsService } from './providers/posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { PatchPostDTO } from './dtos/patch-post.dto';

/**
 * Handles all HTTP traffic under the /posts route prefix.
 *
 * Route summary:
 *   GET    /posts/:userId   → all posts (userId param currently unused in service)
 *   POST   /posts           → create a post (with optional tags and meta-options)
 *   PATCH  /posts           → partial update; post id is in the request body
 *   DELETE /posts?id=<n>    → hard-delete post + orphaned meta-option row
 */
@Controller('posts')
@ApiTags('Posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // The {/:userId} syntax makes userId an optional route segment.
  @Get('{/:userId}')
  public getPosts(@Param('userId') userId: number) {
    return this.postsService.findAll(userId);
  }

  @ApiOperation({ summary: 'Creating a new blog post' })
  @ApiResponse({ status: 201, description: 'You get a 201 response if your post is created successfully' })
  @Post()
  public createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @ApiOperation({ summary: 'Updating an existing blog post' })
  @ApiResponse({ status: 200, description: 'A 200 response if your post is updated successfully' })
  @Patch()
  public updatePost(@Body() patchPostDto: PatchPostDTO) {
    return this.postsService.update(patchPostDto);
  }

  // id is passed as a query param (?id=1) rather than a path segment (/posts/1)
  // because the @Delete decorator has no path argument here.
  @Delete()
  @ApiOperation({ summary: 'Delete a post', description: 'Deletes a post and its associated meta options by ID' })
  @ApiParam({ name: 'id', type: 'integer', description: 'The ID of the post to delete', example: 1 })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID supplied' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  public async delete(@Query('id', ParseIntPipe) id: number) {
    return await this.postsService.delete(id);
  }
}
