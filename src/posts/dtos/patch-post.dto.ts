import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreatePostDto } from './create-post.dto';

/**
 * DTO for PATCH /posts.
 *
 * PartialType from @nestjs/swagger (not @nestjs/mapped-types) is used here so that
 * Swagger decorators from CreatePostDto are inherited alongside the validation rules.
 *
 * id is added as a required field so the service knows which post to update —
 * it is sent in the request body rather than the URL because the route has no :id segment.
 */
export class PatchPostDTO extends PartialType(CreatePostDto) {
  @ApiProperty({ description: 'The ID of the post that needs to be updated' })
  @IsInt()
  @IsNotEmpty()
  id: number;
}
