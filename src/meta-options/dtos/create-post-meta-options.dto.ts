import { IsJSON, IsNotEmpty } from 'class-validator';

/**
 * DTO for POST /meta-options and for the nested metaOptions field in CreatePostDto.
 *
 * metaValue must be a valid JSON string (e.g. '{"SidebarEnabled":true}').
 * class-validator's @IsJSON() calls JSON.parse internally to validate.
 * The value is stored verbatim in the PostgreSQL JSON column on MetaOption.
 */
export class CreatePostMetaOptionsDto {
  @IsNotEmpty()
  @IsJSON()
  metaValue: string;
}
