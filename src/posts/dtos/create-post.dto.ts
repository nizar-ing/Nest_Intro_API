import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CreatePostMetaOptionsDto } from '../../meta-options/dtos/create-post-meta-options.dto';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';

/**
 * DTO for POST /posts.
 *
 * Notable patterns:
 *   - tags is an array of existing Tag IDs (not inline tag objects).
 *     PostsService resolves them to Tag entities before persisting.
 *   - metaOptions is a nested object validated with @ValidateNested + @Type.
 *     @Type(() => CreatePostMetaOptionsDto) tells class-transformer to instantiate
 *     the nested DTO so class-validator rules on it are applied recursively.
 *   - authorId is a FK reference to an existing User, validated in the service layer.
 */
export class CreatePostDto {

  @ApiProperty({ description: 'The title for the blog post', example: 'This is a title' })
  @IsString()
  @MinLength(4)
  @MaxLength(512)
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: PostType, description: "Possible values: 'post', 'page', 'story', 'series'" })
  @IsEnum(PostType)
  @IsNotEmpty()
  postType: PostType;

  // Slug must be lowercase kebab-case: letters, digits, and hyphens only.
  @ApiProperty({ description: "For example - 'my-url'", example: 'my-blog-post' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "A Slug should be all small letters and uses only '-' and without spaces. For example 'my-url'",
  })
  slug: string;

  @ApiProperty({ enum: PostStatus, description: "Possible values: 'draft', 'scheduled', 'review', 'published'" })
  @IsEnum(PostStatus)
  @IsNotEmpty()
  status: PostStatus;

  @ApiPropertyOptional({ description: 'This is the content of the post', example: 'The post content' })
  @IsString()
  @IsOptional()
  content?: string;

  // Must be a valid serialised JSON string, e.g. '{"@context":"https://schema.org"}'.
  @ApiPropertyOptional({ description: 'Serialize your JSON object else a validation error will be thrown', example: '{"@context":"https://schema.org","@type":"Person"}' })
  @IsOptional()
  @IsJSON()
  schema?: string;

  @ApiPropertyOptional({ description: 'Featured image for your blog post', example: 'http://localhost.com/images/image1.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(1024)
  featuredImageUrl?: string;

  // Must be a valid ISO 8601 date-time string (e.g. "2026-02-25T10:46:32+0000").
  @ApiPropertyOptional({ description: 'The date on which your post is published', example: '2026-02-25T10:46:32+0000' })
  @IsISO8601()
  @IsOptional()
  publishOn?: Date;

  // Array of existing Tag primary keys — resolved to Tag entities by PostsService.
  @ApiPropertyOptional({ description: 'Array of tag IDs', example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tags?: number[];

  /**
   * Inline MetaOption for the post.
   * @ValidateNested ensures class-validator descends into the nested object.
   * @Type(() => CreatePostMetaOptionsDto) is required for class-transformer to
   * instantiate the correct class (plain objects don't carry validator metadata).
   */
  @ApiPropertyOptional({
    type: 'object',
    properties: {
      metaValue: {
        type: 'string',
        description: 'The metaValue is a JSON string',
        example: '{"SidebarEnabled":true}',
      },
    },
    additionalProperties: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMetaOptionsDto)
  metaOptions?: CreatePostMetaOptionsDto | undefined;

  // FK to User.id — the author must already exist in the database.
  @ApiProperty({ type: 'integer', required: true })
  @IsNotEmpty()
  @IsInt()
  authorId: number;
}
